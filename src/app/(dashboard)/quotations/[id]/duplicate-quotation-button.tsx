"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { duplicateQuotation } from "@/actions/quotations.actions";
import { Copy } from "lucide-react";

export function DuplicateQuotationButton({
  quotationId,
  quotationNumber,
}: {
  quotationId: string;
  quotationNumber: string;
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <Copy /> Duplicate
        </Button>
      }
      title="Duplicate quotation?"
      description={`This will create a new quotation with a new number, today's date, and the same items${quotationNumber ? ` (source: ${quotationNumber})` : ""}.`}
      confirmLabel="Duplicate"
      destructive={false}
      successMessage="Quotation duplicated."
      successHref={(result) => `/quotations/${result?.id}/edit`}
      onConfirm={() => duplicateQuotation(quotationId)}
    />
  );
}