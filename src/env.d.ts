/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

interface User {
  id: string;
  email?: string;
}

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      supabase?: SupabaseClient<Database>;
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
