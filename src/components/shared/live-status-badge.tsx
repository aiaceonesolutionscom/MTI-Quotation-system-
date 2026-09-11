"use client";

import type { QuotationStatus } from "@/generated/prisma/enums";
import { getEffectiveStatus } from "@/lib/quotation-expiry";
import { useExpiryTick } from "@/hooks/use-expiry-tick";
import { QuotationStatusBadge } from "@/components/shared/quotation-status-badge";

/** Status badge that auto-refreshes when a quotation expires while the page is open. */
export function LiveStatusBadge({ status, expirationDate }: { status: QuotationStatus; expirationDate: number }) {
  const now = useExpiryTick();
  return <QuotationStatusBadge status={getEffectiveStatus({ status, expirationDate: new Date(expirationDate) }, now)} />;
}