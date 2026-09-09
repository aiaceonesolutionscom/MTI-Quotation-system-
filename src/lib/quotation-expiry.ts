import type { QuotationStatus } from "@/generated/prisma/enums";

export const EXPIRY_VALIDITY_DAYS = 7;
export const EXPIRING_SOON_DAYS = 3;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateExpirationDate(quotationDate: Date): Date {
  return addDays(quotationDate, EXPIRY_VALIDITY_DAYS);
}

const TERMINAL_STATUSES: QuotationStatus[] = ["ACCEPTED", "REJECTED"];

/** A quotation's real-world status, factoring in expiry without needing a background job. */
export function getEffectiveStatus(quotation: { status: QuotationStatus; expirationDate: Date }): QuotationStatus {
  if (!TERMINAL_STATUSES.includes(quotation.status) && quotation.expirationDate < new Date()) {
    return "EXPIRED";
  }
  return quotation.status;
}

export function isEditable(quotation: { status: QuotationStatus }): boolean {
  return quotation.status !== "ACCEPTED" && quotation.status !== "REJECTED";
}
