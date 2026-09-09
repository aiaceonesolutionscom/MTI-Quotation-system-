import type { Prisma } from "@/generated/prisma/client";

type TransactionClient = Prisma.TransactionClient;

/**
 * Atomically allocates the next quotation number inside an existing transaction.
 * The row-level lock from this UPDATE serializes concurrent callers, so two
 * simultaneous quotation creations can never receive the same number.
 * Format matches MTI's existing paper numbering: PREFIX + full year + running sequence
 * (the sequence is a single continuously-incrementing counter, never reset per year).
 */
export async function allocateQuotationNumber(tx: TransactionClient): Promise<string> {
  const settings = await tx.quotationSettings.update({
    where: { id: "singleton" },
    data: { nextSequence: { increment: 1 } },
  });

  const usedSequence = settings.nextSequence - 1;
  const year = new Date().getFullYear();

  return `${settings.prefix}${year}${usedSequence}`;
}
