#!/usr/bin/env ts-node

/// <reference types="node" />

import { execSync } from "child_process";
import * as path from "path";

async function resetAndSeed() {
  console.log("🔄 Starting database reset and reseed process...\n");

  const projectRoot = path.resolve(__dirname, "..");

  try {
    // Step 1: Clean up any existing Prisma client
    console.log("1️⃣ Cleaning up existing Prisma client...");
    try {
      execSync("rimraf node_modules/.prisma", {
        stdio: "inherit",
        cwd: projectRoot,
      });
    } catch {
      console.log("   No existing Prisma client to clean up");
    }
    console.log("✅ Cleanup completed\n");

    // Step 2: Generate fresh Prisma client
    console.log("2️⃣ Generating fresh Prisma client...");
    const cleanEnv = { ...process.env };
    delete cleanEnv.PRISMA_CLI_BINARY_TARGETS;
    delete cleanEnv.PRISMA_ENGINE_TYPE;

    execSync("npx prisma generate", {
      stdio: "inherit",
      cwd: projectRoot,
      env: cleanEnv,
    });
    console.log("✅ Prisma client generated successfully\n");

    // Step 3: Reset the database (this will drop and recreate all tables)
    console.log("3️⃣ Resetting database schema...");
    execSync("npx prisma migrate reset --force", {
      stdio: "inherit",
      cwd: projectRoot,
      env: cleanEnv,
    });
    console.log("✅ Database schema reset completed\n");

    // Step 4: Seed the database
    console.log("4️⃣ Seeding database with sample data...");
    execSync("npx prisma db seed", {
      stdio: "inherit",
      cwd: projectRoot,
      env: cleanEnv,
    });
    console.log("✅ Database seeded successfully\n");

    console.log("🎉 Database reset and reseed completed successfully!");
    console.log("\n🚀 Your development database is ready to use.");
    console.log("\n🔐 Test Credentials:");
    console.log("   Username: admin     | Password: admin123 (Admin)");
    console.log("   Username: user      | Password: user123 (User)");
    console.log("   Username: manager   | Password: manager123 (Manager)");
  } catch (error) {
    console.error("❌ Error during reset and reseed process:", error);
    console.error("\n🔧 Troubleshooting tips:");
    console.error("   1. Ensure MySQL is running on localhost:3307");
    console.error("   2. Verify DATABASE_URL in .env file");
    console.error('   3. Check if database "manager_app_db" exists');
    console.error(
      "   4. Try running: npm run prisma:clean && npm run prisma:generate"
    );
    process.exit(1);
  }
}

// Run the reset and seed process
resetAndSeed();
