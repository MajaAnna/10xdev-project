import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.server.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
// These paths do not require authentication
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/password-recovery",
  "/auth/callback",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/password-recovery",
  "/api/auth/logout", // Logout should always be accessible
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Check if the path is an API endpoint for flashcards, generations, etc.
  // These should also be protected by authentication.
  const isFlashcardsApi = url.pathname.startsWith("/api/flashcards");
  const isGenerationsApi = url.pathname.startsWith("/api/generations");

  const isProtectedApi = isFlashcardsApi || isGenerationsApi;

  // Create a Supabase server client instance for the current request
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  // Store supabase client in locals for access in API routes
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store user data in locals for access in Astro pages and API routes
  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else {
    locals.user = null;
  }

  // --- Authentication and Redirection Logic ---

  // Case 1: User is logged in
  if (locals.user) {
    // Allow logout endpoint even for logged-in users
    if (url.pathname === "/api/auth/logout") {
      return next();
    }
    // If a logged-in user tries to access a public auth page (login/register), redirect them to home page
    if (PUBLIC_PATHS.includes(url.pathname) && !url.pathname.startsWith("/api/auth/")) {
      return redirect("/");
    }
    // For all other cases (logged-in user accessing protected pages or public non-auth pages), allow access
    return next();
  }

  // Case 2: User is NOT logged in
  // If the path is a public path (login, register, auth API endpoints), allow access
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // If the path is a protected API endpoint, return an unauthorized response
  if (isProtectedApi) {
    return new Response("Unauthorized", { status: 401 });
  }

  // If the path is any other protected page, redirect to the login page
  return redirect("/auth/login");
});
