"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { taxSettingsSchema } from "@/lib/validations/settings.schema";

type ActionResult = { error?: string };

export async function updateTaxSettings(input: unknown): Promise<ActionResult> {
  const parsed = taxSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const data = {
    defaultGstPercent: parsed.data.defaultGstPercent,
    defaultAdditionalTaxEnabled: parsed.data.defaultAdditionalTaxEnabled,
    defaultAdditionalTaxName: parsed.data.defaultAdditionalTaxName || null,
    defaultAdditionalTaxPercent: parsed.data.defaultAdditionalTaxPercent,
  };

  await prisma.taxSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidatePath("/settings/tax");
  return {};
}
