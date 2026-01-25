#!/usr/bin/env node

/**
 * Test script to verify which Supabase instance the app is connecting to
 * This helps debug E2E test issues
 */

import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const TEST_URL = process.env.TEST_SUPABASE_URL;
const LOCAL_URL = process.env.PUBLIC_SUPABASE_URL;

console.log("\n🔍 Testing Supabase Connection\n");
console.log("Expected (from TEST_SUPABASE_URL):", TEST_URL);
console.log("Local (from PUBLIC_SUPABASE_URL):", LOCAL_URL);
console.log("\nStarting browser test...\n");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app
  await page.goto("http://localhost:4321/auth/login");
  
  // Wait for page to load
  await page.waitForLoadState("networkidle");
  
  // Get the Supabase URL from the client-side code
  const supabaseUrl = await page.evaluate(() => {
    // Try to get it from window or import.meta.env
    return window.location.origin;
  });
  
  console.log("Page loaded from:", supabaseUrl);
  
  // Check what PUBLIC_SUPABASE_URL the client has
  const clientSupabaseUrl = await page.evaluate(() => {
    // This will be undefined in browser, but we can check network requests
    return "Check Network tab for Supabase requests";
  });
  
  console.log("\n📡 Checking network requests...");
  console.log("Look at the Network tab in the browser that just opened.");
  console.log("Filter for 'supabase' to see which instance is being called.\n");
  console.log("Expected to see requests to:", TEST_URL);
  console.log("If you see requests to:", LOCAL_URL, "← The dev server needs to be restarted!\n");
  
  console.log("\n⏸️  Browser will stay open for 30 seconds for you to inspect...");
  console.log("Check the Network tab to see Supabase API calls.\n");
  
  // Keep browser open for inspection
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  console.log("\n✅ Test complete. Did you see requests to the cloud Supabase URL?");
  console.log("\nIf requests went to http://127.0.0.1:54321:");
  console.log("  1. Stop the dev server (Ctrl+C)");
  console.log("  2. Start fresh: npm run dev:e2e");
  console.log("  3. Run this test again\n");
})();

