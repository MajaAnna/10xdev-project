import { createBrowserClient } from "@supabase/ssr"; // Import createBrowserClient

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Declare the global variable to avoid TypeScript errors
declare global {
  interface Window {
    __SUPABASE_INITIAL_SESSION_JSON__: any; // Now expecting a JavaScript object or null
  }
}

// Get the initial session from the global window object, which was set by Layout.astro
// It's already a JS object/null because of how Astro injects serialized JSON.
const initialSession = (typeof window !== 'undefined' && window.__SUPABASE_INITIAL_SESSION_JSON__)
  ? window.__SUPABASE_INITIAL_SESSION_JSON__
  : null;

export const supabaseClient = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      initialSession: initialSession, // Pass the initial session from the server
    },
  }
);
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
