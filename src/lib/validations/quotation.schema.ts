import { z } from "zod";

export const quotationItemSchema = z
  .object({
    productId: z.string().optional().nullable(),
    sizeId: z.string().optional().nullable(),
    rangeTypeId: z.string().optional().nullable(),
    uomId: z.string().optional().nullable(),
    productRateId: z.string().optional().nullable(),
    descriptionSnapshot: z.string().trim().max(500).optional(),
    uomSnapshot: z.string().trim().max(50).optional(),
    quantity: z.coerce.number().int("Quantity must be a whole number greater than 0").positive("Quantity must be a whole number greater than 0"),
    matchedRateSnapshot: z.coerce.number().nullable().optional(),
    finalRate: z.coerce.number().min(0, "Rate must be zero or greater"),
    isOverridden: z.boolean(),
  })
  .superRefine((item, ctx) => {
    if (item.productId) {
      if (!item.sizeId) ctx.addIssue({ code: "custom", message: "Size is required", path: ["sizeId"] });
      if (!item.rangeTypeId) ctx.addIssue({ code: "custom", message: "Range/Type is required", path: ["rangeTypeId"] });
      if (!item.uomId) ctx.addIssue({ code: "custom", message: "UOM is required", path: ["uomId"] });
    } else {
      if (!item.descriptionSnapshot) {
        ctx.addIssue({ code: "custom", message: "Description is required", path: ["descriptionSnapshot"] });
      }
      if (!item.uomSnapshot) {
        ctx.addIssue({ code: "custom", message: "UOM is required", path: ["uomSnapshot"] });
      }
    }
  });
export type QuotationItemInput = z.input<typeof quotationItemSchema>;
export type QuotationItemOutput = z.output<typeof quotationItemSchema>;

export const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  quotationDate: z.coerce.date(),
  discountType: z.enum(["AMOUNT", "PERCENT"]).nullable(),
  discountValue: z.coerce.number().min(0).nullable(),
  gstEnabled: z.boolean(),
  gstPercent: z.coerce.number().min(0).max(100),
  additionalTaxEnabled: z.boolean(),
  additionalTaxName: z.string().trim().max(100).optional().or(z.literal("")),
  additionalTaxPercent: z.coerce.number().min(0).max(100).nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(quotationItemSchema).min(1, "Add at least one product"),
});
export type QuotationInput = z.input<typeof quotationSchema>;
export type QuotationOutput = z.output<typeof quotationSchema>;

export const quotationStatusSchema = z.object({
  status: z.enum(["DRAFT", "GENERATED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
});
