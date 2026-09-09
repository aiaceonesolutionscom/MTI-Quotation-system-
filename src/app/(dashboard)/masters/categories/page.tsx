import Link from "next/link";
import { Tags, Settings2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListPagination } from "@/components/shared/list-pagination";
import { FilterSearch } from "@/components/shared/filter-search";
import { MasterDialog } from "@/components/shared/master-dialog";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { createCategory, updateCategory, toggleCategoryStatus, deleteCategory } from "@/actions/categories.actions";

const PAGE_SIZE = 20;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = typeof params.q === "string" ? params.q : "";
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true, sizes: true, rangeTypes: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.category.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("page", String(p));
    return `/masters/categories?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize products into categories."
        actions={
          <MasterDialog
            entityLabel="Category"
            namePlaceholder="e.g. Valve"
            onCreate={createCategory}
            onUpdate={updateCategory}
          />
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FilterSearch placeholder="Search categories…" className="max-w-md" />
          {categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title={q ? "No categories found" : "No categories yet"}
              description={q ? "Try adjusting your search." : "Add your first product category."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Sizes</TableHead>
                  <TableHead>Range/Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c._count.products}</TableCell>
                    <TableCell>{c._count.sizes}</TableCell>
                    <TableCell>{c._count.rangeTypes}</TableCell>
                    <TableCell>
                      <Badge variant={c.status ? "default" : "secondary"}>
                        {c.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" render={<Link href={`/masters/categories/${c.id}`} />}>
                          <Settings2 /> Sizes & Ranges
                        </Button>
                        <MasterRowActions
                          entityLabel="Category"
                          item={c}
                          onCreate={createCategory}
                          onUpdate={updateCategory}
                          onToggleStatus={toggleCategoryStatus}
                          onDelete={deleteCategory}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <ListPagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </CardContent>
      </Card>
    </div>
  );
}
