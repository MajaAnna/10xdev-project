import { z } from "zod";
import type { APIContext, APIRoute } from "astro";
import { deleteFlashcard, updateFlashcard } from "../../../lib/services/flashcard.service";
import { NotFoundError } from "../../../lib/errors/common.errors"; // UnauthorizedError is removed
import { UpdateFlashcardSchema } from "../../../lib/schemas/flashcard.schemas";
import type {
  ApiResponseDto,
  DeleteFlashcardResponseDto,
  ErrorResponseDto,
  FlashcardDto,
} from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client"; // Import DEFAULT_USER_ID

export const prerender = false;

// Schema for validating the ID from the URL path for both PATCH and DELETE
const flashcardParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const userId = DEFAULT_USER_ID; // Use DEFAULT_USER_ID
    const { supabase } = locals; // user is no longer destructured

    const { id } = flashcardParamsSchema.parse(params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDto = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON format in request body.",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = UpdateFlashcardSchema.safeParse(body);
    if (!validatedData.success) {
      const errorResponse: ErrorResponseDto = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: validatedData.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedFlashcard = await updateFlashcard(
      supabase,
      id,
      userId, // Use userId
      validatedData.data
    );

    const flashcardDto: FlashcardDto = {
      id: updatedFlashcard.id,
      generation_id: updatedFlashcard.generation_id,
      front: updatedFlashcard.front,
      back: updatedFlashcard.back,
      source: updatedFlashcard.source,
      created_at: updatedFlashcard.created_at,
      updated_at: updatedFlashcard.updated_at,
    };

    return new Response(
      JSON.stringify({ data: flashcardDto } as ApiResponseDto<FlashcardDto>),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const headers = { "Content-Type": "application/json" };
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDto = {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid flashcard ID provided.",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), { status: 400, headers });
    }
    // UnauthorizedError handling removed
    if (error instanceof NotFoundError) {
      const errorResponse: ErrorResponseDto = {
        error: { code: "FLASHCARD_NOT_FOUND", message: error.message },
      };
      return new Response(JSON.stringify(errorResponse), { status: 404, headers });
    }

    console.error("Unexpected error in PATCH /api/flashcards/[id]:", error);
    const errorResponse: ErrorResponseDto = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while updating the flashcard.",
      },
    };
    return new Response(JSON.stringify(errorResponse), { status: 500, headers });
  }
};

export async function DELETE({ params, locals }: APIContext): Promise<Response> {
  try {
    const { id: flashcardId } = flashcardParamsSchema.parse(params);
    const userId = DEFAULT_USER_ID; // Use DEFAULT_USER_ID
    const { supabase } = locals; // user is no longer destructured

    const deletedId = await deleteFlashcard(supabase, flashcardId, userId); // Use userId

    const responseDto: DeleteFlashcardResponseDto = {
      message: "Flashcard deleted successfully.",
      deleted_id: deletedId,
    };

    return new Response(
      JSON.stringify({
        data: responseDto,
      } as ApiResponseDto<DeleteFlashcardResponseDto>),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const headers = { "Content-Type": "application/json" };
    if (err instanceof z.ZodError) {
      const errorResponse: ErrorResponseDto = {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid flashcard ID provided.",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers,
      });
    }
    // UnauthorizedError handling removed
    if (err instanceof NotFoundError) {
      const errorResponse: ErrorResponseDto = {
        error: { code: "FLASHCARD_NOT_FOUND", message: err.message },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers,
      });
    }

    console.error("Unexpected error in DELETE /api/flashcards/[id]:", err);
    const errorResponse: ErrorResponseDto = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while deleting the flashcard.",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers,
    });
  }
}