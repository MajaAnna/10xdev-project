import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth.helper";
import { TEST_SELECTORS } from "../helpers/test-data";

test.describe("Logout Flow", () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);

    // Login before each test using optimized helper method
    await authHelper.loginWithTestUser();

    // Verify user is logged in
    await expect(authHelper.signoutButton).toBeVisible({ timeout: 10000 });
  });

  test("should display logout button when logged in", async () => {
    // Logout button should be visible
    await expect(authHelper.signoutButton).toBeVisible();
  });

  test("should successfully logout", async ({ page }) => {
    // Click logout button
    await authHelper.logout();

    // Wait for redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 });

    // Wait for login form to be visible
    await authHelper.loginForm.waitFor({ state: "visible", timeout: 10000 });

    // Logout button should not be visible
    await expect(authHelper.signoutButton).not.toBeVisible();
  });

  test("should redirect to login when accessing protected route after logout", async ({ page }) => {
    // Logout
    await authHelper.logout();

    // Wait for redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 });

    // Try to access protected route
    await page.goto("/cards");

    // Should be redirected back to login
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
  });

  test("should show logged-in navigation links when authenticated", async ({ page }) => {
    // Check if logged-in navigation links are visible
    await expect(page.locator(TEST_SELECTORS.navGeneratorLink)).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.navMyCardsLink)).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.navStudyLink)).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.navProfileLink)).toBeVisible();
  });

  test("should show logged-out navigation links after logout", async ({ page }) => {
    // Logout
    await authHelper.logout();

    // Wait for redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 });

    // Go to home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if logged-out navigation links are visible
    await expect(page.locator(TEST_SELECTORS.navLoginLink)).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.navRegisterLink)).toBeVisible();

    // Logged-in links should not be visible
    await expect(page.locator(TEST_SELECTORS.navGeneratorLink)).not.toBeVisible();
  });
});
