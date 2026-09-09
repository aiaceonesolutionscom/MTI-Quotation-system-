import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { QuotationDocument, type QuotationPdfData } from "./components/QuotationDocument";

export async function generateQuotationPdf(quotationId: string): Promise<Buffer | null> {
  const [quotation, company] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true, items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.companySettings.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!quotation) return null;

  const totalQuantity = quotation.items.reduce((sum, i) => sum + Number(i.quantity), 0);

  const data: QuotationPdfData = {
    company: {
      name: company?.name ?? "Master Tech International",
      logoUrl: company?.logoUrl ?? null,
      address: company?.address ?? null,
      strn: company?.strn ?? null,
      ntn: company?.ntn ?? null,
      isoCerts: company?.isoCerts ?? null,
      mobile: company?.mobile ?? null,
      phone: company?.phone ?? null,
      email: company?.email ?? null,
      website: company?.website ?? null,
    },
    customerName: quotation.customer.companyName,
    customerLocation: [quotation.customer.city, quotation.customer.country].filter(Boolean).join(", "),
    quotationNumber: quotation.quotationNumber,
    quotationDate: formatDate(quotation.quotationDate),
    expirationDate: formatDate(quotation.expirationDate),
    items: quotation.items.map((item) => ({
      descriptionSnapshot: item.descriptionSnapshot,
      uomSnapshot: item.uomSnapshot,
      quantity: item.quantity.toString(),
      finalRate: item.finalRate.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
    totals: {
      totalQuantity: totalQuantity.toString(),
      subtotal: quotation.subtotal.toString(),
      discountAmount: quotation.discountAmount.toString(),
      gstEnabled: quotation.gstEnabled,
      gstPercent: quotation.gstPercent.toString(),
      gstAmount: quotation.gstAmount.toString(),
      additionalTaxEnabled: quotation.additionalTaxEnabled,
      additionalTaxName: quotation.additionalTaxName,
      additionalTaxPercent: quotation.additionalTaxPercent?.toString() ?? null,
      additionalTaxAmount: quotation.additionalTaxAmount.toString(),
      grandTotal: quotation.grandTotal.toString(),
      amountInWords: quotation.amountInWords,
    },
  };

  const buffer = await renderToBuffer(<QuotationDocument data={data} />);
  return buffer;
}
