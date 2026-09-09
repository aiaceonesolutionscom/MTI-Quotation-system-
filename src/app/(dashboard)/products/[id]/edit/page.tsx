import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, uoms, rates] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.uom.findMany({ orderBy: { name: "asc" } }),
    prisma.productRate.findMany({ where: { productId: id }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Product" description={product.name} />
      <ProductForm
        product={product}
        categories={categories}
        uoms={uoms}
        existingRates={rates.map((r) => ({ ...r, rate: r.rate.toString() }))}
      />
    </div>
  );
}