import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Single Prisma Client on the pooled Supabase endpoint (port 6543 / Supavisor).
 *
 * Supavisor pins a server connection for the lifetime of a transaction, so
 * interactive transactions (`prisma.$transaction(async (tx) => {...})`) work on
 * this pooled connection. The old separate "direct" client (port 5432) was
 * dropped because cold-start connections to that endpoint took several seconds
 * and blew the transaction's connection-acquire budget ("Transaction API error:
 * Unable to start a transaction in the given time.").
 *
 * The one-time warm-up query below ESTABLISHES a connection at module load and
 * `min: 1` keeps an idle connection alive, so the first interactive transaction
 * never has to wait for a slow cold start. Callers still pass a generous
 * maxWait/timeout for safety under load.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  max: 10,
  min: 1,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaWarmup?: Promise<unknown>;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
globalForPrisma.prisma = prisma;

if (!globalForPrisma.prismaWarmup) {
  globalForPrisma.prismaWarmup = prisma.$queryRaw`SELECT 1`.catch((e) => {
    console.error("[prisma] initial warm-up query failed:", e);
  });
}