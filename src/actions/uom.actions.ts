"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uomSchema } from "@/lib/validations/lookup.schema";

type ActionResult = { error?: string };

export async function createUom(input: unknown): Promise<ActionResult> {
  const parsed = uomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await prisma.uom.create({ data: parsed.data });
  } catch {
    return { error: "A UOM with this name already exists." };
  }

  revalidatePath("/masters/uom");
  return {};
}

export async function updateUom(id: string, input: unknown): Promise<ActionResult> {
  const parsed = uomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await prisma.uom.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "A UOM with this name already exists." };
  }

  revalidatePath("/masters/uom");
  return {};
}

export async function toggleUomStatus(id: string, status: boolean): Promise<ActionResult> {
  await prisma.uom.update({ where: { id }, data: { status } });
  revalidatePath("/masters/uom");
  return {};
}

export async function deleteUom(id: string): Promise<ActionResult> {
  const rateCount = await prisma.productRate.count({ where: { uomId: id } });
  if (rateCount > 0) {
    return { error: "This UOM could not be deleted because it is used by existing rates." };
  }

  await prisma.uom.delete({ where: { id } });
  revalidatePath("/masters/uom");
  return {};
}
