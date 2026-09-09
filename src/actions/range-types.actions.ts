"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { rangeTypeSchema } from "@/lib/validations/lookup.schema";

type ActionResult = { error?: string };

export async function createRangeType(input: unknown): Promise<ActionResult> {
  const parsed = rangeTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const duplicate = await prisma.rangeType.findFirst({
    where: { categoryId: parsed.data.categoryId, name: { equals: parsed.data.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return { error: "A range/type with this name already exists in this category." };

  await prisma.rangeType.create({ data: parsed.data });

  revalidatePath(`/masters/categories/${parsed.data.categoryId}`);
  return {};
}

export async function updateRangeType(id: string, input: unknown): Promise<ActionResult> {
  const parsed = rangeTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const duplicate = await prisma.rangeType.findFirst({
    where: { categoryId: parsed.data.categoryId, name: { equals: parsed.data.name, mode: "insensitive" }, NOT: { id } },
    select: { id: true },
  });
  if (duplicate) return { error: "A range/type with this name already exists in this category." };

  await prisma.rangeType.update({ where: { id }, data: parsed.data });

  revalidatePath(`/masters/categories/${parsed.data.categoryId}`);
  return {};
}

export async function toggleRangeTypeStatus(id: string, status: boolean): Promise<ActionResult> {
  const rangeType = await prisma.rangeType.update({ where: { id }, data: { status } });
  if (rangeType.categoryId) revalidatePath(`/masters/categories/${rangeType.categoryId}`);
  return {};
}

export async function deleteRangeType(id: string): Promise<ActionResult> {
  const rateCount = await prisma.productRate.count({ where: { rangeTypeId: id } });
  if (rateCount > 0) {
    return { error: "This range/type could not be deleted because it is used by existing rates." };
  }

  const rangeType = await prisma.rangeType.delete({ where: { id } });
  if (rangeType.categoryId) revalidatePath(`/masters/categories/${rangeType.categoryId}`);
  return {};
}

export async function createRangeTypesBulk(
  categoryId: string,
  names: string[]
): Promise<ActionResult & { count?: number }> {
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
  if (clean.length === 0) return { error: "Enter at least one range/type." };

  const result = await prisma.rangeType.createMany({
    data: clean.map((name) => ({ name, categoryId })),
    skipDuplicates: true,
  });

  revalidatePath(`/masters/categories/${categoryId}`);
  return { count: result.count };
}

export async function listRangeTypesByCategory(categoryId: string) {
  await requireSession();
  if (!categoryId) return [];
  return prisma.rangeType.findMany({
    where: { categoryId, status: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
