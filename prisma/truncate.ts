/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database truncate...");

  // Truncate all tables first (in correct order to handle foreign key constraints)
  console.log("🗑️  Truncating all tables...");

  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

  // Truncate tables in reverse dependency order
  await prisma.$executeRaw`TRUNCATE TABLE attendance_records`;
  await prisma.$executeRaw`TRUNCATE TABLE interaction_records`;
  await prisma.$executeRaw`TRUNCATE TABLE documents`;
  await prisma.$executeRaw`TRUNCATE TABLE complaint_details`;
  await prisma.$executeRaw`TRUNCATE TABLE daily_record`;
  await prisma.$executeRaw`TRUNCATE TABLE inquiries`;
  await prisma.$executeRaw`TRUNCATE TABLE companies`;

  await prisma.$executeRaw`TRUNCATE TABLE property_staff_assignments`;
  await prisma.$executeRaw`TRUNCATE TABLE user_sessions`;
  await prisma.$executeRaw`TRUNCATE TABLE staff`;
  await prisma.$executeRaw`TRUNCATE TABLE properties`;

  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

  console.log("✅ All tables truncated successfully");
}

main()
  .catch((e) => {
    console.error("❌ Error during truncate:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
