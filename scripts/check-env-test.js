#!/usr/bin/env node

/**
 * Script to verify .env.test configuration
 * Run with: node scripts/check-env-test.js
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

const envPath = resolve(process.cwd(), ".env.test");

console.log("\n=== .env.test Configuration Check ===\n");

// Check if file exists
if (!existsSync(envPath)) {
  console.error("❌ ERROR: .env.test file not found!");
  console.log(`   Expected location: ${envPath}`);
  console.log("\n   Please create .env.test file in the project root.");
  console.log("   See e2e/README.md for instructions.\n");
  process.exit(1);
}

console.log("✓ .env.test file exists\n");

// Load environment variables
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ ERROR: Failed to load .env.test");
  console.error(result.error);
  process.exit(1);
}

// Check required variables
const requiredVars = {
  PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
  TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
  TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
  TEST_USER_ID: process.env.TEST_USER_ID,
  BASE_URL: process.env.BASE_URL,
};

let hasErrors = false;

console.log("Checking required variables:\n");

for (const [key, value] of Object.entries(requiredVars)) {
  if (!value || value.trim() === "") {
    console.log(`❌ ${key}: Missing or empty`);
    hasErrors = true;
  } else if (
    value.includes("your_") ||
    value.includes("your-") ||
    value.includes("example.com") ||
    value === "00000000-0000-0000-0000-000000000000"
  ) {
    console.log(`⚠️  ${key}: Contains placeholder value`);
    console.log(`   Current value: ${value}`);
    hasErrors = true;
  } else {
    // Show partial value for security
    const displayValue =
      key.includes("KEY") || key.includes("PASSWORD")
        ? `${value.substring(0, 10)}...`
        : value;
    console.log(`✓ ${key}: ${displayValue}`);
  }
}

console.log("\n=== Validation Results ===\n");

if (hasErrors) {
  console.log("❌ Configuration has errors!");
  console.log("\nCommon issues:");
  console.log("1. Make sure you're using REAL credentials from Supabase Dashboard");
  console.log("2. Go to Supabase Dashboard → Settings → API");
  console.log("3. Copy the Project URL and anon/public key");
  console.log("4. Create a test user in Authentication → Users");
  console.log("5. Confirm the test user's email");
  console.log("\nSee e2e/README.md for detailed setup instructions.\n");
  process.exit(1);
} else {
  console.log("✅ All required variables are set!");
  console.log("\nNext steps:");
  console.log("1. Make sure your dev server is running: npm run dev:e2e");
  console.log("2. Run the debug tests: npm run test:e2e e2e/00-debug/credentials.spec.ts");
  console.log("3. If debug tests pass, run your navigation tests\n");
}

