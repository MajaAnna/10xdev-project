import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.server";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("Logout API: Received POST request.");
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout API: Error during supabase.auth.signOut()", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    console.log("Logout API: supabase.auth.signOut() successful.");

    // Return success response - cookies are already cleared by the Supabase client
    // through the setAll callback in createSupabaseServerClient
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Logout API: Unexpected error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred during logout." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
