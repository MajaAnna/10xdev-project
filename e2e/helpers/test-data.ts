/**
 * Test data and credentials for E2E tests
 */

export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
  userId: process.env.TEST_USER_ID || "",
} as const;

export const TEST_SELECTORS = {
  // Login form
  loginForm: '[data-testid="login-form"]',
  loginEmailInput: '[data-testid="login-email-input"]',
  loginPasswordInput: '[data-testid="login-password-input"]',
  loginSubmitButton: '[data-testid="login-submit-button"]',
  loginErrorMessage: '[data-testid="login-error-message"]',
  loginRegisterLink: '[data-testid="login-register-link"]',

  // Register form
  registerForm: '[data-testid="register-form"]',
  registerEmailInput: '[data-testid="register-email-input"]',
  registerPasswordInput: '[data-testid="register-password-input"]',
  registerConfirmPasswordInput: '[data-testid="register-confirm-password-input"]',
  registerSubmitButton: '[data-testid="register-submit-button"]',
  registerErrorMessage: '[data-testid="register-error-message"]',
  registerLoginLink: '[data-testid="register-login-link"]',

  // Navigation
  topNav: '[data-testid="top-nav"]',
  navHomeLink: '[data-testid="nav-home-link"]',
  navGeneratorLink: '[data-testid="nav-generator-link"]',
  navMyCardsLink: '[data-testid="nav-my-cards-link"]',
  navStudyLink: '[data-testid="nav-study-link"]',
  navProfileLink: '[data-testid="nav-profile-link"]',
  navLoginLink: '[data-testid="nav-zaloguj-się-link"]',
  navRegisterLink: '[data-testid="nav-zarejestruj-się-link"]',
  signoutButton: '[data-testid="signout-button"]',
} as const;
