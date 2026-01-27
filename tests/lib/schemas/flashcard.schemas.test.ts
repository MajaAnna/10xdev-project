import { describe, it, expect } from "vitest";
import {
  createFlashcardSchema,
  listFlashcardsQuerySchema,
  UpdateFlashcardSchema,
  manualCardFormSchema,
} from "@/lib/schemas/flashcard.schemas";

describe("flashcard.schemas", () => {
  describe("createFlashcardSchema", () => {
    describe("valid data", () => {
      it("should validate manual flashcard", () => {
        const data = {
          front: "What is React?",
          back: "A JavaScript library for building user interfaces",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(data);
        }
      });

      it("should validate AI-generated flashcard", () => {
        const data = {
          front: "What is TypeScript?",
          back: "A typed superset of JavaScript",
          source: "ai_generated" as const,
          generation_id: 123,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate AI-generated-edited flashcard", () => {
        const data = {
          front: "What is Node.js?",
          back: "A JavaScript runtime",
          source: "ai_generated_edited" as const,
          generation_id: 456,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should trim whitespace from front and back", () => {
        const data = {
          front: "  Question with spaces  ",
          back: "  Answer with spaces  ",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.front).toBe("Question with spaces");
          expect(result.data.back).toBe("Answer with spaces");
        }
      });

      it("should accept front at max length (200 chars)", () => {
        const data = {
          front: "a".repeat(200),
          back: "Answer",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept back at max length (500 chars)", () => {
        const data = {
          front: "Question",
          back: "a".repeat(500),
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject missing front", () => {
        const data = {
          back: "Answer",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty front", () => {
        const data = {
          front: "",
          back: "Answer",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject front with only whitespace", () => {
        const data = {
          front: "   ",
          back: "Answer",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject front exceeding max length", () => {
        const data = {
          front: "a".repeat(201),
          back: "Answer",
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject back exceeding max length", () => {
        const data = {
          front: "Question",
          back: "a".repeat(501),
          source: "manual" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid source", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "invalid_source",
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject manual flashcard with generation_id", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "manual" as const,
          generation_id: 123, // Should be null for manual
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("generation_id");
        }
      });

      it("should reject AI-generated flashcard without generation_id", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "ai_generated" as const,
          generation_id: null, // Should be a number for AI-generated
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject AI-generated-edited flashcard without generation_id", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "ai_generated_edited" as const,
          generation_id: null,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject negative generation_id", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "ai_generated" as const,
          generation_id: -1,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject zero generation_id", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "ai_generated" as const,
          generation_id: 0,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-integer generation_id", () => {
        const data = {
          front: "Question",
          back: "Answer",
          source: "ai_generated" as const,
          generation_id: 123.45,
        };

        const result = createFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("listFlashcardsQuerySchema", () => {
    describe("valid data", () => {
      it("should use default values for null inputs", () => {
        const data = {
          page: null,
          limit: null,
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it("should parse valid page and limit strings", () => {
        const data = {
          page: "2",
          limit: "50",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(50);
        }
      });

      it("should accept limit at max value (100)", () => {
        const data = {
          page: "1",
          limit: "100",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept page 1", () => {
        const data = {
          page: "1",
          limit: "20",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject page less than 1", () => {
        const data = {
          page: "0",
          limit: "20",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject negative page", () => {
        const data = {
          page: "-1",
          limit: "20",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject limit less than 1", () => {
        const data = {
          page: "1",
          limit: "0",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject limit exceeding max (100)", () => {
        const data = {
          page: "1",
          limit: "101",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-numeric page", () => {
        const data = {
          page: "abc",
          limit: "20",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-integer page", () => {
        const data = {
          page: "1.5",
          limit: "20",
        };

        const result = listFlashcardsQuerySchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("UpdateFlashcardSchema", () => {
    describe("valid data", () => {
      it("should validate update with front only", () => {
        const data = {
          front: "Updated question",
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate update with back only", () => {
        const data = {
          back: "Updated answer",
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should validate update with both fields", () => {
        const data = {
          front: "Updated question",
          back: "Updated answer",
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should trim whitespace", () => {
        const data = {
          front: "  Trimmed  ",
          back: "  Trimmed  ",
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.front).toBe("Trimmed");
          expect(result.data.back).toBe("Trimmed");
        }
      });

      it("should accept front at max length", () => {
        const data = {
          front: "a".repeat(200),
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept back at max length", () => {
        const data = {
          back: "a".repeat(500),
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject empty object (no fields provided)", () => {
        const data = {};

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty front", () => {
        const data = {
          front: "",
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject front with only whitespace", () => {
        const data = {
          front: "   ",
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject front exceeding max length", () => {
        const data = {
          front: "a".repeat(201),
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject back exceeding max length", () => {
        const data = {
          back: "a".repeat(501),
        };

        const result = UpdateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("manualCardFormSchema", () => {
    describe("valid data", () => {
      it("should validate complete form data", () => {
        const data = {
          front: "Question",
          back: "Answer",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should trim whitespace", () => {
        const data = {
          front: "  Question  ",
          back: "  Answer  ",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.front).toBe("Question");
          expect(result.data.back).toBe("Answer");
        }
      });

      it("should accept front at max length", () => {
        const data = {
          front: "a".repeat(200),
          back: "Answer",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept back at max length", () => {
        const data = {
          front: "Question",
          back: "a".repeat(500),
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid data", () => {
      it("should reject missing front", () => {
        const data = {
          back: "Answer",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject missing back", () => {
        const data = {
          front: "Question",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject empty front", () => {
        const data = {
          front: "",
          back: "Answer",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject front with only whitespace", () => {
        const data = {
          front: "   ",
          back: "Answer",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject front exceeding max length", () => {
        const data = {
          front: "a".repeat(201),
          back: "Answer",
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject back exceeding max length", () => {
        const data = {
          front: "Question",
          back: "a".repeat(501),
        };

        const result = manualCardFormSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
