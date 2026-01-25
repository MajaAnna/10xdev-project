import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.server";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Supabase automatically clears the session cookie.
    return new Response(null, {
      status: 200,
    });
  } catch (err) {
    console.error("Logout API error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred during logout." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
