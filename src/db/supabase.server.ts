import type { AstroCookies } from "astro";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookieHeader = context.headers.get("Cookie") ?? "";
          if (!cookieHeader) return [];
          return cookieHeader.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (value === undefined || value === null) {
              context.cookies.delete(name, options);
            } else {
              context.cookies.set(name, value, options);
            }
          });
        },
      },
    }
  );

  return supabase;
};
