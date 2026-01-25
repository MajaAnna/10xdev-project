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

    // Wait a moment for validation to process
    await page.waitForTimeout(500);

    // Check for validation error - empty string fails email validation
    const errorMessage = page.locator('[data-slot="form-message"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show validation error for empty password", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Fill valid email, leave password empty
    await authHelper.loginEmailInput.fill("valid@example.com");
    await authHelper.loginSubmitButton.click();

    // Wait a moment for validation to process
    await page.waitForTimeout(500);

    // Check for validation error - should show password required
    const errorMessage = page.locator('[data-slot="form-message"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await authHelper.goToLoginPage();

    // Try to login with invalid credentials
    await authHelper.login("invalid@example.com", "wrongpassword");

    // Wait for API call to complete and error to appear
    await page.waitForTimeout(2000);

    // Check for error message - could be in login-error-message or form-message
    const errorVisible = await Promise.race([
      authHelper.loginErrorMessage.isVisible().catch(() => false),
      page.locator('[data-slot="form-message"]').first().isVisible().catch(() => false),
      page.locator('text=/invalid|incorrect|wrong/i').isVisible().catch(() => false),
    ]);

    expect(errorVisible).toBeTruthy();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Verify credentials are set
    console.log('Test credentials:', { 
      email: TEST_CREDENTIALS.email, 
      hasPassword: !!TEST_CREDENTIALS.password 
    });

    await authHelper.goToLoginPage();

    // Login with valid credentials
    await authHelper.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Wait for either redirect OR error message (to help debug)
    const result = await Promise.race([
      page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15000 })
        .then(() => 'redirected'),
      page.locator('[data-testid="login-error-message"]').waitFor({ state: 'visible', timeout: 15000 })
        .then(() => 'error'),
    ]).catch(() => 'timeout');

    if (result === 'error') {
      const errorText = await page.locator('[data-testid="login-error-message"]').textContent();
      throw new Error(`Login failed with error: ${errorText}. Check your .env.test credentials!`);
    }

    if (result === 'timeout') {
      throw new Error('Login timeout - check if .env.test has correct TEST_USER_EMAIL and TEST_USER_PASSWORD');
    }

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
