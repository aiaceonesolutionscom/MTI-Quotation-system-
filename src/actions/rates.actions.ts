"use server";

import { prisma } from "@/lib/prisma";
import { findMatchingRate } from "@/lib/rate-lookup";

/**
 * Lists a product's active priced specification combinations, for the quotation
 * builder's "Specification" picker — only combinations with a configured rate are
 * ever selectable, so an unpriced combination can't reach the quotation.
 */
export async function listProductRates(productId: string) {
  const rates = await prisma.productRate.findMany({
    where: { productId, status: true },
    include: { size: true, rangeType: true, uom: true },
    orderBy: [{ size: { name: "asc" } }, { rangeType: { name: "asc" } }],
  });
  return rates.map((r) => ({
    id: r.id,
    sizeId: r.sizeId,
    sizeName: r.size.name,
    rangeTypeId: r.rangeTypeId,
    rangeTypeName: r.rangeType.name,
    uomId: r.uomId,
    uomName: r.uom.name,
    rate: r.rate.toString(),
  }));
}

/**
 * Live rate lookup used by the quotation builder. Gated on quotation-write access
 * (not the rates module) so Sales Users can look up rates while building a quotation
 * without needing access to Rates management themselves.
 */
export async function lookupRate(input: {
  productId: string;
  sizeId: string;
  rangeTypeId: string;
  uomId: string;
}): Promise<{ rate?: string; rateId?: string; error?: string }> {
  const match = await findMatchingRate(prisma, input);
  if (!match) {
    return { error: "No rate configured for this product/specification combination." };
  }
  return { rate: match.rate.toString(), rateId: match.id };
}
