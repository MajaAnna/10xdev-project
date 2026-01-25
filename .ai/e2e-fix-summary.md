# E2E Test Configuration Fix - Summary

## Problem Statement

E2E tests were failing when using cloud Supabase credentials (`TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY`), but working fine with local Supabase credentials.

## Root Cause

The `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY` environment variables were not being correctly passed to the client-side code because:

1. Astro requires `PUBLIC_` prefix for client-side environment variables
2. Environment variables are baked into the client bundle at build/dev server start time
3. The previous approach of setting `webServer.env` in Playwright config only affected the Node.js process, not the Astro build process

## Changes Made

### 1. **package.json** - Updated `dev:e2e` script

**Before:**
```json
"dev:e2e": "astro dev"
```

**After:**
```json
"dev:e2e": "PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL PUBLIC_SUPABASE_ANON_KEY=$TEST_SUPABASE_ANON_KEY astro dev"
```

**Why:** This ensures environment variables are set before Astro starts, so they get baked into the client bundle.

### 2. **playwright.config.ts** - Removed redundant `webServer.env`

**Before:**
```typescript
webServer: {
  command: "npm run dev:e2e",
  url: "http://localhost:4321",
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
  stdout: "ignore",
  stderr: "pipe",
  env: {
    PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL || "",
    PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || "",
  },
}
```

**After:**
```typescript
webServer: {
  command: "npm run dev:e2e",
  url: "http://localhost:4321",
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
  stdout: "ignore",
  stderr: "pipe",
}
```

**Why:** The environment variable mapping is now handled by the npm script, making this redundant.

### 3. **e2e/README.md** - Enhanced documentation

Added:
- Verification script step in Quick Start
- Clear explanation of environment variable mapping
- New troubleshooting section for cloud vs local Supabase issues
- Quick diagnosis section with verification script

### 4. **scripts/verify-e2e-env.js** - New verification script

Created a diagnostic script that:
- Checks all required E2E environment variables
- Masks sensitive values for security
- Provides clear error messages and setup instructions
- Exits with appropriate status codes

Added npm script:
```json
"test:e2e:verify": "node scripts/verify-e2e-env.js"
```

### 5. **.ai/e2e-supabase-config-fix.md** - Technical documentation

Created comprehensive technical documentation explaining:
- How Astro environment variables work
- Why the original approach didn't work
- How the fix works
- Visual diagram of the flow
- Cross-platform compatibility notes

## How to Use

### For Users

1. **Verify configuration:**
   ```bash
   npm run test:e2e:verify
   ```

2. **Run tests:**
   ```bash
   # Terminal 1
   npm run dev:e2e
   
   # Terminal 2
   npm run test:e2e
   ```

### For Developers

The key insight is that Astro's client-side environment variables must be:
1. Prefixed with `PUBLIC_`
2. Set **before** the dev server starts
3. Not changed after the server is running (requires restart)

## Testing the Fix

1. Ensure `.env` has all `TEST_*` variables set to cloud Supabase credentials
2. Stop any running dev servers
3. Run `npm run test:e2e:verify` to confirm configuration
4. Start fresh with `npm run dev:e2e`
5. In separate terminal, run `npm run test:e2e`
6. Tests should now connect to cloud Supabase successfully

## Files Modified

- `package.json` - Updated `dev:e2e` script, added `test:e2e:verify` script
- `playwright.config.ts` - Removed redundant `webServer.env` configuration
- `e2e/README.md` - Enhanced documentation and troubleshooting
- `scripts/verify-e2e-env.js` - New verification script (created)
- `.ai/e2e-supabase-config-fix.md` - Technical documentation (created)
- `.ai/e2e-fix-summary.md` - This summary document (created)

## Next Steps

1. Test the fix with your cloud Supabase credentials
2. If tests still fail, run `npm run test:e2e:verify` to diagnose
3. Consider adding `cross-env` for Windows compatibility if needed

