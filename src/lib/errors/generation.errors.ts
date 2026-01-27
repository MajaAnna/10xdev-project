/**
 * Custom error classes for flashcard generation operations
 *
 * These errors are specific to AI generation operations. For common HTTP errors
 * (validation, auth, rate limiting), use the shared errors from common.errors.ts.
 */

// Re-export common errors for convenience
export { ValidationError, UnauthorizedError, RateLimitError } from "./common.errors";

/**
 * Thrown when AI service is unavailable or times out
 * Maps to HTTP 503 Service Unavailable
 */
export class ServiceUnavailableError extends Error {
  constructor(message = "AI service is temporarily unavailable. Please try again later.") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Thrown when flashcard generation fails for any other reason
 * Maps to HTTP 500 Internal Server Error
 */
export class GenerationFailedError extends Error {
  constructor(
    message = "An error occurred while generating flashcards. Please try again later.",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "GenerationFailedError";
  }
}
