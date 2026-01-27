# E2E Tests - Supabase Configuration Fix

## Problem

When running E2E tests with cloud Supabase credentials (`TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY`), tests were failing even though the same tests worked fine with local Supabase.

## Root Cause

The issue was that `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY` were not being used correctly by the client-side code.

### How Astro Environment Variables Work

1. **Server-side variables**: Can be accessed via `import.meta.env.ANY_VAR` in server-side code
2. **Client-side variables**: MUST be prefixed with `PUBLIC_` to be available in browser code
3. **Build-time bundling**: Client-side environment variables are baked into the JavaScript bundle at build/dev server start time

### The Original Problem

In `playwright.config.ts`, we were setting environment variables in `webServer.env`:

```typescript
webServer: {
  env: {
    PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL || "",
    PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || "",
  },
}
```

**This didn't work because:**
- The `webServer.env` only affects the Node.js process running the dev server
- Astro reads environment variables when the dev server **starts**, not from runtime `process.env`
- The client-side code (`src/db/supabase.client.ts`) was already bundled with the original `PUBLIC_SUPABASE_*` values

## Solution

### 1. Updated `package.json` Script

Changed the `dev:e2e` script to set environment variables **before** starting Astro:

```json
"dev:e2e": "PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL PUBLIC_SUPABASE_ANON_KEY=$TEST_SUPABASE_ANON_KEY astro dev"
```

This ensures that:
- Environment variables are set **before** Astro starts
- Astro reads the correct values during initialization
- Client-side code gets bundled with the test Supabase credentials

### 2. Simplified `playwright.config.ts`

Removed the redundant `webServer.env` configuration since the npm script now handles it:

```typescript
webServer: {
  command: "npm run dev:e2e",
  url: "http://localhost:4321",
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
  stdout: "ignore",
  stderr: "pipe",
  // No env needed - handled by dev:e2e script
}
```

### 3. Updated Documentation

Enhanced `e2e/README.md` with:
- Clear explanation of how environment variables are mapped
- Troubleshooting section for this specific issue
- Emphasis on using `npm run dev:e2e` (not `npm run dev`)

## How It Works Now

```
┌─────────────────────────────────────────────────────────────┐
│ .env file                                                   │
├─────────────────────────────────────────────────────────────┤
│ TEST_SUPABASE_URL=https://xxx.supabase.co                  │
│ TEST_SUPABASE_ANON_KEY=eyJxxx...                           │
│ TEST_USER_EMAIL=test@example.com                           │
│ TEST_USER_PASSWORD=password123                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ npm run dev:e2e                                             │
├─────────────────────────────────────────────────────────────┤
│ Sets: PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL               │
│       PUBLIC_SUPABASE_ANON_KEY=$TEST_SUPABASE_ANON_KEY     │
│ Then: astro dev                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Astro Dev Server                                            │
├─────────────────────────────────────────────────────────────┤
│ Reads: import.meta.env.PUBLIC_SUPABASE_URL                 │
│        import.meta.env.PUBLIC_SUPABASE_ANON_KEY            │
│ Bundles client code with cloud Supabase credentials        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Client-side Code (Browser)                                 │
├─────────────────────────────────────────────────────────────┤
│ supabaseClient connects to cloud Supabase                  │
│ Tests can authenticate with TEST_USER_EMAIL/PASSWORD       │
└─────────────────────────────────────────────────────────────┘
```

## Testing the Fix

1. Ensure `.env` has all required `TEST_*` variables
2. Stop any running dev servers
3. Start fresh: `npm run dev:e2e`
4. In separate terminal: `npm run test:e2e`
5. Tests should now connect to cloud Supabase successfully

## Cross-Platform Compatibility Note

The current solution uses Unix-style environment variable syntax:

```bash
PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL astro dev
```

For Windows compatibility, consider using `cross-env`:

```bash
npm install --save-dev cross-env
```

Then update `package.json`:

```json
"dev:e2e": "cross-env PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL PUBLIC_SUPABASE_ANON_KEY=$TEST_SUPABASE_ANON_KEY astro dev"
```

However, since the project is currently macOS-focused (as evidenced by `.DS_Store` in `.gitignore`), this is not immediately necessary.

