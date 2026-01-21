import { z } from "zod";

export const flashcardGenerationSchema = z.object({
  front: z.string().min(1, "Pole 'front' nie może być puste."),
  back: z.string().min(1, "Pole 'back' nie może być puste."),
});

export const generationResponseSchema = z.object({
  flashcards: z.array(flashcardGenerationSchema),
});

export const generationRequestSchema = z.object({
  text: z.string().min(1, "Tekst do wygenerowania fiszek nie może być pusty."),
  model: z.string().min(1).optional(),
});
