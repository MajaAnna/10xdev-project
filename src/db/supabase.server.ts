import type { AstroCookies } from "astro";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(key) {
          const cookie = context.cookies.get(key);
          return cookie ? cookie.value : undefined;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  return supabase;
};
