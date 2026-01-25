import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth.helper";
import { TEST_CREDENTIALS, TEST_SELECTORS } from "../helpers/test-data";

test.describe("Register Flow", () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test("should display register form", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Check if form elements are visible
    await expect(authHelper.registerForm).toBeVisible();
    await expect(authHelper.registerEmailInput).toBeVisible();
    await expect(authHelper.registerPasswordInput).toBeVisible();
    await expect(authHelper.registerConfirmPasswordInput).toBeVisible();
    await expect(authHelper.registerSubmitButton).toBeVisible();
    await expect(page.locator(TEST_SELECTORS.registerLoginLink)).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Try to submit with invalid email
    await authHelper.registerEmailInput.fill("invalid-email");
    await authHelper.registerPasswordInput.fill("password123");
    await authHelper.registerConfirmPasswordInput.fill("password123");

    // Click submit and wait for the button to be enabled again (validation complete)
    await authHelper.registerSubmitButton.click();

    // Wait for form validation to complete and error message to appear
    const errorMessage = page.locator('[data-slot="form-message"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/invalid.*email/i);
  });

  test("should show validation error for short password", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Try to submit with short password
    await authHelper.registerEmailInput.fill("test@example.com");
    await authHelper.registerPasswordInput.fill("short");
    await authHelper.registerConfirmPasswordInput.fill("short");

    // Click submit
    await authHelper.registerSubmitButton.click();

    // Wait for form validation to complete and error message to appear
    const errorMessage = page.locator('[data-slot="form-message"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/password.*8.*character/i);
  });

  test("should show validation error for mismatched passwords", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Try to submit with mismatched passwords
    await authHelper.registerEmailInput.fill("test@example.com");
    await authHelper.registerPasswordInput.fill("password123");
    await authHelper.registerConfirmPasswordInput.fill("different123");

    // Click submit
    await authHelper.registerSubmitButton.click();

    // Wait for form validation to complete and error message to appear
    const errorMessage = page.locator('[data-slot="form-message"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/password.*match/i);
  });

  test("should show error for already registered email", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Try to register with existing email (should fail because user already exists)
    await authHelper.register(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, TEST_CREDENTIALS.password);

    // Wait for API call to complete and error message to appear
    const errorMessage = page.locator(TEST_SELECTORS.registerErrorMessage);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to login page when clicking login link", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Click login link
    await page.locator(TEST_SELECTORS.registerLoginLink).click();

    // Should be on login page
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(authHelper.loginForm).toBeVisible();
  });

  test("should disable submit button while submitting", async () => {
    await authHelper.goToRegisterPage();

    const uniqueEmail = `test-${Date.now()}@example.com`;

    await authHelper.registerEmailInput.fill(uniqueEmail);
    await authHelper.registerPasswordInput.fill(TEST_CREDENTIALS.password);
    await authHelper.registerConfirmPasswordInput.fill(TEST_CREDENTIALS.password);

    // Click submit and immediately check if button is disabled
    await authHelper.registerSubmitButton.click();

    // Button should be disabled during submission
    await expect(authHelper.registerSubmitButton).toBeDisabled();
  });

  test("should show all form fields are required", async ({ page }) => {
    await authHelper.goToRegisterPage();

    // Try to submit empty form
    await authHelper.registerSubmitButton.click();

    // Wait for form validation to complete and error message to appear
    const errorMessage = page.locator('[data-slot="form-message"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});
