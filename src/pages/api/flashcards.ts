/**
 * API Endpoint: POST /api/flashcards
 *
 * Creates a single flashcard, either manually created by the user
 * or accepted from an AI generation session.
 *
 * Request Body:
 * - front: string (1-200 chars, trimmed)
 * - back: string (1-500 chars, trimmed)
 * - source: "manual" | "ai_generated" | "ai_generated_edited"
 * - generation_id: number | null (required for AI-generated, null for manual)
 *
 * Response:
 * - 201 Created: Returns created flashcard (excluding user_id)
 * - 400 Bad Request: Validation error
 * - 404 Not Found: Generation not found or unauthorized
 * - 500 Internal Server Error: Database or unexpected error
 */

import type { APIRoute } from "astro";
import type { CreateFlashcardCommand, FlashcardDto, ApiResponseDto, ErrorResponseDto } from "../../types";
import { createFlashcardSchema } from "../../lib/schemas/flashcard.schemas";
import { createFlashcard } from "../../lib/services/flashcard.service";
import { GenerationNotFoundError, FlashcardCreationError } from "../../lib/errors/flashcard.errors";
import { ZodError } from "zod";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

/**
 * POST handler for creating a flashcard
 *
 * Flow:
 * 1. Get user ID (dev mode uses default user)
 * 2. Parse and validate request body with Zod
 * 3. Create flashcard via service layer
 * 4. Map entity to DTO (exclude user_id)
 * 5. Return 201 Created with flashcard data
 *
 * Error Handling:
 * - JSON parse errors → 400 with parse error details
 * - Zod validation errors → 400 with field-level validation details
 * - Generation not found → 404 with error message
 * - Database errors → 500 with generic error message
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user ID (dev mode uses default)
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
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

    // Step 3: Validate with Zod
    let validatedData: CreateFlashcardCommand;
    try {
      validatedData = createFlashcardSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
          } satisfies ErrorResponseDto),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // Step 4: Create flashcard via service
    const flashcard = await createFlashcard(locals.supabase, {
      ...validatedData,
      user_id: userId,
    });

    // Step 5: Map to DTO (exclude user_id)
    const flashcardDto: FlashcardDto = {
      id: flashcard.id,
      generation_id: flashcard.generation_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    };

    // Step 6: Return success response
    return new Response(JSON.stringify({ data: flashcardDto } satisfies ApiResponseDto<FlashcardDto>), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle generation not found
    if (error instanceof GenerationNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_NOT_FOUND",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle flashcard creation errors
    if (error instanceof FlashcardCreationError) {
      console.error("Flashcard creation error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "FLASHCARD_CREATION_FAILED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/flashcards:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "FLASHCARD_CREATION_FAILED",
          message: "An unexpected error occurred while creating the flashcard. Please try again later.",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
