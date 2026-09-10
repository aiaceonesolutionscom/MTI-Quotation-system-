"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validations/customer.schema";

type ActionResult = { error?: string };

function toData(parsed: ReturnType<typeof customerSchema.safeParse>["data"]) {
  if (!parsed) throw new Error("unreachable");
  return {
    companyName: parsed.companyName,
    city: parsed.city || null,
    country: parsed.country || null,
    status: parsed.status,
  };
}

export async function createCustomer(input: unknown): Promise<ActionResult & { id?: string }> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const customer = await prisma.customer.create({ data: toData(parsed.data) });
  revalidatePath("/customers");
  return { id: customer.id };
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.customer.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return {};
}

export async function toggleCustomerStatus(id: string, status: boolean): Promise<ActionResult> {
  await prisma.customer.update({ where: { id }, data: { status } });
  revalidatePath("/customers");
  return {};
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const usageCount = await prisma.quotation.count({ where: { customerId: id } });
  if (usageCount > 0) {
    return { error: "Customer could not be deleted because it has existing quotations." };
  }

  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  return {};
}