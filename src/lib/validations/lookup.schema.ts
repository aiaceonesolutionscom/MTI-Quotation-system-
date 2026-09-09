import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  status: z.boolean(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const sizeSchema = z.object({
  name: z.string().trim().min(1, "Size name is required").max(50),
  categoryId: z.string().min(1, "Category is required"),
  status: z.boolean(),
});
export type SizeInput = z.infer<typeof sizeSchema>;

export const rangeTypeSchema = z.object({
  name: z.string().trim().min(1, "Range/Type name is required").max(50),
  categoryId: z.string().min(1, "Category is required"),
  status: z.boolean(),
});
export type RangeTypeInput = z.infer<typeof rangeTypeSchema>;

export const uomSchema = z.object({
  name: z.string().trim().min(1, "UOM/UOC name is required").max(50),
  status: z.boolean(),
});
export type UomInput = z.infer<typeof uomSchema>;
