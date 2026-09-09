import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  "Pipe",
  "Valve",
  "Flange",
  "Fitting",
  "Gauge",
  "Pump",
];

const UOMS = ["NOS", "PCS", "MTR", "KG", "SET", "BOX"];

const DEMO_USERS: { name: string; email: string; password: string }[] = [
  { name: "Super Admin", email: "superadmin@mti.com", password: "SuperAdmin@123" },
];

async function main() {
  await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: "Master Tech International",
      address: "503, 5th Floor, Rimjhim Shopping Centre, Gulshan-e-Iqbal, Block# 6, Karachi, Pakistan",
      mobile: "0300-8221115",
      phone: "(+92)(021)33482948",
      email: "mtechint@mail.com, mastertechinternational@gmail.com",
      website: "www.mti.com",
      ntn: "3963409-4",
      strn: "1700396340912",
      isoCerts: "ISO 9001:2015, 14001:2015, 45001:2018",
    },
  });

  await prisma.quotationSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      prefix: "MTI",
      nextSequence: 1,
      currency: "PKR",
    },
  });

  await prisma.taxSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      defaultGstPercent: 18,
      defaultAdditionalTaxEnabled: false,
      defaultAdditionalTaxName: "Additional Tax",
    },
  });

  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const name of UOMS) {
    await prisma.uom.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const demoUser of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        status: "ACTIVE",
      },
    });
  }

  console.log("\nSeed complete. Starter login credentials (change these after first login):\n");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email.padEnd(22)} ${u.password}`);
  }
  console.log("");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
