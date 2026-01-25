#!/usr/bin/env node

/**
 * Start Astro dev server with E2E test environment variables
 * Maps TEST_SUPABASE_* to PUBLIC_SUPABASE_* for client-side code
 */

import { spawn } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Check if TEST variables are set
const testUrl = process.env.TEST_SUPABASE_URL;
const testKey = process.env.TEST_SUPABASE_ANON_KEY;

if (!testUrl || !testKey) {
  console.error("\n❌ ERROR: Missing E2E test environment variables\n");
  console.error("Required in .env:");
  console.error("  - TEST_SUPABASE_URL");
  console.error("  - TEST_SUPABASE_ANON_KEY\n");
  console.error("Run 'npm run test:e2e:verify' for more details.\n");
  process.exit(1);
}

console.log("\n" + "=".repeat(70));
console.log("🚀 Starting Astro dev server for E2E tests");
console.log("=".repeat(70));
console.log("\n📡 Supabase Configuration:");
console.log(`  URL: ${testUrl}`);
console.log(`  Key: ${testKey.substring(0, 30)}...`);
console.log("\n⚠️  IMPORTANT: The client will connect to the URL above, NOT your local Supabase!");
console.log("=".repeat(70) + "\n");

// Start Astro with mapped environment variables
const astro = spawn("npx", ["astro", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PUBLIC_SUPABASE_URL: testUrl,
    PUBLIC_SUPABASE_ANON_KEY: testKey,
  },
});

// Handle process termination
process.on("SIGINT", () => {
  astro.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  astro.kill("SIGTERM");
  process.exit(0);
});

astro.on("exit", (code) => {
  process.exit(code || 0);
});

