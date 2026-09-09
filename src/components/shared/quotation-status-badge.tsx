import { Badge } from "@/components/ui/badge";
import type { QuotationStatus } from "@/generated/prisma/enums";

const STATUS_STYLES: Record<QuotationStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  GENERATED: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  EXPIRED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}
