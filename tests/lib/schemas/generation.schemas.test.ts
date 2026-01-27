import { describe, it, expect } from "vitest";
import {
  flashcardGenerationSchema,
  generationResponseSchema,
  generationRequestSchema,
} from "@/lib/schemas/generation.schemas";

describe("generation.schemas", () => {
  describe("flashcardGenerationSchema", () => {
    describe("valid data", () => {
      it("should validate flashcard with front and back", () => {
        const data = {
          front: "What is JavaScript?",
          back: "A programming language",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(data);
        }
      });

      it("should accept single character strings", () => {
        const data = {
          front: "Q",
          back: "A",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept very long strings", () => {
        const data = {
          front: "a".repeat(1000),
          back: "b".repeat(1000),
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept strings with special characters", () => {
        const data = {
          front: "What is 2 + 2?",
          back: "It's 4!",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept strings with unicode", () => {
        const data = {
          front: "Co to jest JavaScript? 🤔",
          back: "Język programowania 💻",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject missing front", () => {
        const data = {
          back: "Answer",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject missing back", () => {
        const data = {
          front: "Question",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty front", () => {
        const data = {
          front: "",
          back: "Answer",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty back", () => {
        const data = {
          front: "Question",
          back: "",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject both empty", () => {
        const data = {
          front: "",
          back: "",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-string front", () => {
        const data = {
          front: 123,
          back: "Answer",
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-string back", () => {
        const data = {
          front: "Question",
          back: 123,
        };

        const result = flashcardGenerationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("generationResponseSchema", () => {
    describe("valid data", () => {
      it("should validate response with flashcards array", () => {
        const data = {
          flashcards: [
            { front: "Q1", back: "A1" },
            { front: "Q2", back: "A2" },
          ],
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate response with empty flashcards array", () => {
        const data = {
          flashcards: [],
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate response with single flashcard", () => {
        const data = {
          flashcards: [{ front: "Question", back: "Answer" }],
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate response with many flashcards", () => {
        const flashcards = Array.from({ length: 50 }, (_, i) => ({
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
        }));

        const data = { flashcards };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject missing flashcards field", () => {
        const data = {};

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-array flashcards", () => {
        const data = {
          flashcards: "not an array",
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject flashcards with invalid items", () => {
        const data = {
          flashcards: [
            { front: "Q1", back: "A1" },
            { front: "", back: "A2" },
          ],
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject flashcards with missing front", () => {
        const data = {
          flashcards: [{ back: "Answer" }],
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject flashcards with missing back", () => {
        const data = {
          flashcards: [{ front: "Question" }],
        };

        const result = generationResponseSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("generationRequestSchema", () => {
    describe("valid data", () => {
      it("should validate request with text only", () => {
        const data = {
          text: "Generate flashcards from this text",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate request with text and model", () => {
        const data = {
          text: "Generate flashcards from this text",
          model: "gpt-4",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept very long text", () => {
        const data = {
          text: "a".repeat(10000),
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept text with special characters", () => {
        const data = {
          text: "Text with special chars: !@#$%^&*()",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept text with unicode", () => {
        const data = {
          text: "Unicode text: 你好世界 🌍",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept text with newlines", () => {
        const data = {
          text: "Line 1\nLine 2\nLine 3",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject missing text", () => {
        const data = {};

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty text", () => {
        const data = {
          text: "",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-string text", () => {
        const data = {
          text: 123,
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty model string", () => {
        const data = {
          text: "Valid text",
          model: "",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-string model", () => {
        const data = {
          text: "Valid text",
          model: 123,
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("optional model field", () => {
      it("should accept undefined model", () => {
        const data = {
          text: "Valid text",
          model: undefined,
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept missing model field", () => {
        const data = {
          text: "Valid text",
        };

        const result = generationRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.model).toBeUndefined();
        }
      });
    });
  });
});
