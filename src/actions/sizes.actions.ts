"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { sizeSchema } from "@/lib/validations/lookup.schema";

type ActionResult = { error?: string };

export async function createSize(input: unknown): Promise<ActionResult> {
  const parsed = sizeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const duplicate = await prisma.size.findFirst({
    where: { categoryId: parsed.data.categoryId, name: { equals: parsed.data.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return { error: "A size with this name already exists in this category." };

  await prisma.size.create({ data: parsed.data });

  revalidatePath(`/masters/categories/${parsed.data.categoryId}`);
  return {};
}

export async function updateSize(id: string, input: unknown): Promise<ActionResult> {
  const parsed = sizeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const duplicate = await prisma.size.findFirst({
    where: { categoryId: parsed.data.categoryId, name: { equals: parsed.data.name, mode: "insensitive" }, NOT: { id } },
    select: { id: true },
  });
  if (duplicate) return { error: "A size with this name already exists in this category." };

  await prisma.size.update({ where: { id }, data: parsed.data });

  revalidatePath(`/masters/categories/${parsed.data.categoryId}`);
  return {};
}

export async function toggleSizeStatus(id: string, status: boolean): Promise<ActionResult> {
  const size = await prisma.size.update({ where: { id }, data: { status } });
  if (size.categoryId) revalidatePath(`/masters/categories/${size.categoryId}`);
  return {};
}

export async function deleteSize(id: string): Promise<ActionResult> {
  const rateCount = await prisma.productRate.count({ where: { sizeId: id } });
  if (rateCount > 0) {
    return { error: "This size could not be deleted because it is used by existing rates." };
  }

  const size = await prisma.size.delete({ where: { id } });
  if (size.categoryId) revalidatePath(`/masters/categories/${size.categoryId}`);
  return {};
}

export async function createSizesBulk(categoryId: string, names: string[]): Promise<ActionResult & { count?: number }> {
  const seen = new Set<string>();
  const clean = names
    .map((n) => n.trim())
    .filter(Boolean)
    .filter((n) => {
      const key = n.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (clean.length === 0) return { error: "Enter at least one size." };

  const result = await prisma.size.createMany({
    data: clean.map((name) => ({ name, categoryId })),
    skipDuplicates: true,
  });

  revalidatePath(`/masters/categories/${categoryId}`);
  return { count: result.count };
}

export async function listSizesByCategory(categoryId: string) {
  await requireSession();
  if (!categoryId) return [];
  return prisma.size.findMany({
    where: { categoryId, status: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
