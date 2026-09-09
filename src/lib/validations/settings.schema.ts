import { z } from "zod";

export const companySettingsSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(255),
  logoUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  mobile: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  ntn: z.string().trim().max(50).optional().or(z.literal("")),
  strn: z.string().trim().max(50).optional().or(z.literal("")),
  isoCerts: z.string().trim().max(255).optional().or(z.literal("")),
});
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

export const quotationSettingsSchema = z.object({
  prefix: z.string().trim().min(1, "Prefix is required").max(10),
  nextSequence: z.coerce.number().int().min(1),
  currency: z.string().trim().min(1).max(10),
});
export type QuotationSettingsInput = z.input<typeof quotationSettingsSchema>;
export type QuotationSettingsOutput = z.output<typeof quotationSettingsSchema>;

export const taxSettingsSchema = z.object({
  defaultGstPercent: z.coerce.number().min(0).max(100),
  defaultAdditionalTaxEnabled: z.boolean(),
  defaultAdditionalTaxName: z.string().trim().max(100).optional().or(z.literal("")),
  defaultAdditionalTaxPercent: z.coerce.number().min(0).max(100).nullable(),
});
export type TaxSettingsInput = z.input<typeof taxSettingsSchema>;
export type TaxSettingsOutput = z.output<typeof taxSettingsSchema>;

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
