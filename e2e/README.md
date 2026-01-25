# E2E Tests

## 🚀 Quick Start

```bash
# 1. Create .env.test with your credentials (see below)
# 2. Terminal 1: Start dev server
npm run dev:e2e

# 3. Terminal 2: Run tests in UI mode (RECOMMENDED)
npm run test:e2e:ui
```

## Test Environment Setup

### 1. Get your Supabase credentials

1. Go to your Supabase Dashboard
2. Navigate to **Settings → API**
3. Copy the following:
   - **Project URL** → use as `PUBLIC_SUPABASE_URL`
   - **anon/public key** → use as `PUBLIC_SUPABASE_ANON_KEY`

### 2. Create a test user in Supabase

1. Go to Supabase Dashboard → **Authentication → Users**
2. Click **"Add user" → "Create new user"**
3. Enter an email (e.g., `test@example.com`) and a strong password
4. **IMPORTANT:** Confirm the user's email by clicking the verification link in the email, OR disable email confirmation in **Authentication → Settings → Email Auth**
5. Copy the **User ID (UUID)** from the users list

### 3. Create `.env.test` file

Create a file named `.env.test` in the project root with the following content:

```bash
# Test Environment Variables
# Used for E2E tests with Playwright

# Supabase Configuration (REQUIRED - use real values from Step 1)
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Test User Credentials (REQUIRED - use real values from Step 2)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=YourActualPassword123!
TEST_USER_ID=00000000-0000-0000-0000-000000000000

# Application Configuration
BASE_URL=http://localhost:4321
```

