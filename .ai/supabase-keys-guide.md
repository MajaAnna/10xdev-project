# Supabase API Keys Guide

## ⚠️ IMPORTANT: Different Types of Keys

Supabase has multiple types of API keys, and it's crucial to use the correct one:

### 1. **Anon / Public Key** (What you need for E2E tests)
- **Format**: JWT token starting with `eyJ`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9...`
- **Used for**: Client-side authentication and API calls
- **Safe to expose**: Yes (in client-side code)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 2. **Publishable Key** (NOT what you need)
- **Format**: Starts with `sb_publishable_`
- **Example**: `sb_publishable_IXUIQZ80a56M71cpCiD_Vg_94ZIQS1T`
- **Used for**: Supabase Studio and certain admin operations
- **NOT for**: Client-side authentication

### 3. **Service Role Key** (Secret - don't use for E2E tests)
- **Format**: JWT token starting with `eyJ`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0...`
- **Used for**: Server-side operations that bypass RLS
- **Safe to expose**: NO - keep secret!
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

## 🔍 Current Issue

Your `.env` file has:
```bash
TEST_SUPABASE_ANON_KEY=sb_publishable_IXUIQZ80a56M71cpCiD_Vg_94ZIQS1T
```

This is a **publishable key**, not an **anon key**. This won't work for authentication.

## ✅ How to Fix

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Settings → API**
   - Left sidebar: Click "Settings" (gear icon)
   - Then click "API"

3. **Find the correct key**
   - Look for section: **Project API keys**
   - Find the key labeled: `anon` `public`
   - It should be a long JWT token starting with `eyJ`

4. **Copy the anon key**
   - Click the copy icon next to the `anon` `public` key
   - It will be several hundred characters long

5. **Update your `.env` file**
   ```bash
   TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

## 🎯 Complete .env Configuration for E2E Tests

```bash
# E2E Test Configuration - Cloud Supabase
TEST_SUPABASE_URL=https://yqothdxgjaqwdaiugdnz.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
TEST_USER_EMAIL=majaprzyjazna2@gmail.com
TEST_USER_PASSWORD=wepvut-kefqy0-dYgfir
TEST_USER_ID=2b23ced2-3e4d-46e3-9c92-13d5819235c1
```

## 🧪 Verify the Fix

After updating your `.env`:

1. **Verify configuration:**
   ```bash
   npm run test:e2e:verify
   ```

2. **Start dev server:**
   ```bash
   npm run dev:e2e
   ```
   
   You should see:
   ```
   🚀 Starting Astro dev server for E2E tests...
   
   Environment configuration:
     PUBLIC_SUPABASE_URL: https://yqothdxgjaqwdaiugdnz.supabase.co
     PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
   ```

3. **Run tests:**
   ```bash
   npm run test:e2e
   ```

## 🔐 Security Note

- ✅ **Anon key**: Safe to expose in client-side code (has RLS protection)
- ❌ **Service role key**: NEVER expose in client-side code (bypasses RLS)
- ℹ️ **Publishable key**: Used for Supabase Studio, not for client authentication

## 📚 More Information

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Understanding Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

