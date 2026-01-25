/// <reference types="astro/client" />

interface User {
  id: string;
  email?: string;
}

declare global {
  namespace App {
    interface Locals {
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly MOCK_AI_SERVICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
