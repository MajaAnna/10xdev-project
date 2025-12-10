import { z } from "zod";

/**
 * Zod schema for validating flashcard generation requests
 *
 * Validates:
 * - source_text: Must be between 100 and 10,000 characters after trimming
 * - model: Optional AI model name, defaults to "gpt-4"
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(100, "Source text must be at least 100 characters")
    .max(10000, "Source text must not exceed 10,000 characters")
    .transform((val) => val.trim())
    .refine((val) => val.length >= 100, {
      message: "Source text must contain at least 100 non-whitespace characters",
    }),
  model: z.string().optional().default("gpt-4"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
