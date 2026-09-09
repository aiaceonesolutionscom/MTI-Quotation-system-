"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { quotationSettingsSchema } from "@/lib/validations/settings.schema";

type ActionResult = { error?: string };

export async function updateQuotationSettings(input: unknown): Promise<ActionResult> {
  const parsed = quotationSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.quotationSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  revalidatePath("/settings/quotation");
  return {};
}
