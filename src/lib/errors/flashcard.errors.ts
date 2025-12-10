/**
 * Custom error classes for flashcard operations
 *
 * These errors are specific to flashcard CRUD operations and related
 * business logic. For common HTTP errors (validation, auth, not found),
 * use the shared errors from common.errors.ts.
 */

// Re-export common errors for convenience
export { ValidationError, UnauthorizedError, NotFoundError, RateLimitError } from "./common.errors";

/**
 * Thrown when generation_id doesn't exist or doesn't belong to user
 * Maps to HTTP 404 Not Found
 *
 * Used when:
 * - Creating AI-generated flashcard with invalid generation_id
 * - generation_id exists but belongs to different user
 */
export class GenerationNotFoundError extends Error {
  constructor(message = "Generation session not found") {
    super(message);
    this.name = "GenerationNotFoundError";
  }
}

/**
 * Thrown when flashcard creation or update fails
 * Maps to HTTP 500 Internal Server Error
 *
 * Used for:
 * - Database insert/update failures
 * - Transaction rollback scenarios
 * - Generation count update failures
 */
export class FlashcardCreationError extends Error {
  constructor(
    message = "An error occurred while creating the flashcard",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "FlashcardCreationError";
  }
}

/**
 * Thrown when flashcard doesn't exist or doesn't belong to user
 * Maps to HTTP 404 Not Found
 *
 * Used in:
 * - GET /api/flashcards/:id
 * - PATCH /api/flashcards/:id
 * - DELETE /api/flashcards/:id
 */
export class FlashcardNotFoundError extends Error {
  constructor(message = "Flashcard not found") {
    super(message);
    this.name = "FlashcardNotFoundError";
  }
}
