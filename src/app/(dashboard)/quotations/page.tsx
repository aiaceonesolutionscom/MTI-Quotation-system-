import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListPagination } from "@/components/shared/list-pagination";
import { LiveStatusBadge } from "@/components/shared/live-status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { isEditable, EXPIRING_SOON_DAYS, addDays } from "@/lib/quotation-expiry";
import { QuotationFilters } from "./quotation-filters";
import { QuotationRowActions } from "./quotation-row-actions";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const customer = typeof params.customer === "string" ? params.customer : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const status = typeof params.status === "string" ? params.status : "";
  const quick = typeof params.quick === "string" ? params.quick : "";
  const page = Math.max(1, Number(params.page) || 1);

  const now = new Date();
  const where: Prisma.QuotationWhereInput = {
    ...(q ? { quotationNumber: { contains: q, mode: "insensitive" } } : {}),
    ...(customer ? { customerId: customer } : {}),
    ...(status ? { status: status as Prisma.EnumQuotationStatusFilter["equals"] } : {}),
  };

  if (from || to) {
    where.quotationDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  if (quick === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.quotationDate = { gte: start, lt: addDays(start, 1) };
  } else if (quick === "this_week") {
    const day = now.getDay();
    const start = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -day);
    where.quotationDate = { gte: start, lt: addDays(start, 7) };
  } else if (quick === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    where.quotationDate = { gte: start, lt: end };
  } else if (quick === "expired") {
    where.expirationDate = { lt: now };
    where.status = { notIn: ["ACCEPTED", "REJECTED"] };
  } else if (quick === "expiring_soon") {
    where.expirationDate = { gte: now, lte: addDays(now, EXPIRING_SOON_DAYS) };
    where.status = { notIn: ["ACCEPTED", "REJECTED"] };
  } else if (quick === "active") {
    where.expirationDate = { gte: now };
    where.status = { notIn: ["ACCEPTED", "REJECTED"] };
  }

  const [quotations, total, customers] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: { customer: true, createdBy: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.quotation.count({ where }),
    prisma.customer.findMany({ where: { status: true }, orderBy: { companyName: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (customer) sp.set("customer", customer);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (status) sp.set("status", status);
    if (quick) sp.set("quick", quick);
    sp.set("page", String(p));
    return `/quotations?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Create and manage all quotations."
        actions={
          <Button render={<Link href="/quotations/new" />}>
            <Plus /> New Quotation
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <QuotationFilters customers={customers.map((c) => ({ id: c.id, name: c.companyName }))} />

          {quotations.length === 0 ? (
            <EmptyState icon={FileText} title="No quotations found" description="Try adjusting your filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        <Link href={`/quotations/${q.id}`} className="hover:underline">
                          {q.quotationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{q.customer.companyName}</TableCell>
                      <TableCell>{formatDate(q.quotationDate)}</TableCell>
                      <TableCell>{formatDate(q.expirationDate)}</TableCell>
                      <TableCell className="text-right">{formatMoney(q.grandTotal.toString())}</TableCell>
                      <TableCell>
                        <LiveStatusBadge status={q.status} expirationDate={q.expirationDate.getTime()} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{q.createdBy.name}</TableCell>
                      <TableCell>
                        <QuotationRowActions
                          quotation={{ id: q.id, quotationNumber: q.quotationNumber, editable: isEditable(q) }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </CardContent>
      </Card>
    </div>
  );
}
