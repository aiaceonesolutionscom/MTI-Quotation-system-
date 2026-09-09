import Link from "next/link";
import { FilePlus, Package, Users, FileText, FileClock, CheckCircle2, Clock3, DollarSign, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuotationStatusBadge } from "@/components/shared/quotation-status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getEffectiveStatus } from "@/lib/quotation-expiry";

const RECENT_COUNT = 7;

export default async function DashboardPage() {
  const [totalProducts, totalCustomers, totalQuotations, allQuotations, recentQuotations] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.quotation.count(),
    prisma.quotation.findMany({ select: { status: true, expirationDate: true, grandTotal: true } }),
    prisma.quotation.findMany({
      take: RECENT_COUNT,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
  ]);

  let draftCount = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let totalValue = 0;

  for (const q of allQuotations) {
    const effective = getEffectiveStatus(q);
    if (q.status === "DRAFT") draftCount++;
    if (effective === "EXPIRED") expiredCount++;
    else if (effective !== "ACCEPTED" && effective !== "REJECTED") activeCount++;
    totalValue += Number(q.grandTotal);
  }

  const cards = [
    { label: "Total Products", value: totalProducts, icon: Package },
    { label: "Total Customers", value: totalCustomers, icon: Users },
    { label: "Total Quotations", value: totalQuotations, icon: FileText },
    { label: "Draft Quotations", value: draftCount, icon: FileClock },
    { label: "Active Quotations", value: activeCount, icon: Clock3 },
    { label: "Expired Quotations", value: expiredCount, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your quotations, products and customers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <c.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-tight">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight">{formatMoney(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Total Quotation Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/quotations/new" />}>
          <FilePlus /> New Quotation
        </Button>
        <Button variant="outline" render={<Link href="/products/new" />}>
          <Package /> Add Product
        </Button>
        <Button variant="outline" render={<Link href="/customers/new" />}>
          <Users /> Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Quotations</CardTitle>
          <Button variant="outline" size="sm" render={<Link href="/quotations" />}>
            <History /> View Quotation History
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentQuotations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No quotations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotations.map((q) => (
                  <TableRow key={q.id} className="cursor-pointer">
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
                      <QuotationStatusBadge status={getEffectiveStatus(q)} />
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