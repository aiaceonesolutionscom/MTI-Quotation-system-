"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/lookup.schema";

type ActionResult = { error?: string };

export async function createCategory(input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const duplicate = await prisma.category.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return { error: "A category with this name already exists." };

  await prisma.category.create({ data: parsed.data });

  revalidatePath("/masters/categories");
  return {};
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const duplicate = await prisma.category.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" }, NOT: { id } },
    select: { id: true },
  });
  if (duplicate) return { error: "A category with this name already exists." };

  await prisma.category.update({ where: { id }, data: parsed.data });

  revalidatePath("/masters/categories");
  return {};
}

export async function toggleCategoryStatus(id: string, status: boolean): Promise<ActionResult> {
  await prisma.category.update({ where: { id }, data: { status } });
  revalidatePath("/masters/categories");
  return {};
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      error: `This category could not be deleted because it is used by ${productCount} product${productCount === 1 ? "" : "s"}.`,
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/masters/categories");
  return {};
}
