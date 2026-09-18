import { z } from "zod";

export const customerSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(255),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  status: z.boolean(),
});
export type CustomerInput = z.infer<typeof customerSchema>;
