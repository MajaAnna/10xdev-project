import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth.helper";
import { TEST_SELECTORS } from "../helpers/test-data";

test.describe("Navbar and Navigation", () => {
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

  test.describe("When logged in", () => {
    // Run these tests serially to avoid state conflicts
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page, context }) => {
      // Clear any existing auth state first
      await context.clearCookies();
      
      // Initialize authHelper for this context
      authHelper = new AuthHelper(page);
      // Login before each test in this group
      await authHelper.loginWithTestUser();
      // Wait for page to be fully loaded after login
      await page.waitForLoadState("networkidle");
    });

    test.afterEach(async ({ context }) => {
      // Clean up auth state after each test
      await context.clearCookies();
    });

    test("should display navbar with logged-in links", async ({ page }) => {
      // Wait for navbar to be visible (React hydration)
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      // Check if home link is visible
      const homeLink = page.locator(TEST_SELECTORS.navHomeLink);
      await expect(homeLink).toBeVisible();

      // Check if logged-in links are visible
      const generatorLink = page.locator(TEST_SELECTORS.navGeneratorLink);
      const myCardsLink = page.locator(TEST_SELECTORS.navMyCardsLink);
      const studyLink = page.locator(TEST_SELECTORS.navStudyLink);
      const profileLink = page.locator(TEST_SELECTORS.navProfileLink);

      await expect(generatorLink).toBeVisible();
      await expect(myCardsLink).toBeVisible();
      await expect(studyLink).toBeVisible();
      await expect(profileLink).toBeVisible();

      // Check that logout button is visible
      const signoutButton = page.locator(TEST_SELECTORS.signoutButton);
      await expect(signoutButton).toBeVisible();

      // Check that logged-out links are NOT visible
      const loginLink = page.locator(TEST_SELECTORS.navLoginLink);
      await expect(loginLink).not.toBeVisible();
    });

    test("should navigate to generator page when clicking generator link", async ({ page }) => {
      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const generatorLink = page.locator(TEST_SELECTORS.navGeneratorLink);
      await expect(generatorLink).toBeVisible();
      await generatorLink.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/generate/);
      await expect(page).toHaveURL(/\/generate/);
    });

    test("should navigate to my cards page when clicking my cards link", async ({ page }) => {
      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const myCardsLink = page.locator(TEST_SELECTORS.navMyCardsLink);
      await expect(myCardsLink).toBeVisible();
      await myCardsLink.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/cards/);
      await expect(page).toHaveURL(/\/cards/);
    });

    test("should navigate to study page when clicking study link", async ({ page }) => {
      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const studyLink = page.locator(TEST_SELECTORS.navStudyLink);
      await expect(studyLink).toBeVisible();
      await studyLink.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/study/);
      await expect(page).toHaveURL(/\/study/);
    });

    test("should navigate to profile page when clicking profile link", async ({ page }) => {
      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const profileLink = page.locator(TEST_SELECTORS.navProfileLink);
      await expect(profileLink).toBeVisible();
      await profileLink.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/profile/);
      await expect(page).toHaveURL(/\/profile/);
    });

    test("should navigate to home page when clicking home link", async ({ page }) => {
      await page.goto("/generate", { waitUntil: "networkidle" });

      // Wait for navbar to be ready
      const topNav = page.locator(TEST_SELECTORS.topNav);
      await expect(topNav).toBeVisible();

      const homeLink = page.locator(TEST_SELECTORS.navHomeLink);
      await expect(homeLink).toBeVisible();
      await homeLink.click();

      // Wait for navigation to complete
      await page.waitForURL("/");
      await expect(page).toHaveURL("/");
    });
  });
});

