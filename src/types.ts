/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * This file contains all DTO and Command Model type definitions for the AI Cards application.
 * Each type is derived from the database models defined in database.types.ts and aligned
 * with the API specifications in api-plan.md.
 */

import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from database models)
// ============================================================================

/**
 * Complete flashcard entity as stored in the database
 */
export type FlashcardEntity = Tables<"flashcards">;

/**
 * Generation session entity as stored in the database
 */
export type GenerationEntity = Tables<"generations">;

/**
 * Generation error log entity as stored in the database
 */
export type GenerationErrorLogEntity = Tables<"generation_error_logs">;

/**
 * Flashcard source enum values
 */
export type FlashcardSource = Enums<"flashcard_source">;

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Flashcard DTO returned in API responses
 * Excludes user_id as it's implicit (users only see their own data)
 */
export type FlashcardDto = Omit<FlashcardEntity, "user_id">;

/**
 * Command Model: Create a new flashcard (manual or from AI generation)
 * Used in POST /api/flashcards
 *
 * Business rules:
 * - If source = 'manual': generation_id MUST be null
 * - If source = 'ai_generated' or 'ai_generated_edited': generation_id MUST be provided
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id: number | null;
}

/**
 * Command Model: Update an existing flashcard
 * Used in PATCH /api/flashcards/:id
 *
 * At least one field (front or back) must be provided
 *
 * Note: source and generation_id are NOT included because:
 * - source is automatically updated by the API based on current value
 *   (ai_generated → ai_generated_edited, others stay the same)
 * - generation_id never changes after flashcard creation
 */
export interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}

/**
 * Individual flashcard item in bulk create request
 * Used within BulkCreateFlashcardsCommand
 */
export interface CreateFlashcardItemDto {
  front: string;
  back: string;
  source: Extract<FlashcardSource, "ai_generated" | "ai_generated_edited">;
}

/**
 * Command Model: Bulk create multiple flashcards
 * Used in POST /api/flashcards/bulk
 *
 * All flashcards in the array must belong to the same generation_id
 */
export interface BulkCreateFlashcardsCommand {
  generation_id: number;
  flashcards: CreateFlashcardItemDto[];
}

/**
 * Response DTO for bulk create operation
 * Used in POST /api/flashcards/bulk response
 */
export interface BulkCreateFlashcardsResponseDto {
  created_count: number;
  flashcards: FlashcardDto[];
}

/**
 * Response DTO for flashcard deletion
 * Used in DELETE /api/flashcards/:id response
 */
export interface DeleteFlashcardResponseDto {
  message: string;
  deleted_id: number;
}

/**
 * Response DTO for listing flashcards
 * Used in GET /api/flashcards response
 */
export interface ListFlashcardsResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

// ============================================================================
// Generation DTOs
// ============================================================================

/**
 * Generation DTO returned in API responses
 * Represents a complete generation session with all database fields
 * Includes calculated acceptance_rate field
 * Excludes user_id as it's implicit
 */
export type GenerationDto = Omit<GenerationEntity, "user_id"> & {
  acceptance_rate: number;
};

/**
 * Command Model: Generate flashcards from source text using AI
 * Used in POST /api/generations
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
  model?: string;
}

/**
 * Temporary flashcard candidate returned from AI generation
 * These are NOT saved to the database until explicitly accepted by the user
 */
export interface FlashcardCandidateDto {
  front: string;
  back: string;
}

/**
 * Response DTO for AI generation
 * Used in POST /api/generations response
 *
 * Contains the generation metadata and temporary candidates
 * Candidates are not persisted until user accepts them via POST /api/flashcards
 */
export interface GenerationResponseDto {
  generation_id: number;
  model: string;
  generation_duration: number;
  generated_count: number;
  candidates: FlashcardCandidateDto[];
}

/**
 * Generation DTO with associated flashcards
 * Used in GET /api/generations/:id response
 *
 * Includes all accepted flashcards that were created from this generation
 */
export type GenerationWithFlashcardsDto = Omit<GenerationEntity, "user_id"> & {
  flashcards: Pick<FlashcardDto, "id" | "front" | "back" | "source" | "created_at">[];
};

/**
 * Response DTO for listing generations
 * Used in GET /api/generations response
 */
export interface ListGenerationsResponseDto {
  data: GenerationDto[];
  pagination: PaginationDto;
}

// ============================================================================
// Generation Error Log DTOs
// ============================================================================

/**
 * Generation Error Log DTO returned in API responses
 * Represents an error that occurred during AI generation
 * Excludes user_id as it's implicit (or for admin filtering)
 */
export type GenerationErrorLogDto = Omit<GenerationErrorLogEntity, "user_id">;

/**
 * Response DTO for listing generation error logs
 * Used in GET /api/generation-error-logs response
 */
export interface ListGenerationErrorLogsResponseDto {
  data: GenerationErrorLogDto[];
  pagination: PaginationDto;
}

// ============================================================================
// Analytics DTOs
// ============================================================================

/**
 * Flashcards grouped by source type
 * Used in UserAnalyticsDto
 */
export interface FlashcardsBySourceDto {
  manual: number;
  ai_generated: number;
  ai_generated_edited: number;
}

/**
 * User analytics and success metrics
 * Used in GET /api/analytics/user response
 *
 * Calculated metrics:
 * - ai_adoption_rate: (ai_generated + ai_generated_edited) / total_flashcards
 * - average_acceptance_rate: Average of all generation acceptance rates
 */
export interface UserAnalyticsDto {
  total_flashcards: number;
  flashcards_by_source: FlashcardsBySourceDto;
  ai_adoption_rate: number;
  total_generations: number;
  average_acceptance_rate: number;
  created_at: string;
}

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Pagination metadata
 * Included in all paginated API responses
 */
export interface PaginationDto {
  page: number;
  limit: number;
  total_pages: number;
  total_items: number;
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Validation error detail
 * Used in ErrorResponseDto
 */
export interface ValidationErrorDetailDto {
  field: string;
  message: string;
}

/**
 * Error response structure
 * All API errors follow this consistent format
 */
export interface ErrorResponseDto {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetailDto[] | Record<string, unknown>;
  };
}

// ============================================================================
// API Response Wrapper Types
// ============================================================================

/**
 * Generic successful response wrapper for single resources
 *
 * @template T - The type of the resource in the data field
 */
export interface ApiResponseDto<T> {
  data: T;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for listing flashcards
 * Used in GET /api/flashcards
 */
export interface ListFlashcardsQueryParams {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
}

/**
 * Query parameters for listing generations
 * Used in GET /api/generations
 */
export interface ListGenerationsQueryParams {
  page?: number;
  limit?: number;
}

/**
 * Query parameters for listing generation error logs
 * Used in GET /api/generation-error-logs
 */
export interface ListGenerationErrorLogsQueryParams {
  page?: number;
  limit?: number;
  user_id?: string;
  model?: string;
  from_date?: string;
  to_date?: string;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a flashcard source is AI-generated
 */
export const isAiGeneratedSource = (
  source: FlashcardSource
): source is Extract<FlashcardSource, "ai_generated" | "ai_generated_edited"> => {
  return source === "ai_generated" || source === "ai_generated_edited";
};

/**
 * Type guard to check if a flashcard source is manual
 */
export const isManualSource = (source: FlashcardSource): source is Extract<FlashcardSource, "manual"> => {
  return source === "manual";
};
