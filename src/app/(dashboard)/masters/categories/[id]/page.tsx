import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { createSize, createSizesBulk, updateSize, toggleSizeStatus, deleteSize } from "@/actions/sizes.actions";
import {
  createRangeType,
  createRangeTypesBulk,
  updateRangeType,
  toggleRangeTypeStatus,
  deleteRangeType,
} from "@/actions/range-types.actions";
import { BulkAddDialog } from "./bulk-add-dialog";
import { SearchableLookupList } from "./searchable-lookup-list";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      sizes: { orderBy: { name: "asc" } },
      rangeTypes: { orderBy: { name: "asc" } },
    },
  });
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={category.name}
        description="Manage the sizes and range/types that belong to this category."
        actions={
          <Button variant="outline" render={<Link href="/masters/categories" />}>
            <ArrowLeft /> Back to Categories
          </Button>
        }
      />

<Card>
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Left: Sizes */}
          <div className="flex min-w-0 flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sizes</CardTitle>
              <BulkAddDialog
                entityLabel="Size"
                placeholder={'e.g.\n2"\n3"\n4"\n6 Meter'}
                onCreateBulk={createSizesBulk.bind(null, id)}
              />
            </CardHeader>
            <CardContent className="flex-1">
              <SearchableLookupList
                entityLabel="Size"
                columnLabel="Size"
                categoryId={id}
                items={category.sizes}
                emptyIcon="size"
                onCreate={createSize}
                onUpdate={updateSize}
                onToggleStatus={toggleSizeStatus}
                onDelete={deleteSize}
              />
            </CardContent>
          </div>

          {/* Right: Range / Types */}
          <div className="flex min-w-0 flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Range / Types</CardTitle>
              <BulkAddDialog
                entityLabel="Range/Type"
                placeholder={"e.g.\nPN10\nPN16\nPN25\nPN40"}
                onCreateBulk={createRangeTypesBulk.bind(null, id)}
              />
            </CardHeader>
            <CardContent className="flex-1">
              <SearchableLookupList
                entityLabel="Range/Type"
                columnLabel="Range/Type"
                categoryId={id}
                items={category.rangeTypes}
                emptyIcon="rangeType"
                onCreate={createRangeType}
                onUpdate={updateRangeType}
                onToggleStatus={toggleRangeTypeStatus}
                onDelete={deleteRangeType}
              />
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
