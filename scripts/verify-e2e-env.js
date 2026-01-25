#!/usr/bin/env node

/**
 * Verification script for E2E test environment variables
 * Run this to check if your .env is configured correctly for E2E tests
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const requiredVars = {
  TEST_SUPABASE_URL: process.env.TEST_SUPABASE_URL,
  TEST_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY,
  TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
  TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
};

const optionalVars = {
  TEST_USER_ID: process.env.TEST_USER_ID,
  PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
};

console.log("\n🔍 E2E Test Environment Verification\n");
console.log("=" .repeat(60));

// Check required variables
let hasErrors = false;
let hasWarnings = false;
console.log("\n✅ Required Variables (for E2E tests):\n");

for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`❌ ${key}: MISSING`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const maskedValue = key.includes("KEY") || key.includes("PASSWORD") 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${key}: ${maskedValue}`);
    
    // Check for common mistakes
    if (key === "TEST_SUPABASE_ANON_KEY" && value.startsWith("sb_publishable_")) {
      console.log(`   ⚠️  WARNING: This looks like a publishable key, not an anon key!`);
      console.log(`   ⚠️  Anon keys should start with "eyJ" (JWT format)`);
      console.log(`   ⚠️  See .ai/supabase-keys-guide.md for details`);
      hasWarnings = true;
    }
  }
}

// Check optional variables
console.log("\nℹ️  Optional Variables (for reference):\n");

for (const [key, value] of Object.entries(optionalVars)) {
  if (value) {
    const maskedValue = key.includes("KEY") 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`   ${key}: ${maskedValue}`);
  } else {
    console.log(`   ${key}: not set`);
  }
}

console.log("\n" + "=".repeat(60));

if (hasErrors) {
  console.log("\n❌ CONFIGURATION ERROR\n");
  console.log("Missing required environment variables for E2E tests.");
  console.log("Please add them to your .env file.\n");
  console.log("Example .env configuration:\n");
  console.log("TEST_SUPABASE_URL=https://your-project.supabase.co");
  console.log("TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  console.log("TEST_USER_EMAIL=test@example.com");
  console.log("TEST_USER_PASSWORD=YourPassword123!");
  console.log("TEST_USER_ID=00000000-0000-0000-0000-000000000000");
  console.log("\nSee e2e/README.md for detailed setup instructions.\n");
  process.exit(1);
} else if (hasWarnings) {
  console.log("\n⚠️  CONFIGURATION WARNING\n");
  console.log("All required variables are set, but there are potential issues.");
  console.log("Please review the warnings above and fix them.\n");
  console.log("See .ai/supabase-keys-guide.md for help with Supabase keys.\n");
  process.exit(1);
} else {
  console.log("\n✅ ALL REQUIRED VARIABLES SET\n");
  console.log("Your E2E test environment is configured correctly!");
  console.log("\nNext steps:");
  console.log("1. Terminal 1: npm run dev:e2e");
  console.log("2. Terminal 2: npm run test:e2e\n");
  process.exit(0);
}

