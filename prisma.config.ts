import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection — Supabase's pgbouncer
    // pooler can't reliably run the DDL/prepared statements Prisma Migrate issues.
    url: env("DIRECT_URL"),
  },
});
