import { Ruler } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListPagination } from "@/components/shared/list-pagination";
import { FilterSearch } from "@/components/shared/filter-search";
import { MasterDialog } from "@/components/shared/master-dialog";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { createUom, updateUom, toggleUomStatus, deleteUom } from "@/actions/uom.actions";

const PAGE_SIZE = 20;

export default async function UomPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = typeof params.q === "string" ? params.q : "";
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

  const [uoms, total] = await Promise.all([
    prisma.uom.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { rates: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.uom.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("page", String(p));
    return `/masters/uom?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="UOM / UOC"
        description="Units of measure used across products, rates and quotations."
        actions={
          <MasterDialog entityLabel="UOM/UOC" namePlaceholder="e.g. NOS" onCreate={createUom} onUpdate={updateUom} />
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FilterSearch placeholder="Search UOM/UOC…" className="max-w-md" />
          {uoms.length === 0 ? (
            <EmptyState
              icon={Ruler}
              title={q ? "No UOM/UOC found" : "No UOM/UOC yet"}
              description={q ? "Try adjusting your search." : "Add your first unit of measure."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uoms.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u._count.rates}</TableCell>
                    <TableCell>
                      <Badge variant={u.status ? "default" : "secondary"}>
                        {u.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <MasterRowActions
                        entityLabel="UOM/UOC"
                        item={u}
                        onCreate={createUom}
                        onUpdate={updateUom}
                        onToggleStatus={toggleUomStatus}
                        onDelete={deleteUom}
                      />
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
