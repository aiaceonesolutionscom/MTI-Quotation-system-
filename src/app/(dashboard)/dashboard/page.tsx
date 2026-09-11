import Link from "next/link";
import { FilePlus, Package, Users, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LiveStatusBadge } from "@/components/shared/live-status-badge";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { DashboardStats } from "./dashboard-stats";

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

  const totalValue = allQuotations.reduce((sum, q) => sum + Number(q.grandTotal), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your quotations, products and customers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardStats
          totalProducts={totalProducts}
          totalCustomers={totalCustomers}
          totalQuotations={totalQuotations}
          quotations={allQuotations.map((q) => ({
            status: q.status,
            expirationDate: q.expirationDate.getTime(),
          }))}
          totalValue={totalValue}
        />
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
                      <LiveStatusBadge status={q.status} expirationDate={q.expirationDate.getTime()} />
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