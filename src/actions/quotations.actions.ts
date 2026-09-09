"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { quotationSchema, quotationStatusSchema, type QuotationOutput } from "@/lib/validations/quotation.schema";
import { calculateQuotation } from "@/lib/quotation-calc";
import { findMatchingRate } from "@/lib/rate-lookup";
import { generateItemDescription } from "@/lib/item-description";
import { calculateExpirationDate, isEditable } from "@/lib/quotation-expiry";
import { allocateQuotationNumber } from "@/lib/quotation-number";
import { numberToWords } from "@/lib/number-to-words";
import type { Prisma } from "@/generated/prisma/client";

type ActionResult = { error?: string };
type Tx = Prisma.TransactionClient;

async function resolveQuotationItems(tx: Tx, items: QuotationOutput["items"]) {
  const productIds = [...new Set(items.filter((i) => i.productId).map((i) => i.productId!))];
  const sizeIds = [...new Set(items.filter((i) => i.sizeId).map((i) => i.sizeId!))];
  const rangeTypeIds = [...new Set(items.filter((i) => i.rangeTypeId).map((i) => i.rangeTypeId!))];
  const uomIds = [...new Set(items.filter((i) => i.uomId).map((i) => i.uomId!))];

  const [products, sizes, rangeTypes, uoms] = await Promise.all([
    tx.product.findMany({ where: { id: { in: productIds } } }),
    tx.size.findMany({ where: { id: { in: sizeIds } } }),
    tx.rangeType.findMany({ where: { id: { in: rangeTypeIds } } }),
    tx.uom.findMany({ where: { id: { in: uomIds } } }),
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const sizeMap = new Map(sizes.map((s) => [s.id, s]));
  const rangeTypeMap = new Map(rangeTypes.map((r) => [r.id, r]));
  const uomMap = new Map(uoms.map((u) => [u.id, u]));

  const resolved: {
    sortOrder: number;
    productId: string | null;
    sizeId: string | null;
    rangeTypeId: string | null;
    uomId: string | null;
    productRateId: string | null;
    productNameSnapshot: string;
    descriptionSnapshot: string;
    sizeSnapshot: string | null;
    rangeTypeSnapshot: string | null;
    uomSnapshot: string;
    quantity: number;
    matchedRateSnapshot: number | null;
    finalRate: number;
    isOverridden: boolean;
  }[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    if (!item.productId) {
      // Custom/manual line item — no linked product, size, range or UOM master record.
      const description = item.descriptionSnapshot?.trim();
      const uomText = item.uomSnapshot?.trim();
      if (!description) return { error: `Line ${index + 1}: description is required.` };
      if (!uomText) return { error: `Line ${index + 1}: UOM is required.` };

      resolved.push({
        sortOrder: index,
        productId: null,
        sizeId: null,
        rangeTypeId: null,
        uomId: null,
        productRateId: null,
        productNameSnapshot: description,
        descriptionSnapshot: description,
        sizeSnapshot: null,
        rangeTypeSnapshot: null,
        uomSnapshot: uomText,
        quantity: item.quantity,
        matchedRateSnapshot: null,
        finalRate: item.finalRate,
        isOverridden: true,
      });
      continue;
    }

    const product = productMap.get(item.productId);
    const size = item.sizeId ? sizeMap.get(item.sizeId) : undefined;
    const rangeType = item.rangeTypeId ? rangeTypeMap.get(item.rangeTypeId) : undefined;
    const uom = item.uomId ? uomMap.get(item.uomId) : undefined;
    if (!product || !size || !rangeType || !uom) {
      return { error: `Line ${index + 1}: one of the selected values no longer exists.` };
    }

    let finalRate = item.finalRate;
    let matchedRateSnapshot = item.matchedRateSnapshot ?? null;
    let productRateId = item.productRateId ?? null;

    if (!item.isOverridden) {
      const match = await findMatchingRate(tx, {
        productId: item.productId,
        sizeId: item.sizeId!,
        rangeTypeId: item.rangeTypeId!,
        uomId: item.uomId!,
      });
      if (!match) {
        return {
          error: `Line ${index + 1} (${product.name}): no rate configured for this product/specification combination.`,
        };
      }
      finalRate = Number(match.rate);
      matchedRateSnapshot = Number(match.rate);
      productRateId = match.id;
    }

    const autoDescription = generateItemDescription({
      productName: product.name,
      sizeName: size.name,
      rangeTypeName: rangeType.name,
    });

    resolved.push({
      sortOrder: index,
      productId: product.id,
      sizeId: size.id,
      rangeTypeId: rangeType.id,
      uomId: uom.id,
      productRateId,
      productNameSnapshot: product.name,
      descriptionSnapshot: item.descriptionSnapshot?.trim() || autoDescription,
      sizeSnapshot: size.name,
      rangeTypeSnapshot: rangeType.name,
      uomSnapshot: item.uomSnapshot?.trim() || uom.name,
      quantity: item.quantity,
      matchedRateSnapshot,
      finalRate,
      isOverridden: item.isOverridden,
    });
  }

  return { items: resolved };
}

export async function createQuotation(input: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = quotationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  let newId: string;
  try {
newId = await prisma.$transaction(
      async (tx) => {
        const resolved = await resolveQuotationItems(tx, data.items);
        if (resolved.error) throw new Error(resolved.error);
        const items = resolved.items!;

        const calc = calculateQuotation({
          items: items.map((i) => ({ quantity: i.quantity, finalRate: i.finalRate })),
          discountType: data.discountType,
          discountValue: data.discountValue,
          gstEnabled: data.gstEnabled,
          gstPercent: data.gstPercent,
          additionalTaxEnabled: data.additionalTaxEnabled,
          additionalTaxPercent: data.additionalTaxPercent,
        });

        const quotationNumber = await allocateQuotationNumber(tx);
        const quotationDate = data.quotationDate;
        const expirationDate = calculateExpirationDate(quotationDate);

        const quotation = await tx.quotation.create({
          data: {
            quotationNumber,
            customerId: data.customerId,
            quotationDate,
            expirationDate,
            status: "DRAFT",
            subtotal: calc.subtotal.toString(),
            discountType: data.discountType,
            discountValue: data.discountValue,
            discountAmount: calc.discountAmount.toString(),
            taxableAmount: calc.taxableAmount.toString(),
            gstEnabled: data.gstEnabled,
            gstPercent: data.gstEnabled ? data.gstPercent : 0,
            gstAmount: calc.gstAmount.toString(),
            additionalTaxEnabled: data.additionalTaxEnabled,
            additionalTaxName: data.additionalTaxEnabled ? data.additionalTaxName || "Additional Tax" : null,
            additionalTaxPercent: data.additionalTaxEnabled ? data.additionalTaxPercent : null,
            additionalTaxAmount: calc.additionalTaxAmount.toString(),
            grandTotal: calc.grandTotal.toString(),
            amountInWords: numberToWords(calc.grandTotal),
            notes: data.notes || null,
            createdById: session.user.id,
            items: {
              create: items.map((item, i) => ({
                ...item,
                lineTotal: calc.lineTotals[i].toString(),
              })),
            },
          },
        });

        return quotation.id;
      },
      { maxWait: 20_000, timeout: 30_000 }
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unable to create quotation. Please try again." };
  }

  revalidatePath("/quotations");
  redirect(`/quotations/${newId}`);
}

export async function updateQuotation(id: string, input: unknown): Promise<ActionResult> {
  const parsed = quotationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) return { error: "Quotation not found." };
  if (!isEditable(existing)) {
    return { error: "This quotation can no longer be edited because it has been accepted or rejected." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const resolved = await resolveQuotationItems(tx, data.items);
      if (resolved.error) throw new Error(resolved.error);
      const items = resolved.items!;

      const calc = calculateQuotation({
        items: items.map((i) => ({ quantity: i.quantity, finalRate: i.finalRate })),
        discountType: data.discountType,
        discountValue: data.discountValue,
        gstEnabled: data.gstEnabled,
        gstPercent: data.gstPercent,
        additionalTaxEnabled: data.additionalTaxEnabled,
        additionalTaxPercent: data.additionalTaxPercent,
      });

      const quotationDate = data.quotationDate;
      const expirationDate = calculateExpirationDate(quotationDate);

      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      await tx.quotation.update({
        where: { id },
        data: {
          customerId: data.customerId,
          quotationDate,
          expirationDate,
          subtotal: calc.subtotal.toString(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: calc.discountAmount.toString(),
          taxableAmount: calc.taxableAmount.toString(),
          gstEnabled: data.gstEnabled,
          gstPercent: data.gstEnabled ? data.gstPercent : 0,
          gstAmount: calc.gstAmount.toString(),
          additionalTaxEnabled: data.additionalTaxEnabled,
          additionalTaxName: data.additionalTaxEnabled ? data.additionalTaxName || "Additional Tax" : null,
          additionalTaxPercent: data.additionalTaxEnabled ? data.additionalTaxPercent : null,
          additionalTaxAmount: calc.additionalTaxAmount.toString(),
          grandTotal: calc.grandTotal.toString(),
          amountInWords: numberToWords(calc.grandTotal),
          notes: data.notes || null,
          items: {
            create: items.map((item, i) => ({
              ...item,
              lineTotal: calc.lineTotals[i].toString(),
            })),
          },
        },
      });
    },
      { maxWait: 20_000, timeout: 30_000 }
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unable to update quotation. Please try again." };
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  redirect(`/quotations/${id}`);
}

export async function duplicateQuotation(id: string): Promise<ActionResult & { id?: string }> {
  const session = await requireSession();

  const source = await prisma.quotation.findUnique({ where: { id }, include: { items: true } });
  if (!source) return { error: "Quotation not found." };

  const newId = await prisma.$transaction(
      async (tx) => {
        const quotationNumber = await allocateQuotationNumber(tx);
        const quotationDate = new Date();
        const expirationDate = calculateExpirationDate(quotationDate);

        const created = await tx.quotation.create({
          data: {
            quotationNumber,
            customerId: source.customerId,
            quotationDate,
            expirationDate,
            status: "DRAFT",
            subtotal: source.subtotal,
            discountType: source.discountType,
            discountValue: source.discountValue,
            discountAmount: source.discountAmount,
            taxableAmount: source.taxableAmount,
            gstEnabled: source.gstEnabled,
            gstPercent: source.gstPercent,
            gstAmount: source.gstAmount,
            additionalTaxEnabled: source.additionalTaxEnabled,
            additionalTaxName: source.additionalTaxName,
            additionalTaxPercent: source.additionalTaxPercent,
            additionalTaxAmount: source.additionalTaxAmount,
            grandTotal: source.grandTotal,
            amountInWords: source.amountInWords,
            notes: source.notes,
            createdById: session.user.id,
            duplicatedFromId: source.id,
            items: {
              create: source.items.map((item) => ({
                sortOrder: item.sortOrder,
                productId: item.productId,
                sizeId: item.sizeId,
                rangeTypeId: item.rangeTypeId,
                uomId: item.uomId,
                productRateId: item.productRateId,
                productNameSnapshot: item.productNameSnapshot,
                descriptionSnapshot: item.descriptionSnapshot,
                sizeSnapshot: item.sizeSnapshot,
                rangeTypeSnapshot: item.rangeTypeSnapshot,
                uomSnapshot: item.uomSnapshot,
                quantity: item.quantity,
                matchedRateSnapshot: item.matchedRateSnapshot,
                finalRate: item.finalRate,
                isOverridden: item.isOverridden,
                lineTotal: item.lineTotal,
              })),
            },
          },
        });

        return created.id;
      },
      { maxWait: 20_000, timeout: 30_000 }
    );

  revalidatePath("/quotations");
  return { id: newId };
}

export async function deleteQuotation(id: string): Promise<ActionResult> {
  await prisma.quotation.delete({ where: { id } });
  revalidatePath("/quotations");
  return {};
}

export async function setQuotationStatus(id: string, input: unknown): Promise<ActionResult> {
  const parsed = quotationStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status." };

  await prisma.quotation.update({ where: { id }, data: { status: parsed.data.status } });
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  return {};
}
