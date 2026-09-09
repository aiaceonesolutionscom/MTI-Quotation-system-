"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { companySettingsSchema } from "@/lib/validations/settings.schema";

type ActionResult = { error?: string };

export async function updateCompanySettings(input: unknown): Promise<ActionResult> {
  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      mobile: parsed.data.mobile || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      ntn: parsed.data.ntn || null,
      strn: parsed.data.strn || null,
      isoCerts: parsed.data.isoCerts || null,
    },
    create: {
      id: "singleton",
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      mobile: parsed.data.mobile || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      ntn: parsed.data.ntn || null,
      strn: parsed.data.strn || null,
      isoCerts: parsed.data.isoCerts || null,
    },
  });

  revalidatePath("/settings/company");
  return {};
}
