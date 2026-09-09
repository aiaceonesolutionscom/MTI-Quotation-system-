import { z } from "zod";

export const productRateRowSchema = z.object({
  id: z.string().optional(),
  sizeId: z.string().min(1, "Size is required"),
  rangeTypeId: z.string().min(1, "Range/Type is required"),
  uomId: z.string().min(1, "UOM/UOC is required"),
  rate: z.coerce.number().min(0, "Rate must be zero or greater"),
  status: z.boolean(),
});
export type ProductRateRowInput = z.input<typeof productRateRowSchema>;
export type ProductRateRowOutput = z.output<typeof productRateRowSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(255),
  categoryId: z.string().min(1, "Category is required"),
  status: z.boolean(),
  rates: z.array(productRateRowSchema),
});
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
