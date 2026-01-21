import type { APIRoute } from "astro";
import { generationRequestSchema } from "../../lib/schemas/generation.schemas";
import type { GenerationResponseDto } from "../../types"; // Removed OpenRouterRequest
import { generateFlashcards } from "../../lib/services/generation.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const POST: APIRoute = async ({ request, locals }) => {
  // Added locals
  try {
    const body = await request.json();
    const validation = generationRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane wejściowe.", details: validation.error.flatten() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { text, model } = validation.data;
    const userId = DEFAULT_USER_ID;

    const result = await generateFlashcards(locals.supabase, {
      // Pass locals.supabase
      source_text: text,
      model: model || "google/gemma-3n-e2b-it:free",
      user_id: userId,
    });

    const generationResponse: GenerationResponseDto = {
      generation_id: result.generation_id,
      model: result.model,
      generation_duration: result.generation_duration,
      generated_count: result.generated_count,
      candidates: result.candidates,
    };

    return new Response(JSON.stringify(generationResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[API/Generations] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
    return new Response(
      JSON.stringify({
        error: "Wystąpił wewnętrzny błąd serwera.",
        details: errorMessage,
        stack:
          import.meta.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined, // Provide stack in development
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const prerender = false;
