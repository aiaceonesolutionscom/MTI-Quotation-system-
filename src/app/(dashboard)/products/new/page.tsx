import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const [categories, uoms] = await Promise.all([
    prisma.category.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.uom.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Add Product" description="Create a new product in the catalog." />
      <ProductForm categories={categories} uoms={uoms} />
    </div>
  );
}