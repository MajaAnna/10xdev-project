# E2E Test Issue - Complete Resolution

## 🔍 Problem Diagnosis

Your E2E tests were failing with:
```
Error: Login failed. Check .env:
- TEST_USER_EMAIL: majaprzyjazna2@gmail.com
- TEST_USER_PASSWORD: [SET]
- User must exist in Supabase with confirmed email
```

## 🎯 Root Cause

**You were using the wrong type of Supabase API key!**

Your `.env` had:
```bash
TEST_SUPABASE_ANON_KEY=sb_publishable_IXUIQZ80a56M71cpCiD_Vg_94ZIQS1T
```

This is a **publishable key** (used for Supabase Studio), NOT an **anon key** (used for client authentication).

### Why This Caused the Problem

1. ✅ Test credentials (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`) were correct
2. ✅ Test was reading environment variables correctly
3. ✅ Login form was being filled out correctly
4. ❌ **The Supabase client couldn't authenticate** because it was using a publishable key instead of an anon key
5. ❌ Result: "Invalid email or password" error

## ✅ Solution

### Step 1: Get the Correct Anon Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Settings → API**
3. Find **Project API keys** section
4. Copy the **anon** **public** key (NOT the publishable key)
   - It should be a long JWT token starting with `eyJ`
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...`

### Step 2: Update Your `.env` File

Replace the publishable key with the anon key:

```bash
# ❌ WRONG - Publishable key
TEST_SUPABASE_ANON_KEY=sb_publishable_IXUIQZ80a56M71cpCiD_Vg_94ZIQS1T

# ✅ CORRECT - Anon key (JWT format)
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

### Step 3: Verify Configuration

```bash
npm run test:e2e:verify
```

You should see:
```
✅ ALL REQUIRED VARIABLES SET

Your E2E test environment is configured correctly!
```

### Step 4: Run Tests

```bash
# Terminal 1
npm run dev:e2e

# Terminal 2
npm run test:e2e
```

## 🔧 Additional Improvements Made

### 1. Created `scripts/dev-e2e.js`

A Node.js script that properly maps `TEST_SUPABASE_*` to `PUBLIC_SUPABASE_*` environment variables before starting Astro. This is more reliable than shell variable expansion.

**Benefits:**
- ✅ Works consistently across different shells (bash, zsh, etc.)
- ✅ Provides clear feedback about which Supabase instance is being used
- ✅ Validates that TEST variables are set before starting
- ✅ Cross-platform compatible (works on macOS, Linux, Windows)

### 2. Enhanced Verification Script

Updated `scripts/verify-e2e-env.js` to detect common mistakes:
- ✅ Checks if all required variables are set
- ✅ Detects if publishable key is used instead of anon key
- ✅ Provides clear warnings and guidance
- ✅ Links to detailed documentation

### 3. Comprehensive Documentation

Created multiple documentation files:
- `.ai/supabase-keys-guide.md` - Explains different Supabase key types
- `.ai/e2e-issue-resolution.md` - This file (complete resolution guide)
- Updated `e2e/README.md` - Added warnings about key types

## 📋 Key Types Reference

| Key Type | Format | Starts With | Use Case | Safe to Expose? |
|----------|--------|-------------|----------|-----------------|
| **Anon Key** | JWT | `eyJ` | Client-side auth | ✅ Yes (with RLS) |
| **Publishable Key** | Custom | `sb_publishable_` | Supabase Studio | ⚠️ Limited use |
| **Service Role Key** | JWT | `eyJ` | Server-side admin | ❌ NO - Keep secret! |

## 🎯 Complete `.env` Configuration

```bash
# Local Development - Supabase
PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# E2E Tests - Cloud Supabase
TEST_SUPABASE_URL=https://yqothdxgjaqwdaiugdnz.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...  # ← Get this from dashboard
TEST_USER_EMAIL=majaprzyjazna2@gmail.com
TEST_USER_PASSWORD=wepvut-kefqy0-dYgfir
TEST_USER_ID=2b23ced2-3e4d-46e3-9c92-13d5819235c1

# Other configurations...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENROUTER_API_KEY=""
MOCK_AI_SERVICE=false
```

## 🧪 Testing Checklist

- [ ] Get correct anon key from Supabase Dashboard (Settings → API)
- [ ] Update `TEST_SUPABASE_ANON_KEY` in `.env` file
- [ ] Run `npm run test:e2e:verify` - should show ✅ all green
- [ ] Stop any running dev servers
- [ ] Start fresh: `npm run dev:e2e` (Terminal 1)
- [ ] Run tests: `npm run test:e2e` (Terminal 2)
- [ ] Tests should pass! 🎉

## 🐛 If Tests Still Fail

### Check 1: User Exists and Email is Confirmed

1. Go to Supabase Dashboard → Authentication → Users
2. Find user: `majaprzyjazna2@gmail.com`
3. Verify email is confirmed (green checkmark)
4. If not confirmed, click "..." → "Confirm email"

### Check 2: Correct Supabase Instance

The dev server should show:
```
🚀 Starting Astro dev server for E2E tests...

Environment configuration:
  PUBLIC_SUPABASE_URL: https://yqothdxgjaqwdaiugdnz.supabase.co
  PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
```

If it shows `http://127.0.0.1:54321`, the environment variables aren't being set correctly.

### Check 3: RLS Policies

Make sure your Supabase tables have appropriate RLS policies that allow the test user to:
- Read their own data
- Create flashcards
- Update their profile

## 📚 Related Documentation

- `.ai/supabase-keys-guide.md` - Detailed explanation of Supabase key types
- `e2e/README.md` - E2E test setup and running instructions
- `.ai/e2e-supabase-config-fix.md` - Technical details about environment variable mapping
- `.ai/e2e-quick-reference.md` - Quick reference for E2E testing

## 🎉 Success Criteria

When everything is working correctly:

1. ✅ `npm run test:e2e:verify` shows all green with no warnings
2. ✅ `npm run dev:e2e` shows cloud Supabase URL
3. ✅ `npm run test:e2e` passes all 10 navigation tests
4. ✅ No "Invalid email or password" errors
5. ✅ Tests can log in and navigate through the app

## 💡 Pro Tip

Save the correct anon key in a password manager or secure note. You'll need it for:
- E2E tests
- CI/CD pipelines
- Production deployments
- Any client-side Supabase connections

