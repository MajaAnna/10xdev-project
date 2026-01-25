# E2E Tests - Navigation

## 🚀 Quick Start

```bash
# 1. Add test credentials to .env (see below)

# 2. Verify your environment is configured correctly
npm run test:e2e:verify

# 3. Terminal 1: Start dev server
npm run dev:e2e

# 4. Terminal 2: Run tests
npm run test:e2e
```

## Test Environment Setup

### 1. Get your Supabase credentials

1. Go to your Supabase Dashboard
2. Navigate to **Settings → API**
3. Copy the **Project URL** and **anon/public key**
   
   ⚠️ **IMPORTANT**: Make sure you copy the **anon** **public** key (starts with `eyJ`), NOT the publishable key (starts with `sb_publishable_`)

### 2. Create a test user in Supabase

1. Go to Supabase Dashboard → **Authentication → Users**
2. Create a test user with email and password
3. **IMPORTANT:** Confirm the user's email
4. Copy the User ID (UUID)

### 3. Add test credentials to `.env`

Add these variables to your `.env` file:

```bash
# E2E Test Configuration
TEST_SUPABASE_URL=https://your-project-id.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=YourActualPassword123!
TEST_USER_ID=00000000-0000-0000-0000-000000000000
```

⚠️ **Note**: The `TEST_SUPABASE_ANON_KEY` should be a JWT token starting with `eyJ`, NOT a publishable key starting with `sb_publishable_`. See `.ai/supabase-keys-guide.md` for details.

**Note:** 
- Regular dev (`npm run dev`) uses `PUBLIC_SUPABASE_URL` (typically local Supabase)
- E2E tests (`npm run dev:e2e`) automatically use `TEST_SUPABASE_URL` (typically cloud Supabase)
- The `dev:e2e` script maps `TEST_SUPABASE_*` → `PUBLIC_SUPABASE_*` for client-side code

## Running Tests

```bash
# Start dev server first
npm run dev:e2e

# Run all tests
npm run test:e2e

# UI Mode (interactive)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── helpers/
│   ├── auth.helper.ts          # Authentication helper (Page Object Model)
│   └── test-data.ts            # Test data and selectors
└── 02-navigation/
    └── navbar.spec.ts          # Navigation tests (10 tests)
```

## Test Coverage

**Total: 10 navigation tests**

- **Navbar** (10 tests): 
  - Logged-out state: navbar display, navigation links (4 tests)
  - Logged-in state: navbar display, navigation to all pages (6 tests)

## Test Selectors

### Navigation
- `data-testid="top-nav"` - Navigation container
- `data-testid="nav-home-link"` - Home link
- `data-testid="nav-generator-link"` - Generator link
- `data-testid="nav-my-cards-link"` - My Cards link
- `data-testid="nav-study-link"` - Study link
- `data-testid="nav-profile-link"` - Profile link
- `data-testid="nav-zaloguj-się-link"` - Login link (Polish)
- `data-testid="nav-zarejestruj-się-link"` - Register link (Polish)
- `data-testid="signout-button"` - Logout button



## Troubleshooting

### Quick Diagnosis

Run the environment verification script to check your configuration:

```bash
npm run test:e2e:verify
```

This will tell you if any required environment variables are missing or misconfigured.

### Problem: Tests fail on first run but pass when rerun
**Cause:** Timing/race conditions - React components haven't finished hydrating.

**Solution:** Tests include proper waits:
- `waitUntil: "networkidle"` on page navigation
- `page.waitForURL()` after navigation
- `await expect(element).toBeVisible()` before interactions

### Problem: Missing environment variables
**Cause:** `TEST_*` variables not set in `.env`

**Solution:** Add required variables to `.env` file (see setup section above)

### Problem: Login fails during tests
**Possible causes:**
- Test user doesn't exist in cloud Supabase
- User's email not confirmed
- Wrong credentials in `.env`
- Tests are connecting to wrong Supabase instance (local instead of cloud)

**Solution:** 
1. Verify test user exists in Supabase Dashboard → Authentication → Users
2. Confirm user's email
3. Check `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env`
4. Verify `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY` are set correctly in `.env`
5. Make sure you're using `npm run dev:e2e` (not `npm run dev`) when running tests

### Problem: Tests work with local Supabase but fail with cloud Supabase
**Cause:** The `dev:e2e` script maps test environment variables to public ones for client-side code. If this mapping fails, the app connects to the wrong Supabase instance.

**Solution:**
1. Ensure `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY` are set in `.env`
2. Stop any running dev servers
3. Start fresh with `npm run dev:e2e` (this sets the correct environment variables)
4. In a separate terminal, run `npm run test:e2e`

