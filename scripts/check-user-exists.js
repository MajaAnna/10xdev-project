#!/usr/bin/env node

/**
 * Check if the test user exists in cloud Supabase
 * This helps diagnose E2E test authentication issues
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const supabaseUrl = process.env.TEST_SUPABASE_URL;
const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;

console.log("\n🔍 Checking Test User in Cloud Supabase\n");
console.log("=".repeat(60));
console.log("\nConfiguration:");
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  Test Email: ${testEmail}`);
console.log(`  Test Password: ${testPassword ? "[SET]" : "[MISSING]"}`);
console.log("\n" + "=".repeat(60));

if (!supabaseUrl || !supabaseKey || !testEmail || !testPassword) {
  console.error("\n❌ Missing required environment variables!");
  console.error("Run 'npm run test:e2e:verify' for details.\n");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("\n🔐 Attempting to sign in with test credentials...\n");

(async () => {
  try {
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error("❌ Authentication Failed!\n");
      console.error("Error:", error.message);
      console.error("\nPossible causes:");
      console.error("  1. User doesn't exist in cloud Supabase");
      console.error("  2. Password is incorrect");
      console.error("  3. User's email is not confirmed");
      console.error("  4. User account is disabled");
      console.error("\nTo fix:");
      console.error("  1. Go to Supabase Dashboard → Authentication → Users");
      console.error("  2. Check if user exists:", testEmail);
      console.error("  3. If exists, verify email is confirmed (green checkmark)");
      console.error("  4. If not exists, create the user with this email and password");
      console.error("  5. Make sure to confirm the email!\n");
      process.exit(1);
    }

    console.log("✅ Authentication Successful!\n");
    console.log("User Details:");
    console.log(`  ID: ${data.user.id}`);
    console.log(`  Email: ${data.user.email}`);
    console.log(`  Email Confirmed: ${data.user.email_confirmed_at ? "✅ Yes" : "❌ No"}`);
    console.log(`  Created: ${new Date(data.user.created_at).toLocaleString()}`);
    console.log(`  Last Sign In: ${data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : "Never"}`);
    
    if (!data.user.email_confirmed_at) {
      console.log("\n⚠️  WARNING: Email is not confirmed!");
      console.log("This might cause authentication issues.");
      console.log("\nTo confirm email:");
      console.log("  1. Go to Supabase Dashboard → Authentication → Users");
      console.log("  2. Find user:", testEmail);
      console.log("  3. Click '...' → 'Confirm email'\n");
    } else {
      console.log("\n🎉 User is properly configured for E2E tests!");
      console.log("\nYour E2E tests should work now if:");
      console.log("  1. You've restarted the dev server: npm run dev:e2e");
      console.log("  2. The dev server shows the cloud Supabase URL");
      console.log("  3. You run tests in a separate terminal: npm run test:e2e\n");
    }

    // Sign out
    await supabase.auth.signOut();
    
  } catch (err) {
    console.error("\n❌ Unexpected Error:", err.message);
    console.error("\nPlease check your Supabase configuration.\n");
    process.exit(1);
  }
})();

