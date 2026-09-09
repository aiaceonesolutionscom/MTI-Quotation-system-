import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;
