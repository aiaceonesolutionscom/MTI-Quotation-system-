"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setQuotationStatus } from "@/actions/quotations.actions";
import type { QuotationStatus } from "@/generated/prisma/enums";

const STATUSES: QuotationStatus[] = ["DRAFT", "GENERATED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
const LABELS: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export function StatusChanger({ id, status }: { id: string; status: QuotationStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await setQuotationStatus(id, { status: value });
          if (result?.error) toast.error(result.error);
          else toast.success("Status updated.");
        })
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
