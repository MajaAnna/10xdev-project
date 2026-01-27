/**
 * Common error classes shared across all API endpoints
 *
 * These errors represent standard HTTP error scenarios that can occur
 * in any endpoint. They provide consistent error handling and appropriate
 * HTTP status codes across the application.
 */

/**
 * Thrown when request validation fails
 * Maps to HTTP 400 Bad Request
 *
 * Used for:
 * - Missing required fields
 * - Invalid field types or formats
 * - Field length violations
 * - Business rule violations
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
 *
 * Used for:
 * - Missing authentication token
 * - Invalid or expired token
 * - Token signature verification failure
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required. Please provide a valid access token.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Thrown when a requested resource is not found or user lacks access
 * Maps to HTTP 404 Not Found
 *
 * Used for:
 * - Resource doesn't exist in database
 * - Resource exists but belongs to different user
 * - Invalid resource ID
 */
export class NotFoundError extends Error {
  constructor(
    message: string,
    public resourceType?: string
  ) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Thrown when rate limit is exceeded
 * Maps to HTTP 429 Too Many Requests
 *
 * Used for:
 * - API rate limiting (per user/IP)
 * - External service rate limits (e.g., OpenRouter)
 * - Resource creation limits
 */
export class RateLimitError extends Error {
  constructor(message = "Too many requests. Please try again later.") {
    super(message);
    this.name = "RateLimitError";
  }
}
