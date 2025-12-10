import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand, GenerationResponseDto, ApiResponseDto, ErrorResponseDto } from "../../types";
import { generateFlashcardsSchema } from "../../lib/schemas/generation.schemas";
import { generateFlashcards } from "../../lib/services/generation.service";
import { RateLimitError, ServiceUnavailableError, GenerationFailedError } from "../../lib/errors/generation.errors";
import { ZodError } from "zod";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/generations
 *
 * Generates flashcard candidates from source text using AI (OpenRouter API)
 *
 * Request Body:
 * - source_text: string (100-10,000 characters)
 * - model?: string (optional, defaults to "gpt-4")
 *
 * Success Response (201):
 * - generation_id: number
 * - model: string
 * - generation_duration: number (in milliseconds)
 * - generated_count: number
 * - candidates: FlashcardCandidateDto[]
 *
 * Error Responses:
 * - 400: Validation error (invalid input)
 * - 429: Rate limit exceeded
 * - 500: Generation failed
 * - 503: AI service unavailable
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Use default user ID (auth will be implemented later)
    const userId = DEFAULT_USER_ID;

    console.log(request);

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body format",
            details: { parse_error: "Expected JSON object" },
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate request body with Zod
    let validatedData: GenerateFlashcardsCommand;
    try {
      validatedData = generateFlashcardsSchema.parse(body);
      console.log(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: firstError.message,
              details: {
                field: firstError.path.join("."),
                min_length: 100,
                max_length: 10000,
              },
            },
          } satisfies ErrorResponseDto),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // Generate flashcards with service
    const result = await generateFlashcards(locals.supabase, {
      source_text: validatedData.source_text,
      model: validatedData.model || "gpt-4",
      user_id: userId,
    });

    console.log(result);

    // Return success response
    const responseData: GenerationResponseDto = {
      generation_id: result.generation_id,
      model: result.model,
      generation_duration: result.generation_duration,
      generated_count: result.generated_count,
      candidates: result.candidates,
    };

    console.log(responseData);

    return new Response(JSON.stringify({ data: responseData } satisfies ApiResponseDto<GenerationResponseDto>), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle service unavailable errors
    if (error instanceof ServiceUnavailableError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle generation failed errors
    if (error instanceof GenerationFailedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_FAILED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/generations:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "GENERATION_FAILED",
          message: "An unexpected error occurred while generating flashcards:( Please try again later.",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
