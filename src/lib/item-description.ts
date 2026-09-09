/**
 * Builds the quotation line-item description from product/spec data so the sales
 * user never has to type it by hand, e.g. "SS GLOBE VALVE 2\" PN16 (Flange type, Luton UK)".
 * The result is snapshotted onto QuotationItem immediately and never regenerated later.
 */
export function generateItemDescription(input: {
  productName: string;
  sizeName?: string | null;
  rangeTypeName?: string | null;
}): string {
  const parts = [input.productName, input.sizeName, input.rangeTypeName].filter(
    (part): part is string => !!part && part.trim().length > 0
  );
  return parts.join(" ");
}
