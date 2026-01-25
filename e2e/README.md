# E2E Tests - Stage 1: Authentication

## 🚀 Quick Start

```bash
# 1. Create .env.test with your credentials (see below)
# 2. Terminal 1: Start dev server
npm run dev:e2e

# 3. Terminal 2: Run tests in UI mode (RECOMMENDED)
npm run test:e2e:ui
```

## Test Environment Setup

### 1. Create `.env.test` file

Copy the content below and adjust the values:

```bash
# Test Environment Variables
# Used for E2E tests with Playwright

# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Test User Credentials
# Create a dedicated test user in your Supabase database for E2E tests
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
TEST_USER_ID=your_test_user_id

# Application Configuration
BASE_URL=http://localhost:4321
```

### 2. Create a test user in Supabase

1. Log in to Supabase Dashboard
2. Go to Authentication → Users
3. Click "Add user" → "Create new user"
4. Use the email and password from `.env.test`
5. Copy the User ID to `.env.test`

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

## Test Structure - Stage 1

```
e2e/
├── helpers/
│   ├── auth.helper.ts          # Helper for authentication actions (Page Object Model)
│   └── test-data.ts            # Centralized test data and selectors
└── 01-auth/
    ├── login.spec.ts           # Login tests (7 tests)
    ├── register.spec.ts        # Registration tests (7 tests)
    └── logout.spec.ts          # Logout tests (5 tests)
```

## Test Coverage - Stage 1

**Total: 19 tests across 3 files**

- **Login** (7 tests): Form display, validation, success/error flows, navigation
- **Register** (7 tests): Form validation, password matching, existing email, navigation
- **Logout** (5 tests): Logout flow, navigation links, protected routes

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

## Troubleshooting

### Problem: Tests cannot log in
- Check if the test user exists in Supabase
- Verify that credentials in `.env.test` are correct
- Ensure the server is running in test mode (`npm run dev:e2e`)

### Problem: Timeout during tests
- Increase timeout in `playwright.config.ts`
- Check if the server responds at `http://localhost:4321`

### Problem: Tests pass locally but not in CI
- Ensure `.env.test` is available in CI (add as secrets)
- Check CI configuration in `.github/workflows/`

