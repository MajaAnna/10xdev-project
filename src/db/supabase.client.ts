import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";
import type { Session } from "@supabase/supabase-js";

// A custom type that extends the expected auth options with initialSession
interface CustomAuthClientOptionsAuth {
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean | ((url: URL, params: Record<string, string>) => boolean);
  storageKey?: string;
  storage?: Storage;
  flowType?: "pkce" | "implicit";
  initialSession?: Session | null;
  debug?: boolean;
}

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

declare global {
  interface Window {
    __SUPABASE_INITIAL_SESSION__: string;
  }
}

const initialSession: Session | null =
  typeof window !== "undefined" && window.__SUPABASE_INITIAL_SESSION__
    ? JSON.parse(window.__SUPABASE_INITIAL_SESSION__)
    : null;

export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    // Cast the auth options object to our custom type to include initialSession
    ...({ initialSession: initialSession } as CustomAuthClientOptionsAuth),
  },
});
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
