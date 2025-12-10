/**
 * Custom error classes for flashcard generation operations
 *
 * These errors are used throughout the generation service and API endpoint
 * to provide consistent error handling and appropriate HTTP status codes.
 */

/**
 * Thrown when request validation fails
 * Maps to HTTP 400 Bad Request
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Thrown when authentication is required but missing or invalid
 * Maps to HTTP 401 Unauthorized
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required. Please provide a valid access token.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Thrown when rate limit is exceeded (from OpenRouter or custom limits)
 * Maps to HTTP 429 Too Many Requests
 */
export class RateLimitError extends Error {
  constructor(message = "Too many generation requests. Please try again in a few minutes.") {
    super(message);
    this.name = "RateLimitError";
  }
}

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
