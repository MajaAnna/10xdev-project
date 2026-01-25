/**
 * API Endpoints: /api/flashcards
 *
 * POST /api/flashcards
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
 *
 * GET /api/flashcards
 * Lists flashcards for the authenticated user with pagination.
 *
 * Query Parameters:
 * - page: number (default: 1, min: 1)
 * - limit: number (default: 20, min: 1, max: 100)
 *
 * Response:
 * - 200 OK: Returns flashcards array and pagination metadata
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication (production)
 * - 500 Internal Server Error: Database or unexpected error
 */

import type { APIRoute } from "astro";
import type {
  CreateFlashcardCommand,
  FlashcardDto,
  ApiResponseDto,
  ErrorResponseDto,
  ListFlashcardsResponseDto,
  PaginationDto,
} from "../../types";
import { createFlashcardSchema, listFlashcardsQuerySchema } from "../../lib/schemas/flashcard.schemas";
import { createFlashcard, listFlashcards } from "../../lib/services/flashcard.service";
import { GenerationNotFoundError, FlashcardCreationError } from "../../lib/errors/flashcard.errors";
import { ZodError } from "zod";

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
    // Step 1: Get user ID
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        } satisfies ErrorResponseDto),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const userId = locals.user.id;

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

/**
 * GET handler for listing flashcards
 *
 * Flow:
 * 1. Get user ID (dev mode uses default user)
 * 2. Extract and validate query parameters with Zod
 * 3. Fetch flashcards via service layer
 * 4. Map entities to DTOs (exclude user_id)
 * 5. Calculate pagination metadata
 * 6. Return 200 OK with flashcards and pagination
 *
 * Error Handling:
 * - Zod validation errors → 400 with field-level validation details
 * - Database errors → 500 with generic error message
 * - Empty results → 200 with empty array (valid scenario)
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Get user ID
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        } satisfies ErrorResponseDto),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const userId = locals.user.id;

    // Step 2: Extract and validate query parameters
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };

    let validatedParams: { page: number; limit: number };
    try {
      validatedParams = listFlashcardsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_PARAMETERS",
              message: "Invalid pagination parameters",
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

    // Step 3: Fetch flashcards via service
    const { flashcards, totalCount } = await listFlashcards(locals.supabase, {
      user_id: userId,
      page: validatedParams.page,
      limit: validatedParams.limit,
    });

    // Step 4: Map to DTOs (exclude user_id from each flashcard)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const flashcardDtos: FlashcardDto[] = flashcards.map(({ user_id: _, ...rest }) => rest);

    // Step 5: Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const pagination: PaginationDto = {
      page: validatedParams.page,
      limit: validatedParams.limit,
      total_pages: totalPages,
      total_items: totalCount,
    };

    // Step 6: Return success response
    const response: ListFlashcardsResponseDto = {
      data: flashcardDtos,
      pagination,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in GET /api/flashcards:", error);

    // Return generic error message (don't expose internal details)
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing your request",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
