import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, DollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { deleteProduct } from "@/actions/products.actions";

export default async function ProductViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      _count: { select: { quotationItems: true } },
      rates: {
        include: { size: true, rangeType: true, uom: true },
        orderBy: [{ status: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!product) notFound();

  async function handleDelete() {
    "use server";
    return deleteProduct(id);
  }

  const fields: [string, string][] = [
    ["Category", product.category.name],
    ["Status", product.status ? "Active" : "Inactive"],
    ["Used in Quotations", String(product._count.quotationItems)],
    ["Created", formatDate(product.createdAt)],
    ["Last Updated", formatDate(product.updatedAt)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.category.name}
        actions={
          <>
            <Button variant="outline" render={<Link href={`/products/${id}`} />}>
              <Pencil /> Edit
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="text-destructive">
                  <Trash2 /> Delete
                </Button>
              }
              title="Delete product?"
              description={`This will permanently delete "${product.name}" and all its rates. This cannot be undone.`}
              successMessage="Product deleted."
              successHref="/products"
              onConfirm={handleDelete}
            />
          </>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="space-y-5 pt-6">
          <div>
            <Badge variant={product.status ? "default" : "secondary"}>
              {product.status ? "Active" : "Inactive"}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rates</CardTitle>
          <Button size="sm" variant="outline" render={<Link href={`/products/${id}/edit`} />}>
            <Pencil /> Manage Rates
          </Button>
        </CardHeader>
        <CardContent>
          {product.rates.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No rates configured"
              description="Add a Size + Range/Type + UOM combination with a rate before this product can be quoted."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Range/Type</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.size.name}</TableCell>
                    <TableCell>{r.rangeType.name}</TableCell>
                    <TableCell>{r.uom.name}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.rate.toString())}</TableCell>
                    <TableCell>
                      <Badge variant={r.status ? "default" : "secondary"}>
                        {r.status ? "Active" : "Inactive"}
                      </Badge>
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