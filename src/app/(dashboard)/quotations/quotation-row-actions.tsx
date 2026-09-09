"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, Pencil, FileDown, Printer, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { duplicateQuotation, deleteQuotation } from "@/actions/quotations.actions";

export function QuotationRowActions({
  quotation,
}: {
  quotation: { id: string; quotationNumber: string; editable: boolean };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" render={<Link href={`/quotations/${quotation.id}`} />}>
        <Eye className="size-4" />
      </Button>
      {quotation.editable && (
        <Button variant="ghost" size="icon-sm" render={<Link href={`/quotations/${quotation.id}/edit`} />}>
          <Pencil className="size-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        render={<Link href={`/api/quotations/${quotation.id}/pdf`} target="_blank" />}
      >
        <FileDown className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        render={<Link href={`/api/quotations/${quotation.id}/pdf`} target="_blank" />}
      >
        <Printer className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateQuotation(quotation.id);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Quotation duplicated.");
            router.push(`/quotations/${result.id}`);
          })
        }
      >
        <Copy className="size-4" />
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" className="text-destructive">
            <Trash2 className="size-4" />
          </Button>
        }
        title="Delete quotation?"
        description={`This will permanently delete quotation "${quotation.quotationNumber}". This cannot be undone.`}
        onConfirm={() => deleteQuotation(quotation.id)}
      />
    </div>
  );
}
