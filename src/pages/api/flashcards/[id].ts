import type { APIRoute } from "astro";
import type { FlashcardDto, ApiResponseDto, ErrorResponseDto } from "../../../types";
import { UpdateFlashcardSchema } from "../../../lib/schemas/flashcard.schemas";
import { updateFlashcard } from "../../../lib/services/flashcard.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { NotFoundError } from "../../../lib/errors/common.errors";

export const prerender = false;

/**
 * PATCH handler for updating a flashcard
 *
 * Flow:
 * 1. Get user ID (dev mode uses default user)
 * 2. Get and validate flashcard ID from URL
 * 3. Parse and validate request body with Zod
 * 4. Update flashcard via service layer
 * 5. Map entity to DTO (exclude user_id)
 * 6. Return 200 OK with updated flashcard data
 *
 * Error Handling:
 * - Invalid ID format -> 400
 * - JSON parse errors -> 400
 * - Zod validation errors -> 400
 * - Flashcard not found or unauthorized -> 404
 * - Database or unexpected errors -> 500
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Get user ID
    const userId = DEFAULT_USER_ID;

    // 2. Get and validate flashcard ID
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid flashcard ID provided.",
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON format in request body.",
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validatedData = UpdateFlashcardSchema.safeParse(body);
    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: validatedData.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Update flashcard via service
    const updatedFlashcard = await updateFlashcard(locals.supabase, id, userId, validatedData.data);

    // 5. Map to DTO
    const flashcardDto: FlashcardDto = {
      id: updatedFlashcard.id,
      generation_id: updatedFlashcard.generation_id,
      front: updatedFlashcard.front,
      back: updatedFlashcard.back,
      source: updatedFlashcard.source,
      created_at: updatedFlashcard.created_at,
      updated_at: updatedFlashcard.updated_at,
    };

    // 6. Return success response
    return new Response(JSON.stringify({ data: flashcardDto } satisfies ApiResponseDto<FlashcardDto>), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error in PATCH /api/flashcards/[id]:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while updating the flashcard.",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