**⚠️ Important Notes:**
- These must be **real, working credentials** - the tests actually authenticate with Supabase
- The test user must have their email confirmed
- Do NOT commit `.env.test` to version control (it's in `.gitignore`)

## Running Tests

**Always start dev server first:** `npm run dev:e2e`

```bash
# UI Mode (interactive - BEST for development)
npm run test:e2e:ui

# Headless (all tests)
npm run test:e2e

# Specific tests
npm run test:e2e e2e/01-auth/login.spec.ts

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report

```

## Test Structure

```
e2e/
├── helpers/
│   ├── auth.helper.ts          # Helper for authentication actions (Page Object Model)
│   └── test-data.ts            # Centralized test data and selectors
├── 01-auth/
│   ├── login.spec.ts           # Login tests (7 tests)
│   ├── register.spec.ts        # Registration tests (7 tests)
│   └── logout.spec.ts          # Logout tests (5 tests)
└── 02-navigation/
    └── navbar.spec.ts          # Navbar and navigation tests (10 tests)
```

## Test Coverage

**Total: 29 tests across 4 files**

### Stage 1: Authentication (19 tests)
- **Login** (7 tests): Form display, validation, success/error flows, navigation
- **Register** (7 tests): Form validation, password matching, existing email, navigation
- **Logout** (5 tests): Logout flow, navigation links, protected routes

### Stage 2: Navigation (10 tests)
- **Navbar** (10 tests): Logged-in/logged-out states, navigation links, page routing

## Added Test Selectors

### LoginForm
- `data-testid="login-form"` - Form container
- `data-testid="login-email-input"` - Email field
- `data-testid="login-password-input"` - Password field
- `data-testid="login-submit-button"` - Submit button
- `data-testid="login-error-message"` - Error message
- `data-testid="login-register-link"` - Link to registration

### RegisterForm
- `data-testid="register-form"` - Form container
- `data-testid="register-email-input"` - Email field
- `data-testid="register-password-input"` - Password field
- `data-testid="register-confirm-password-input"` - Confirm password field
- `data-testid="register-submit-button"` - Submit button
- `data-testid="register-error-message"` - Error message
- `data-testid="register-login-link"` - Link to login

### TopNav & SignOutButton
- `data-testid="top-nav"` - Navigation container
- `data-testid="nav-home-link"` - Home link
- `data-testid="nav-generator-link"` - Generator link
- `data-testid="nav-my-cards-link"` - My Cards link
- `data-testid="nav-study-link"` - Study link
- `data-testid="nav-profile-link"` - Profile link
- `data-testid="nav-zaloguj-się-link"` - Login link (Polish)
- `data-testid="nav-zarejestruj-się-link"` - Register link (Polish)
- `data-testid="signout-button"` - Logout button

## Playwright UI Mode

**Best way to run tests interactively:**

```bash
npm run test:e2e:ui
```

**Features:**
- Watch tests run in real-time
- Debug step-by-step
- Inspect DOM and network
- Pick locators visually
- See screenshots/videos on failure

## Best Practices for Stable Tests

### Avoid Flaky Tests

To prevent tests from failing on first run but passing on rerun:

1. **Always wait for navigation to complete:**
   ```typescript
   await page.goto("/path", { waitUntil: "networkidle" });
   await page.waitForURL(/\/expected-path/);
   ```

2. **Wait for React components to hydrate:**
   ```typescript
   const navbar = page.locator('[data-testid="top-nav"]');
   await expect(navbar).toBeVisible();
   ```

3. **Wait for elements before clicking:**
   ```typescript
   const button = page.locator('[data-testid="my-button"]');
   await expect(button).toBeVisible();
   await button.click();
   ```

4. **Use explicit waits instead of timeouts:**
   ```typescript
   // ❌ Bad - arbitrary timeout
   await page.waitForTimeout(1000);
   
   // ✅ Good - wait for specific condition
   await page.waitForLoadState("networkidle");
   await expect(element).toBeVisible();
   ```

## Troubleshooting

### Problem: Tests fail on first run but pass when rerun manually
**Cause:** This is a **timing/race condition** issue. Common causes:
- React components haven't finished hydrating
- Navigation hasn't completed before assertions
- Elements aren't ready when clicked
- Network requests still in flight

**Solution:** The navigation tests have been updated with proper waits:
- `waitUntil: "networkidle"` on all `page.goto()` calls
- `page.waitForURL()` after navigation actions
- `await expect(element).toBeVisible()` before clicking
- Explicit wait for navbar to be ready before interactions

**How to verify the fix:**
```bash
# Run tests multiple times - they should consistently pass
npm run test:e2e e2e/02-navigation/navbar.spec.ts
npm run test:e2e e2e/02-navigation/navbar.spec.ts
npm run test:e2e e2e/02-navigation/navbar.spec.ts
```

### Problem: "Expected URL '/' but got '/auth/login'"
**Cause:** The home page is protected and requires authentication. When not logged in, you're redirected to login.

**Solution:** This is expected behavior! The navigation tests have been updated to handle this:
- Logged-out tests now start from public pages (`/auth/login` or `/auth/register`)
- Logged-in tests properly authenticate first using `authHelper.loginWithTestUser()`

### Problem: Tests cannot log in
**Possible causes:**
- Test user doesn't exist in Supabase → Create one in Authentication → Users
- Credentials in `.env.test` are incorrect → Double-check email, password, and user ID
- Test user's email is not confirmed → Confirm it or disable email confirmation
- `.env.test` file is missing or not loaded → Make sure it exists in project root
- Server not running → Start with `npm run dev:e2e`

**How to verify:**
```bash
# Check if .env.test exists
ls -la .env.test

# Check if server is running
curl http://localhost:4321
```

### Problem: "Cannot read properties of undefined"
**Cause:** The `authHelper` is not properly initialized in nested test contexts.

**Solution:** Make sure each `test.describe` block that needs `authHelper` initializes it in its own `beforeEach`:
```typescript
test.beforeEach(async ({ page }) => {
  authHelper = new AuthHelper(page);
});
```

### Problem: Timeout during tests
- Increase timeout in `playwright.config.ts`
- Check if the server responds at `http://localhost:4321`
- Verify Supabase is accessible (not blocked by firewall/VPN)

### Problem: Tests pass locally but not in CI
- Ensure `.env.test` values are available in CI as environment variables or secrets
- Check CI configuration in `.github/workflows/`
- Verify the test user exists in the production/staging Supabase instance

