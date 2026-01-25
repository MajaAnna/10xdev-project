import type { APIRoute } from "astro";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { createSupabaseServerClient } from "../../../db/supabase.server";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // For security, return a generic error message
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 400, // or 401 Unauthorized
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Supabase automatically sets the session cookie. Client will reload and middleware will handle redirection.
    return new Response(null, {
      status: 200,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const validationError = fromZodError(err);
      return new Response(JSON.stringify({ error: validationError.message }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    console.error("Login API error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
