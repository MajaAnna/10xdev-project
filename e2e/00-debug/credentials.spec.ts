import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-data";

/**
 * Debug test to verify credentials are loaded and working
 * Run this first to troubleshoot authentication issues
 */
test.describe("Debug: Credentials Check", () => {
  test("should have environment variables loaded", async () => {
    console.log("=== ENVIRONMENT VARIABLES CHECK ===");
    console.log("BASE_URL:", process.env.BASE_URL);
    console.log("PUBLIC_SUPABASE_URL:", process.env.PUBLIC_SUPABASE_URL);
    console.log("PUBLIC_SUPABASE_ANON_KEY:", process.env.PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing");
    console.log("TEST_USER_EMAIL:", process.env.TEST_USER_EMAIL);
    console.log("TEST_USER_PASSWORD:", process.env.TEST_USER_PASSWORD ? "✓ Set" : "✗ Missing");
    console.log("TEST_USER_ID:", process.env.TEST_USER_ID);
    console.log("===================================");

    // Verify critical env vars are set
    expect(process.env.PUBLIC_SUPABASE_URL, "PUBLIC_SUPABASE_URL must be set").toBeTruthy();
    expect(process.env.PUBLIC_SUPABASE_ANON_KEY, "PUBLIC_SUPABASE_ANON_KEY must be set").toBeTruthy();
    expect(process.env.TEST_USER_EMAIL, "TEST_USER_EMAIL must be set").toBeTruthy();
    expect(process.env.TEST_USER_PASSWORD, "TEST_USER_PASSWORD must be set").toBeTruthy();
  });

  test("should have TEST_CREDENTIALS populated", async () => {
    console.log("=== TEST_CREDENTIALS CHECK ===");
    console.log("Email:", TEST_CREDENTIALS.email);
    console.log("Password:", TEST_CREDENTIALS.password ? "✓ Set" : "✗ Missing");
    console.log("User ID:", TEST_CREDENTIALS.userId);
    console.log("==============================");

    expect(TEST_CREDENTIALS.email).toBeTruthy();
    expect(TEST_CREDENTIALS.password).toBeTruthy();
    expect(TEST_CREDENTIALS.userId).toBeTruthy();
  });

  test("should be able to reach the dev server", async ({ page }) => {
    console.log("=== SERVER CHECK ===");
    const response = await page.goto("/auth/login");
    console.log("Status:", response?.status());
    console.log("URL:", page.url());
    console.log("====================");

    expect(response?.status()).toBe(200);
    expect(page.url()).toContain("/auth/login");
  });

  test("should be able to see login form", async ({ page }) => {
    await page.goto("/auth/login");

    const loginForm = page.locator('[data-testid="login-form"]');
    await expect(loginForm).toBeVisible();

    console.log("✓ Login form is visible");
  });

  test("should be able to attempt login (check network)", async ({ page }) => {
    console.log("=== LOGIN ATTEMPT CHECK ===");

    // Listen to all network requests
    page.on("request", (request) => {
      if (request.url().includes("/api/auth/login") || request.url().includes("supabase")) {
        console.log("→ Request:", request.method(), request.url());
      }
    });

    page.on("response", async (response) => {
      if (response.url().includes("/api/auth/login") || response.url().includes("supabase")) {
        console.log("← Response:", response.status(), response.url());
        try {
          const body = await response.text();
          console.log("  Body:", body.substring(0, 200));
        } catch (e) {
          console.log("  Body: (unable to read)");
        }
      }
    });

    await page.goto("/auth/login");

    // Fill in the form
    await page.locator('[data-testid="login-email-input"]').fill(TEST_CREDENTIALS.email);
    await page.locator('[data-testid="login-password-input"]').fill(TEST_CREDENTIALS.password);

    // Click submit
    await page.locator('[data-testid="login-submit-button"]').click();

    // Wait a bit to see the response
    await page.waitForTimeout(3000);

    console.log("Final URL:", page.url());
    console.log("===========================");
  });

  test("should verify Supabase is accessible", async ({ request }) => {
    console.log("=== SUPABASE CONNECTIVITY CHECK ===");

    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.log("✗ PUBLIC_SUPABASE_URL is not set");
      return;
    }

    try {
      const response = await request.get(`${supabaseUrl}/rest/v1/`);
      console.log("Supabase REST API status:", response.status());
      console.log("✓ Supabase is accessible");
    } catch (error) {
      console.log("✗ Cannot reach Supabase:", error);
    }
    console.log("===================================");
  });
});

