import Decimal from "decimal.js";
import { round2, toDecimal, type MoneyInput } from "@/lib/money";

export interface LineItemInput {
  quantity: MoneyInput;
  finalRate: MoneyInput;
}

export type DiscountType = "AMOUNT" | "PERCENT" | null;

export interface QuotationCalcInput {
  items: LineItemInput[];
  discountType?: DiscountType;
  discountValue?: MoneyInput | null;
  gstEnabled: boolean;
  gstPercent: MoneyInput;
  additionalTaxEnabled: boolean;
  additionalTaxPercent?: MoneyInput | null;
}

export interface QuotationCalcResult {
  lineTotals: Decimal[];
  subtotal: Decimal;
  discountAmount: Decimal;
  taxableAmount: Decimal;
  gstAmount: Decimal;
  additionalTaxAmount: Decimal;
  grandTotal: Decimal;
}

export function calculateLineTotal(item: LineItemInput): Decimal {
  return toDecimal(item.quantity).times(toDecimal(item.finalRate));
}

export function calculateQuotation(input: QuotationCalcInput): QuotationCalcResult {
  const lineTotals = input.items.map((item) => calculateLineTotal(item));
  const subtotal = lineTotals.reduce((sum, t) => sum.plus(t), new Decimal(0));

  let discountAmount = new Decimal(0);
  if (input.discountType === "PERCENT" && input.discountValue != null) {
    discountAmount = subtotal.times(toDecimal(input.discountValue)).dividedBy(100);
  } else if (input.discountType === "AMOUNT" && input.discountValue != null) {
    discountAmount = toDecimal(input.discountValue);
  }

  const taxableAmount = subtotal.minus(discountAmount);

  const gstAmount = input.gstEnabled ? taxableAmount.times(toDecimal(input.gstPercent)).dividedBy(100) : new Decimal(0);

  const additionalTaxAmount =
    input.additionalTaxEnabled && input.additionalTaxPercent != null
      ? taxableAmount.times(toDecimal(input.additionalTaxPercent)).dividedBy(100)
      : new Decimal(0);

  const grandTotal = taxableAmount.plus(gstAmount).plus(additionalTaxAmount);

  return {
    lineTotals: lineTotals.map((t) => round2(t)),
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    taxableAmount: round2(taxableAmount),
    gstAmount: round2(gstAmount),
    additionalTaxAmount: round2(additionalTaxAmount),
    grandTotal: round2(grandTotal),
  };
}
