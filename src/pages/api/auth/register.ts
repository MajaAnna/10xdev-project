import type { APIRoute } from "astro";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { createSupabaseServerClient } from "../../../db/supabase.server";

const RegisterSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = RegisterSchema.parse(body);

    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Map common Supabase errors to user-friendly messages
      let errorMessage = "An error occurred during registration. Please try again.";

      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        errorMessage = "An account with this email already exists.";
      } else if (error.message.includes("password")) {
        errorMessage = "Password does not meet requirements.";
      } else if (error.message.includes("email")) {
        errorMessage = "Please enter a valid email address.";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if email confirmation is required
    // Supabase returns user but session might be null if email confirmation is enabled
    const requiresConfirmation = !data.session;

    return new Response(
      JSON.stringify({
        success: true,
        requiresConfirmation,
        message: requiresConfirmation
          ? "Registration successful! Please check your email to confirm your account before logging in."
          : "Registration successful!",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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
    console.error("Register API error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
