#!/usr/bin/env node

/**
 * Pre-test check script
 * Verifies environment is ready for E2E tests
 */

import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

console.log("\n🔍 Pre-Test Environment Check\n");
console.log("=".repeat(60));

let hasIssues = false;

// Check 1: Environment variables
console.log("\n1️⃣  Checking environment variables...");
const requiredVars = ["TEST_SUPABASE_URL", "TEST_SUPABASE_ANON_KEY", "TEST_USER_EMAIL", "TEST_USER_PASSWORD"];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.log("   ❌ Missing:", missing.join(", "));
  console.log("   Run: npm run test:e2e:verify");
  hasIssues = true;
} else {
  console.log("   ✅ All required variables set");
  
  // Check for wrong key type
  if (process.env.TEST_SUPABASE_ANON_KEY?.startsWith("sb_publishable_")) {
    console.log("   ⚠️  WARNING: Using publishable key instead of anon key!");
    console.log("   See: .ai/supabase-keys-guide.md");
    hasIssues = true;
  }
}

// Check 2: Port 4321 availability
console.log("\n2️⃣  Checking if port 4321 is available...");
try {
  const result = execSync("lsof -i :4321 | grep LISTEN", { encoding: "utf-8" });
  if (result) {
    console.log("   ⚠️  Port 4321 is already in use!");
    console.log("   A dev server is already running.");
    console.log("\n   This is a problem because:");
    console.log("   - Playwright will reuse the existing server");
    console.log("   - The existing server might be using LOCAL Supabase");
    console.log("   - Your tests will fail with 'Invalid email or password'");
    console.log("\n   To fix:");
    console.log("   1. Stop the existing dev server (Ctrl+C in its terminal)");
    console.log("   2. Or run: kill $(lsof -t -i:4321)");
    console.log("   3. Then run your tests again");
    hasIssues = true;
  }
} catch (error) {
  // No process found on port 4321 - this is good!
  console.log("   ✅ Port 4321 is available");
}

// Check 3: User can authenticate
console.log("\n3️⃣  Checking if test user can authenticate...");
console.log("   Run: npm run test:e2e:check-user");
console.log("   (Skipping for now to keep this check fast)");

console.log("\n" + "=".repeat(60));

if (hasIssues) {
  console.log("\n❌ Issues found! Please fix them before running tests.\n");
  process.exit(1);
} else {
  console.log("\n✅ Environment looks good! Ready to run tests.\n");
  console.log("Next steps:");
  console.log("  npm run test:e2e\n");
  console.log("Playwright will automatically start the dev server with E2E credentials.\n");
  process.exit(0);
}

