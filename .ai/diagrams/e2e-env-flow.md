# E2E Environment Variables Flow

## Before Fix (Not Working)

```mermaid
sequenceDiagram
    participant ENV as .env File
    participant PW as Playwright Config
    participant NPM as npm run dev:e2e
    participant ASTRO as Astro Dev Server
    participant CLIENT as Client Bundle

    ENV->>PW: Load TEST_SUPABASE_*
    PW->>NPM: Start with webServer.env
    NPM->>ASTRO: astro dev
    Note over ASTRO: Reads PUBLIC_SUPABASE_*<br/>from original .env<br/>(not from webServer.env)
    ASTRO->>CLIENT: Bundle with LOCAL credentials
    Note over CLIENT: ❌ Connects to wrong Supabase
```

**Problem:** The `webServer.env` in Playwright config only affects the Node.js process, not the Astro build process. Astro reads environment variables directly from the system environment at startup.

## After Fix (Working)

```mermaid
sequenceDiagram
    participant ENV as .env File
    participant NPM as npm run dev:e2e
    participant SHELL as Shell Environment
    participant ASTRO as Astro Dev Server
    participant CLIENT as Client Bundle
    participant TESTS as E2E Tests

    ENV->>NPM: Load TEST_SUPABASE_*
    NPM->>SHELL: Set PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL
    NPM->>SHELL: Set PUBLIC_SUPABASE_ANON_KEY=$TEST_SUPABASE_ANON_KEY
    SHELL->>ASTRO: astro dev (with env vars)
    Note over ASTRO: Reads PUBLIC_SUPABASE_*<br/>from shell environment
    ASTRO->>CLIENT: Bundle with CLOUD credentials
    CLIENT->>TESTS: ✅ Connects to cloud Supabase
```

**Solution:** Set environment variables in the npm script **before** starting Astro, ensuring they're available in the shell environment when Astro reads them.

## Environment Variable Mapping

```mermaid
graph LR
    subgraph ".env File"
        A[TEST_SUPABASE_URL]
        B[TEST_SUPABASE_ANON_KEY]
        C[TEST_USER_EMAIL]
        D[TEST_USER_PASSWORD]
    end

    subgraph "npm run dev:e2e"
        E[PUBLIC_SUPABASE_URL]
        F[PUBLIC_SUPABASE_ANON_KEY]
    end

    subgraph "Astro Client Bundle"
        G[import.meta.env.PUBLIC_SUPABASE_URL]
        H[import.meta.env.PUBLIC_SUPABASE_ANON_KEY]
    end

    subgraph "Supabase Client"
        I[createBrowserClient]
    end

    subgraph "E2E Tests"
        J[Login with TEST_USER_*]
    end

    A -->|mapped by script| E
    B -->|mapped by script| F
    E -->|read at build time| G
    F -->|read at build time| H
    G --> I
    H --> I
    C --> J
    D --> J
    I -.->|connects to| K[Cloud Supabase]
    J -.->|authenticates with| K
```

## Key Concepts

### 1. Astro Environment Variables

```typescript
// Server-side (any name)
const secret = import.meta.env.SECRET_KEY;

// Client-side (must have PUBLIC_ prefix)
const apiUrl = import.meta.env.PUBLIC_API_URL;
```

### 2. Build-time vs Runtime

```mermaid
graph TD
    A[Dev Server Start] --> B{Read Environment}
    B --> C[Build Client Bundle]
    C --> D[Bake PUBLIC_* vars into JS]
    D --> E[Serve to Browser]
    
    F[Runtime Change] -.->|❌ No Effect| D
    
    style F fill:#f99
    style D fill:#9f9
```

**Important:** Client-side environment variables are **baked in** at build time. Changing them at runtime has no effect.

### 3. The Fix in Action

```bash
# ❌ Wrong: Sets env after Astro starts
astro dev
# (Astro already read PUBLIC_* from .env)

# ✅ Correct: Sets env before Astro starts
PUBLIC_SUPABASE_URL=$TEST_SUPABASE_URL astro dev
# (Astro reads PUBLIC_* from shell environment)
```

## Verification Flow

```mermaid
graph TD
    A[Run: npm run test:e2e:verify] --> B{Check .env}
    B -->|Missing vars| C[❌ Show Error]
    B -->|All present| D[✅ Show Success]
    C --> E[Display Setup Instructions]
    D --> F[Ready to run tests]
    F --> G[Terminal 1: npm run dev:e2e]
    F --> H[Terminal 2: npm run test:e2e]
```

## Common Pitfalls

### Pitfall 1: Using webServer.env

```typescript
// ❌ Doesn't work for client-side code
webServer: {
  env: {
    PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL
  }
}
```

**Why:** This only affects the Node.js process, not the Astro build.

### Pitfall 2: Changing env while server is running

```bash
# Terminal 1: Server running
npm run dev:e2e

# Terminal 2: Change .env
echo "TEST_SUPABASE_URL=new-url" >> .env

# ❌ No effect! Server must be restarted
```

**Why:** Environment variables are read once at startup.

### Pitfall 3: Forgetting PUBLIC_ prefix

```typescript
// ❌ Won't be available in browser
const url = import.meta.env.SUPABASE_URL;

// ✅ Correct
const url = import.meta.env.PUBLIC_SUPABASE_URL;
```

**Why:** Astro only exposes `PUBLIC_*` variables to client-side code.

