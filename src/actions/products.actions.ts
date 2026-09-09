"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productSchema, type ProductOutput } from "@/lib/validations/product.schema";

type ActionResult = { error?: string };

function toProductData(parsed: ProductOutput) {
  return {
    name: parsed.name,
    categoryId: parsed.categoryId,
    status: parsed.status,
  };
}

function dedupeRates(rates: ProductOutput["rates"]): ActionResult & { rates?: ProductOutput["rates"] } {
  const seen = new Set<string>();
  for (const r of rates) {
    const key = `${r.sizeId}|${r.rangeTypeId}|${r.uomId}`;
    if (seen.has(key)) {
      return { error: "Two rate rows have the same Size + Range/Type + UOM combination." };
    }
    seen.add(key);
  }
  return { rates };
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const deduped = dedupeRates(data.rates);
  if (deduped.error) return deduped;

  let id: string;
  try {
    id = await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.create({ data: toProductData(data) });
        if (deduped.rates!.length > 0) {
          await tx.productRate.createMany({
            data: deduped.rates!.map((r) => ({
              productId: product.id,
              sizeId: r.sizeId,
              rangeTypeId: r.rangeTypeId,
              uomId: r.uomId,
              rate: r.rate,
              status: r.status,
            })),
          });
        }
        return product.id;
      },
      { maxWait: 20_000, timeout: 30_000 }
    );
  } catch {
    return { error: "Unable to create product. Please try again." };
  }

  revalidatePath("/products");
  redirect(`/products/${id}`);
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const deduped = dedupeRates(data.rates);
  if (deduped.error) return deduped;

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.product.update({ where: { id }, data: toProductData(data) });
        await tx.productRate.deleteMany({ where: { productId: id } });
        if (deduped.rates!.length > 0) {
          await tx.productRate.createMany({
            data: deduped.rates!.map((r) => ({
              productId: id,
              sizeId: r.sizeId,
              rangeTypeId: r.rangeTypeId,
              uomId: r.uomId,
              rate: r.rate,
              status: r.status,
            })),
          });
        }
      },
      { maxWait: 20_000, timeout: 30_000 }
    );
  } catch {
    return { error: "Unable to update product. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function toggleProductStatus(id: string, status: boolean): Promise<ActionResult> {
  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath("/products");
  return {};
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const usageCount = await prisma.quotationItem.count({ where: { productId: id } });
  if (usageCount > 0) {
    return { error: "Product could not be deleted because it is used in existing quotations." };
  }

  await prisma.productRate.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  return {};
}