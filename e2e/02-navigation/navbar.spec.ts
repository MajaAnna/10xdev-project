import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth.helper";
import { TEST_SELECTORS } from "../helpers/test-data";

test.describe("Navbar and Navigation", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authHelper: AuthHelper;

  // Check credentials before running any tests
  test.beforeAll(() => {
    AuthHelper.checkCredentials();
  });

  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage to ensure clean state
    await context.clearCookies();
    await context.clearPermissions();

    authHelper = new AuthHelper(page);
  });

  test.describe("When logged out", () => {
    // Run these tests serially to avoid state conflicts
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ context }) => {
      // Ensure we're logged out by clearing all auth state
      await context.clearCookies();
    });
    test("should display navbar with logged-out links", async ({ page }) => {
      // Navigate to login page (public page) and wait for load
      await page.goto("/auth/login", { waitUntil: "networkidle" });

      // Wait for navbar to be visible (React hydration)
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      // Check if home link is visible
      const homeLink = page.locator(TEST_SELECTORS.navHomeLink);
      await expect(homeLink).toBeVisible();

      // Check if logged-out links are visible
      const loginLink = page.locator(TEST_SELECTORS.navLoginLink);
      const registerLink = page.locator(TEST_SELECTORS.navRegisterLink);
      await expect(loginLink).toBeVisible();
      await expect(registerLink).toBeVisible();

      // Check that logged-in links are NOT visible
      const generatorLink = page.locator(TEST_SELECTORS.navGeneratorLink);
      await expect(generatorLink).not.toBeVisible();
    });

    test("should navigate to login page when clicking login link", async ({ page }) => {
      await page.goto("/auth/register", { waitUntil: "networkidle" });

      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const loginLink = page.locator(TEST_SELECTORS.navLoginLink);
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/auth\/login/);
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test("should navigate to register page when clicking register link", async ({ page }) => {
      await page.goto("/auth/login", { waitUntil: "networkidle" });

      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const registerLink = page.locator(TEST_SELECTORS.navRegisterLink);
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/auth\/register/);
      await expect(page).toHaveURL(/\/auth\/register/);
    });

    test("should redirect to login when clicking home link while logged out", async ({ page }) => {
      await page.goto("/auth/login", { waitUntil: "networkidle" });

      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const homeLink = page.locator(TEST_SELECTORS.navHomeLink);
      await expect(homeLink).toBeVisible();
      await homeLink.click();

      // Wait for redirect to complete
      await page.waitForURL(/\/auth\/login/);
      // Home page is protected, so should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});
