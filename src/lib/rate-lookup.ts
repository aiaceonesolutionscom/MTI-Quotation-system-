import type { Prisma } from "@/generated/prisma/client";

type Client = Prisma.TransactionClient;

export interface RateCombo {
  productId: string;
  sizeId: string;
  rangeTypeId: string;
  uomId: string;
}

/**
 * Single source of truth for matching a Product+Size+Range/Type+UOM combination to
 * its configured price. Used identically by the live quotation-builder lookup and
 * the save-time server re-validation — never trust a client-submitted rate unless
 * the line is explicitly marked as overridden.
 */
export async function findMatchingRate(client: Client, combo: RateCombo) {
  const rate = await client.productRate.findUnique({
    where: { productRateCombo: combo },
  });
  return rate && rate.status ? rate : null;
}
