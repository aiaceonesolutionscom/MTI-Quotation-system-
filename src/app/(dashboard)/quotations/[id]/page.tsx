import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, FileDown, Printer, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getEffectiveStatus, isEditable } from "@/lib/quotation-expiry";
import { deleteQuotation } from "@/actions/quotations.actions";
import { StatusChanger } from "./status-changer";
import { DuplicateQuotationButton } from "./duplicate-quotation-button";
import { QuotationStatusBadge } from "@/components/shared/quotation-status-badge";
import { BackLink } from "@/components/shared/back-link";

export default async function QuotationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quotation) notFound();

  const effectiveStatus = getEffectiveStatus(quotation);
  const editable = isEditable(quotation);

  async function handleDelete() {
    "use server";
    return deleteQuotation(id);
  }

  return (
    <div className="space-y-6">
      <BackLink href="/quotations" label="Back to Quotations" />
      <PageHeader
        title={quotation.quotationNumber}
        description={quotation.customer.companyName}
        actions={
          <>
            <StatusChanger id={id} status={quotation.status} />
            {editable && (
              <Button variant="outline" render={<Link href={`/quotations/${id}/edit`} />}>
                <Pencil /> Edit
              </Button>
            )}
            <Button variant="outline" render={<Link href={`/api/quotations/${id}/pdf`} target="_blank" />}>
              <FileDown /> PDF
            </Button>
            <Button variant="outline" render={<Link href={`/api/quotations/${id}/pdf`} target="_blank" />}>
              <Printer /> Print
            </Button>
            <DuplicateQuotationButton quotationId={id} quotationNumber={quotation.quotationNumber} />
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="text-destructive">
                  <Trash2 /> Delete
                </Button>
              }
              title="Delete quotation?"
              description={`This will permanently delete "${quotation.quotationNumber}". This cannot be undone.`}
              successMessage="Quotation deleted."
              successHref="/quotations"
              onConfirm={handleDelete}
            />
          </>
        }
      />

      <div className="flex items-center gap-3">
        <QuotationStatusBadge status={effectiveStatus} />
        <span className="text-sm text-muted-foreground">
          {formatDate(quotation.quotationDate)} — Expires {formatDate(quotation.expirationDate)}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">S.No</TableHead>
                <TableHead>Item Description</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    {item.descriptionSnapshot}
                    {item.isOverridden && (
                      <span className="ml-2 text-xs text-amber-600">(rate overridden)</span>
                    )}
                  </TableCell>
                  <TableCell>{item.uomSnapshot}</TableCell>
                  <TableCell className="text-right">{item.quantity.toString()}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.finalRate.toString())}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.lineTotal.toString())}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(quotation.subtotal.toString())}</span>
            </div>
            {Number(quotation.discountAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>− {formatMoney(quotation.discountAmount.toString())}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span>{formatMoney(quotation.taxableAmount.toString())}</span>
            </div>
            {quotation.gstEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({quotation.gstPercent.toString()}%)</span>
                <span>{formatMoney(quotation.gstAmount.toString())}</span>
              </div>
            )}
            {quotation.additionalTaxEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {quotation.additionalTaxName} ({quotation.additionalTaxPercent?.toString() ?? 0}%)
                </span>
                <span>{formatMoney(quotation.additionalTaxAmount.toString())}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatMoney(quotation.grandTotal.toString())}</span>
            </div>
            <p className="pt-2 text-xs italic text-muted-foreground">{quotation.amountInWords}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created By</span>
              <span>{quotation.createdBy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(quotation.createdAt)}</span>
            </div>
            {quotation.notes && (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p>{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
