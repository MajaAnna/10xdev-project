# E2E Tests - Quick Reference Card

## 🚦 Quick Start

```bash
# 1. Verify environment
npm run test:e2e:verify

# 2. Start dev server (Terminal 1)
npm run dev:e2e

# 3. Run tests (Terminal 2)
npm run test:e2e
```

## 📋 Required Environment Variables

Add to `.env`:

```bash
TEST_SUPABASE_URL=https://your-project.supabase.co
TEST_SUPABASE_ANON_KEY=your_anon_key_here
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=YourPassword123!
```

## 🔧 How It Works

```
.env (TEST_*)  →  npm script  →  Shell (PUBLIC_*)  →  Astro  →  Client Bundle
```

The `dev:e2e` script maps:
- `TEST_SUPABASE_URL` → `PUBLIC_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY` → `PUBLIC_SUPABASE_ANON_KEY`

## ⚠️ Important Rules

1. **Always use `npm run dev:e2e`** for E2E tests (not `npm run dev`)
2. **Restart dev server** after changing environment variables
3. **Verify first** with `npm run test:e2e:verify`
4. **Stop all servers** before starting fresh

## 🐛 Troubleshooting

### Tests fail with cloud credentials

```bash
# 1. Stop all dev servers
# 2. Verify configuration
npm run test:e2e:verify

# 3. Start fresh
npm run dev:e2e  # Terminal 1
npm run test:e2e # Terminal 2
```

### Login fails

Check:
- ✅ User exists in Supabase Dashboard
- ✅ User's email is confirmed
- ✅ `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are correct
- ✅ Using `npm run dev:e2e` (not `npm run dev`)

### Wrong Supabase instance

```bash
# Check which instance you're connected to
npm run test:e2e:verify

# Should show TEST_SUPABASE_URL, not PUBLIC_SUPABASE_URL
```

## 📝 Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run dev:e2e` | Start dev server with test credentials |
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:verify` | Verify environment configuration |
| `npm run test:e2e:ui` | Run tests in interactive UI mode |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:report` | View test results report |

## 🎯 Test Coverage

**Total: 10 navigation tests**

### Logged Out (4 tests)
- Navbar display with logged-out links
- Navigate to login page
- Navigate to register page
- Redirect to login when accessing protected routes

### Logged In (6 tests)
- Navbar display with logged-in links
- Navigate to generator page
- Navigate to my cards page
- Navigate to study page
- Navigate to profile page
- Navigate to home page

## 🔍 Debugging Tips

### Check if using correct Supabase

```bash
# In browser console (when dev server is running)
console.log(import.meta.env.PUBLIC_SUPABASE_URL)
```

Should show your cloud URL when using `npm run dev:e2e`.

### Check environment in dev server

```bash
# When starting dev:e2e, you should see:
# PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### View Playwright traces

```bash
# After test failure
npm run test:e2e:report

# Click on failed test to see trace viewer
```

## 💡 Pro Tips

1. **Use UI mode for debugging:**
   ```bash
   npm run test:e2e:ui
   ```

2. **Run specific test:**
   ```bash
   npx playwright test navbar.spec.ts
   ```

3. **Run specific test by name:**
   ```bash
   npx playwright test -g "should display navbar"
   ```

4. **See what Playwright sees:**
   ```bash
   npm run test:e2e:debug
   ```

5. **Check test data:**
   ```bash
   cat e2e/helpers/test-data.ts
   ```

## 📚 More Information

- Full documentation: `e2e/README.md`
- Technical details: `.ai/e2e-supabase-config-fix.md`
- Visual diagrams: `.ai/diagrams/e2e-env-flow.md`
- Summary: `.ai/e2e-fix-summary.md`

