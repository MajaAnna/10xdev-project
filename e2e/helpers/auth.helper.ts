import type { Page, Locator } from "@playwright/test";
import { TEST_SELECTORS, TEST_CREDENTIALS } from "./test-data";

/**
 * Helper class for authentication-related actions in E2E tests
 */
export class AuthHelper {
  // Cached locators for better performance
  readonly loginForm: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly registerForm: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerConfirmPasswordInput: Locator;
  readonly registerSubmitButton: Locator;
  readonly signoutButton: Locator;

  constructor(private page: Page) {
    // Initialize locators once
    this.loginForm = page.locator(TEST_SELECTORS.loginForm);
    this.loginEmailInput = page.locator(TEST_SELECTORS.loginEmailInput);
    this.loginPasswordInput = page.locator(TEST_SELECTORS.loginPasswordInput);
    this.loginSubmitButton = page.locator(TEST_SELECTORS.loginSubmitButton);
    this.loginErrorMessage = page.locator(TEST_SELECTORS.loginErrorMessage);
    this.registerForm = page.locator(TEST_SELECTORS.registerForm);
    this.registerEmailInput = page.locator(TEST_SELECTORS.registerEmailInput);
    this.registerPasswordInput = page.locator(TEST_SELECTORS.registerPasswordInput);
    this.registerConfirmPasswordInput = page.locator(TEST_SELECTORS.registerConfirmPasswordInput);
    this.registerSubmitButton = page.locator(TEST_SELECTORS.registerSubmitButton);
    this.signoutButton = page.locator(TEST_SELECTORS.signoutButton);
  }

  /**
   * Navigate to login page
   */
  async goToLoginPage() {
    await this.page.goto("/auth/login");
    await this.loginForm.waitFor({ state: "visible" });
  }

  /**
   * Navigate to register page
   */
  async goToRegisterPage() {
    await this.page.goto("/auth/register");
    await this.registerForm.waitFor({ state: "visible" });
  }

  /**
   * Fill and submit login form
   */
  async login(email: string, password: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitButton.click();
  }

  /**
   * Login with test credentials and wait for successful redirect
   */
  async loginWithTestUser() {
    await this.goToLoginPage();
    await this.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    // Wait for redirect away from login page
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15000 });
    // Wait for logout button to confirm login
    await this.signoutButton.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Fill and submit register form
   */
  async register(email: string, password: string, confirmPassword: string) {
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerConfirmPasswordInput.fill(confirmPassword);
    await this.registerSubmitButton.click();
  }

  /**
   * Click logout button
   */
  async logout() {
    await this.signoutButton.click();
  }

  /**
   * Check if user is logged in (by checking if logout button exists)
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.signoutButton.isVisible();
  }

  /**
   * Wait for navigation after login/logout
   * Uses 'load' state instead of 'networkidle' for better reliability
   */
  async waitForNavigation() {
    await this.page.waitForLoadState("load");
  }

  /**
   * Wait for a specific URL pattern after navigation
   */
  async waitForURL(pattern: RegExp, options?: { timeout?: number }) {
    await this.page.waitForURL(pattern, options);
  }
}
