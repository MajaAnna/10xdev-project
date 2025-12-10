/**
 * Zod validation schemas for flashcard operations
 *
 * These schemas validate input data for flashcard CRUD operations,
 * ensuring data integrity and enforcing business rules before
 * processing requests.
 */

import { z } from "zod";

/**
 * Schema for creating a flashcard (POST /api/flashcards)
 *
 * Business Rules:
 * - front: 1-200 characters, non-empty after trim
 * - back: 1-500 characters, non-empty after trim
 * - source: Must be valid FlashcardSource enum value
 * - generation_id: Required for AI-generated flashcards, null for manual
 *
 * Validation Logic:
 * - If source = 'manual': generation_id MUST be null
 * - If source = 'ai_generated' or 'ai_generated_edited': generation_id MUST be a number
 */
export const createFlashcardSchema = z
  .object({
    front: z
      .string({ required_error: "Front is required" })
      .min(1, "Front is required")
      .max(200, "Front must not exceed 200 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, {
        message: "Front must contain at least 1 non-whitespace character",
      }),
    back: z
      .string({ required_error: "Back is required" })
      .min(1, "Back is required")
      .max(500, "Back must not exceed 500 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, {
        message: "Back must contain at least 1 non-whitespace character",
      }),
    source: z.enum(["manual", "ai_generated", "ai_generated_edited"], {
      required_error: "Source is required",
      invalid_type_error: "Source must be one of: manual, ai_generated, ai_generated_edited",
    }),
    generation_id: z
      .number({ invalid_type_error: "generation_id must be a number" })
      .int("generation_id must be an integer")
      .positive("generation_id must be a positive number")
      .nullable(),
  })
  .refine(
    (data) => {
      // Business rule: manual flashcards cannot have generation_id
      if (data.source === "manual") {
        return data.generation_id === null;
      }
      // Business rule: AI-generated flashcards must have generation_id
      if (data.source === "ai_generated" || data.source === "ai_generated_edited") {
        return data.generation_id !== null;
      }
      // If source is not recognized, fail validation
      return false;
    },
    {
      message: "generation_id must be null for manual flashcards and required for AI-generated flashcards",
      path: ["generation_id"],
    }
  );

/**
 * Inferred TypeScript type from createFlashcardSchema
 * Use this type for validated data in service layer
 */
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
