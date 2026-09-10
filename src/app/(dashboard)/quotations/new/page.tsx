import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { QuotationForm } from "../quotation-form";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultCustomerId = typeof params.customer === "string" ? params.customer : undefined;

  const [customers, products, sizes, rangeTypes, uoms, taxSettings] = await Promise.all([
    prisma.customer.findMany({ where: { status: true }, orderBy: { companyName: "asc" } }),
    prisma.product.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.size.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.rangeType.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.uom.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.taxSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="space-y-6">
      <BackLink href="/quotations" label="Back to Quotations" />
      <PageHeader title="New Quotation" description="Build a new professional quotation." />
      <QuotationForm
        customers={customers.map((c) => ({ id: c.id, name: c.companyName }))}
        products={products}
        sizes={sizes}
        rangeTypes={rangeTypes}
        uoms={uoms}
        defaultGstPercent={Number(taxSettings?.defaultGstPercent ?? 18)}
        defaultAdditionalTaxEnabled={taxSettings?.defaultAdditionalTaxEnabled ?? false}
        defaultAdditionalTaxName={taxSettings?.defaultAdditionalTaxName ?? "Additional Tax"}
        defaultAdditionalTaxPercent={
          taxSettings?.defaultAdditionalTaxPercent != null ? Number(taxSettings.defaultAdditionalTaxPercent) : null
        }
        defaultCustomerId={defaultCustomerId}
      />
    </div>
  );
}
