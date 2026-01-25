import type { Page, Locator } from "@playwright/test";
import { TEST_SELECTORS, TEST_CREDENTIALS } from "./test-data";

/**
 * Helper class for authentication in navigation E2E tests
 * Provides login functionality needed for testing logged-in navigation states
 */
export class AuthHelper {
  readonly loginForm: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly signoutButton: Locator;

  constructor(private page: Page) {
    this.loginForm = page.locator(TEST_SELECTORS.loginForm);
    this.loginEmailInput = page.locator(TEST_SELECTORS.loginEmailInput);
    this.loginPasswordInput = page.locator(TEST_SELECTORS.loginPasswordInput);
    this.loginSubmitButton = page.locator(TEST_SELECTORS.loginSubmitButton);
    this.loginErrorMessage = page.locator(TEST_SELECTORS.loginErrorMessage);
    this.signoutButton = page.locator(TEST_SELECTORS.signoutButton);
  }

  /**
   * Navigate to login page and wait for form to be ready
   */
  private async goToLoginPage() {
    await this.page.goto("/auth/login", { waitUntil: "networkidle" });
    await this.loginForm.waitFor({ state: "visible" });
    await this.loginEmailInput.waitFor({ state: "visible" });
    await this.loginPasswordInput.waitFor({ state: "visible" });
    await this.loginSubmitButton.waitFor({ state: "visible" });
  }

  /**
   * Fill and submit login form
   */
  private async login(email: string, password: string) {
    await this.loginEmailInput.clear();
    await this.loginPasswordInput.clear();
    await this.loginEmailInput.fill(email.trim());
    await this.loginPasswordInput.fill(password.trim());
    await this.page.waitForTimeout(100);
    await this.loginSubmitButton.click();
  }

  /**
   * Login with test credentials for navigation tests
   * Used to set up logged-in state before testing navigation
   */
  async loginWithTestUser() {
    await this.goToLoginPage();
    await this.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await this.page.waitForTimeout(500);

    // Check for errors
    const formErrors = await this.page.locator('[data-slot="form-message"]').allTextContents();
    if (formErrors.length > 0 && formErrors.some((e) => e.includes("Invalid email or password"))) {
      throw new Error(
        `Login failed. Check .env:\n` +
          `- TEST_USER_EMAIL: ${TEST_CREDENTIALS.email}\n` +
          `- TEST_USER_PASSWORD: ${TEST_CREDENTIALS.password ? "[SET]" : "[MISSING]"}\n` +
          `- User must exist in Supabase with confirmed email`
      );
    }

    // Wait for redirect and logout button
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15000 });
    await this.signoutButton.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Validate test credentials are configured
   */
  static checkCredentials() {
    const issues: string[] = [];

    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === "test@example.com") {
      issues.push("TEST_USER_EMAIL not set or using default");
    }

    if (!TEST_CREDENTIALS.password || TEST_CREDENTIALS.password === "TestPassword123!") {
      issues.push("TEST_USER_PASSWORD not set or using default");
    }

    if (issues.length > 0) {
      throw new Error(
        `Missing test credentials in .env:\n` + issues.map((i) => `  - ${i}`).join("\n") + `\n\nSee e2e/README.md`
      );
    }

    return true;
  }
}
