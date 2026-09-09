import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { isEditable } from "@/lib/quotation-expiry";
import { QuotationForm, type QuotationBuilderValues } from "../../quotation-form";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [quotation, customers, products, sizes, rangeTypes, uoms, taxSettings] = await Promise.all([
    prisma.quotation.findUnique({ where: { id }, include: { items: true } }),
    prisma.customer.findMany({ where: { status: true }, orderBy: { companyName: "asc" } }),
    prisma.product.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.size.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.rangeType.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.uom.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.taxSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!quotation) notFound();

  if (!isEditable(quotation)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Quotation" description={quotation.quotationNumber} />
        <p className="text-sm text-muted-foreground">
          This quotation can no longer be edited because it has been {quotation.status.toLowerCase()}.
        </p>
      </div>
    );
  }

  const initialValues: QuotationBuilderValues = {
    customerId: quotation.customerId,
    quotationDate: quotation.quotationDate.toISOString().slice(0, 10),
    discountType: quotation.discountType,
    discountValue: quotation.discountValue != null ? Number(quotation.discountValue) : null,
    gstEnabled: quotation.gstEnabled,
    gstPercent: Number(quotation.gstPercent),
    additionalTaxEnabled: quotation.additionalTaxEnabled,
    additionalTaxName: quotation.additionalTaxName ?? "",
    additionalTaxPercent: quotation.additionalTaxPercent != null ? Number(quotation.additionalTaxPercent) : null,
    notes: quotation.notes ?? "",
    items: quotation.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        productId: item.productId ?? "",
        sizeId: item.sizeId ?? "",
        rangeTypeId: item.rangeTypeId ?? "",
        uomId: item.uomId ?? "",
        productRateId: item.productRateId ?? "",
        descriptionSnapshot: item.descriptionSnapshot,
        uomSnapshot: item.uomSnapshot,
        quantity: Number(item.quantity),
        matchedRateSnapshot: item.matchedRateSnapshot != null ? Number(item.matchedRateSnapshot) : null,
        finalRate: Number(item.finalRate),
        isOverridden: item.isOverridden,
      })),
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Quotation" description={quotation.quotationNumber} />
      <QuotationForm
        quotationId={id}
        initialValues={initialValues}
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
      />
    </div>
  );
}
