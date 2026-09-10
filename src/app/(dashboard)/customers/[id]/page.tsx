import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, FilePlus, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { QuotationStatusBadge } from "@/components/shared/quotation-status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { deleteCustomer } from "@/actions/customers.actions";

export default async function CustomerViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      quotations: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { quotations: true } },
    },
  });
  if (!customer) notFound();

  async function handleDelete() {
    "use server";
    return deleteCustomer(id);
  }

  const fields: [string, string][] = [
    ["Country", customer.country ?? "\u2014"],
    ["City", customer.city ?? "\u2014"],
    ["Status", customer.status ? "Active" : "Inactive"],
    ["Created", formatDate(customer.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.companyName}
        actions={
          <>
            <Button variant="outline" render={<Link href={`/quotations/new?customer=${id}`} />}>
              <FilePlus /> New Quotation
            </Button>
            <Button variant="outline" render={<Link href={`/customers/${id}/edit`} />}>
              <Pencil /> Edit
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="text-destructive">
                  <Trash2 /> Delete
                </Button>
              }
              title="Delete customer?"
              description={`This will permanently delete "${customer.companyName}". This cannot be undone.`}
              successMessage="Customer deleted."
              successHref="/customers"
              onConfirm={handleDelete}
            />
          </>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="space-y-5 pt-6">
          <div>
            <Badge variant={customer.status ? "default" : "secondary"}>
              {customer.status ? "Active" : "Inactive"}
            </Badge>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Recent Quotations ({customer._count.quotations})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.quotations.length === 0 ? (
            <EmptyState icon={FileText} title="No quotations yet" description="This customer has no quotations." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      <Link href={`/quotations/${q.id}`} className="hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(q.quotationDate)}</TableCell>
                    <TableCell className="text-right">{formatMoney(q.grandTotal.toString())}</TableCell>
                    <TableCell>
                      <QuotationStatusBadge status={q.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}