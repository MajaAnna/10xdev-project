import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // E2E tests directory
  testDir: "./e2e",

  // Maximum time for one test
  timeout: 30 * 1000,

  // Maximum time for expect()
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Stop all tests after first failure in CI
  forbidOnly: !!process.env.CI,

  // Number of retries on failure
  retries: process.env.CI ? 2 : 0,

  // Number of workers - use 1 in CI, half of cores locally
  workers: process.env.CI ? 1 : undefined,

  // Reporter - use GitHub Actions reporter in CI
  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html"]],

  // Directory for test artifacts
  outputDir: "test-results/",

  // Shared settings for all projects
  use: {
    // Base URL of the application
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    // Collect trace only on first retry
    trace: "on-first-retry",

    // Collect screenshots on failure
    screenshot: "only-on-failure",

    // Collect video on failure
    video: "retain-on-failure",

    // Timeout for actions (click, fill, etc.)
    actionTimeout: 10 * 1000,

    // Timeout for navigation
    navigationTimeout: 30 * 1000,
  },

  // Test projects configuration - only Chromium as per guidelines
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Additional options for Chromium
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Start dev server before tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
