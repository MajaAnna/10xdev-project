import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth.helper";
import { TEST_CREDENTIALS, TEST_SELECTORS } from "../helpers/test-data";

test.describe("Login Flow", () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test("should display login form", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Check if form elements are visible
    await expect(authHelper.loginForm).toBeVisible();
    await expect(authHelper.loginEmailInput).toBeVisible();
    await expect(authHelper.loginPasswordInput).toBeVisible();
    await expect(authHelper.loginSubmitButton).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.loginRegisterLink)).toBeVisible();
  });

  test("should show validation error for empty email", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Try to submit with empty email (leave email field empty)
    await authHelper.loginPasswordInput.fill("password123");
    await authHelper.loginSubmitButton.click();

    // Check for validation error - empty string fails email validation
    await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible();
    await expect(page.locator('[data-slot="form-message"]').first()).toContainText(/email/i);
  });

  test("should show validation error for empty password", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Try to submit with empty password
    await authHelper.loginEmailInput.fill("test@example.com");
    await authHelper.loginSubmitButton.click();

    // Check for validation error
    await expect(page.locator('[data-slot="form-message"]')).toBeVisible();
    await expect(page.locator('[data-slot="form-message"]')).toContainText(/password.*required/i);
  });

  test("should show error for invalid credentials", async () => {
    await authHelper.goToLoginPage();

    // Try to login with invalid credentials
    await authHelper.login("invalid@example.com", "wrongpassword");

    // Wait for error message
    await expect(authHelper.loginErrorMessage).toBeVisible({ timeout: 10000 });
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Login with valid credentials
    await authHelper.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Wait for redirect away from login page (middleware redirects to /)
    await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15000 });

    // Should see logout button (user is logged in)
    await expect(authHelper.signoutButton).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to register page when clicking register link", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Click register link
    await page.locator(TEST_SELECTORS.loginRegisterLink).click();

    // Should be on register page
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(authHelper.registerForm).toBeVisible();
  });

  test("should disable submit button while submitting", async () => {
    await authHelper.goToLoginPage();

    await authHelper.loginEmailInput.fill(TEST_CREDENTIALS.email);
    await authHelper.loginPasswordInput.fill(TEST_CREDENTIALS.password);

    // Click submit and immediately check if button is disabled
    await authHelper.loginSubmitButton.click();

    // Button should be disabled during submission
    await expect(authHelper.loginSubmitButton).toBeDisabled();
  });
});
