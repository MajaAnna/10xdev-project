# ✅ SOLUTION: How to Run E2E Tests Successfully

## 🎯 The Problem

Your E2E tests were failing with "Invalid email or password" because:

1. ✅ Your test credentials are correct
2. ✅ The user exists in cloud Supabase
3. ❌ **BUT the browser was connecting to LOCAL Supabase instead of CLOUD Supabase**

### Why This Happened

When you have a dev server already running on port 4321 (from `npm run dev`), Playwright's `reuseExistingServer` setting causes it to use that existing server instead of starting a new one with E2E credentials.

The existing server uses `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` (local), but your test user only exists in cloud Supabase!

## ✅ The Solution

### Step 1: Stop ALL Dev Servers

**Before running E2E tests, make sure NO dev server is running:**

```bash
# Check if anything is running on port 4321
lsof -i :4321

# If something is running, kill it
kill $(lsof -t -i:4321)

# Or press Ctrl+C in the terminal where the dev server is running
```

### Step 2: Run E2E Tests

**Just run the tests - Playwright will start the dev server automatically:**

```bash
npm run test:e2e
```

Playwright will:
1. Check that your environment is configured correctly
2. Start the dev server with `npm run dev:e2e` (which maps TEST_* → PUBLIC_*)
3. Run the tests
4. Stop the dev server when done

### Step 3: Verify It's Working

When Playwright starts the dev server, you should see output like:

```
======================================================================
🚀 Starting Astro dev server for E2E tests
======================================================================

📡 Supabase Configuration:
  URL: https://yqothdxgjaqwdaiugdnz.supabase.co
  Key: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...

⚠️  IMPORTANT: The client will connect to the URL above, NOT your local Supabase!
======================================================================
```

If you see `http://127.0.0.1:54321` instead, something is wrong!

## 🔧 Diagnostic Commands

### Check Environment Configuration
```bash
npm run test:e2e:verify
```

Should show all ✅ green with no warnings.

### Check User Can Authenticate
```bash
npm run test:e2e:check-user
```

Should show:
```
✅ Authentication Successful!
🎉 User is properly configured for E2E tests!
```

### Check Port Availability
```bash
lsof -i :4321
```

Should return nothing (or only CLOSE_WAIT connections from Chrome).

## 📋 Complete Workflow

```bash
# 1. Verify configuration (one time)
npm run test:e2e:verify

# 2. Check user can authenticate (one time)
npm run test:e2e:check-user

# 3. Make sure no dev server is running
kill $(lsof -t -i:4321) 2>/dev/null

# 4. Run tests (Playwright starts dev server automatically)
npm run test:e2e
```

## ⚠️ Common Mistakes

### ❌ DON'T: Run dev server manually
```bash
# DON'T do this before running tests:
npm run dev:e2e  # ← This will block Playwright from starting its own server
```

### ❌ DON'T: Have regular dev server running
```bash
# If you have this running in another terminal, STOP IT:
npm run dev  # ← This uses LOCAL Supabase, tests will fail
```

### ✅ DO: Let Playwright manage the dev server
```bash
# Just run this - Playwright handles everything:
npm run test:e2e
```

## 🎯 Why This Works

1. **`npm run test:e2e`** runs `scripts/pre-test-check.js` first
   - Checks environment variables are set
   - Checks port 4321 is available
   - Warns if there are issues

2. **Playwright starts** and reads `playwright.config.ts`
   - Sees `webServer.command: "npm run dev:e2e"`
   - Checks if port 4321 is free
   - Starts the dev server with E2E credentials

3. **`npm run dev:e2e`** runs `scripts/dev-e2e.js`
   - Maps `TEST_SUPABASE_URL` → `PUBLIC_SUPABASE_URL`
   - Maps `TEST_SUPABASE_ANON_KEY` → `PUBLIC_SUPABASE_ANON_KEY`
   - Starts Astro with these environment variables

4. **Astro builds the client bundle**
   - Reads `PUBLIC_SUPABASE_*` from environment
   - Bakes cloud Supabase credentials into the JavaScript bundle
   - Serves the app on http://localhost:4321

5. **Tests run**
   - Browser connects to http://localhost:4321
   - Client code uses cloud Supabase credentials (from bundle)
   - Login with test credentials works! ✅

## 🐛 If Tests Still Fail

### 1. Check what Supabase URL the browser is using

Add this to your test:
```typescript
const supabaseUrl = await page.evaluate(() => {
  return (window as any).__SUPABASE_URL__;
});
console.log("Browser is connecting to:", supabaseUrl);
```

Should show: `https://yqothdxgjaqwdaiugdnz.supabase.co`

### 2. Check dev server output

The Playwright config now has `stdout: "pipe"` so you can see the dev server output. Look for the Supabase configuration message.

### 3. Verify user exists

```bash
npm run test:e2e:check-user
```

Should authenticate successfully.

### 4. Check RLS policies

Make sure your Supabase tables have RLS policies that allow the test user to access data.

## 📚 Related Documentation

- `.ai/e2e-issue-resolution.md` - Detailed explanation of the issue
- `.ai/supabase-keys-guide.md` - Understanding Supabase key types
- `e2e/README.md` - E2E test documentation
- `.ai/e2e-quick-reference.md` - Quick reference card

## 🎉 Success Checklist

- [ ] `npm run test:e2e:verify` shows all ✅
- [ ] `npm run test:e2e:check-user` authenticates successfully
- [ ] No dev server running on port 4321
- [ ] Run `npm run test:e2e`
- [ ] See cloud Supabase URL in dev server output
- [ ] All 10 tests pass! 🎉

---

**TL;DR:** Stop any running dev servers, then just run `npm run test:e2e`. Playwright will handle everything else!

