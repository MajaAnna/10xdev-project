/**
 * Data Transfer Objects (DTOs) and Command Models
 * 
 * This file contains all DTO and Command Model type definitions for the AI Cards application.
 * Each type is derived from the database models defined in database.types.ts and aligned
 * with the API specifications in api-plan.md.
 */

import type { Tables, TablesInsert, TablesUpdate, Enums } from './db/database.types';

// ============================================================================
// Base Entity Types (derived from database models)
// ============================================================================

/**
 * Complete flashcard entity as stored in the database
 */
export type FlashcardEntity = Tables<'flashcards'>;

/**
 * Generation session entity as stored in the database
 */
export type GenerationEntity = Tables<'generations'>;

/**
 * Generation error log entity as stored in the database
 */
export type GenerationErrorLogEntity = Tables<'generation_error_logs'>;

/**
 * Flashcard source enum values
 */
export type FlashcardSource = Enums<'flashcard_source'>;

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Flashcard DTO returned in API responses
 * Represents a complete flashcard with all database fields
 */
export type FlashcardDTO = FlashcardEntity;

/**
 * Command Model: Create a new flashcard (manual or from AI generation)
 * Used in POST /api/flashcards
 * 
 * Business rules:
 * - If source = 'manual': generation_id MUST be null
 * - If source = 'ai_generated' or 'ai_generated_edited': generation_id MUST be provided
 */
export type CreateFlashcardDTO = {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id: number | null;
};

/**
 * Command Model: Update an existing flashcard
 * Used in PATCH /api/flashcards/:id
 * 
 * At least one field (front or back) must be provided
 * The source field is automatically updated by the API based on business logic
 */
export type UpdateFlashcardDTO = {
  front?: string;
  back?: string;
};

/**
 * Individual flashcard item in bulk create request
 * Used within BulkCreateFlashcardsDTO
 */
export type BulkCreateFlashcardItemDTO = {
  front: string;
  back: string;
  source: Extract<FlashcardSource, 'ai_generated' | 'ai_generated_edited'>;
};

/**
 * Command Model: Bulk create multiple flashcards
 * Used in POST /api/flashcards/bulk
 * 
 * All flashcards in the array must belong to the same generation_id
 */
export type BulkCreateFlashcardsDTO = {
  generation_id: number;
  flashcards: BulkCreateFlashcardItemDTO[];
};

/**
 * Response DTO for bulk create operation
 * Used in POST /api/flashcards/bulk response
 */
export type BulkCreateFlashcardsResponseDTO = {
  created_count: number;
  flashcards: FlashcardDTO[];
};

/**
 * Response DTO for flashcard deletion
 * Used in DELETE /api/flashcards/:id response
 */
export type DeleteFlashcardResponseDTO = {
  message: string;
  deleted_id: number;
};

// ============================================================================
// Generation DTOs
// ============================================================================

/**
 * Generation DTO returned in API responses
 * Represents a complete generation session with all database fields
 * Includes calculated acceptance_rate field
 */
export type GenerationDTO = GenerationEntity & {
  acceptance_rate: number;
};

/**
 * Command Model: Create a new AI generation
 * Used in POST /api/generations
 */
export type CreateGenerationDTO = {
  source_text: string;
  model?: string;
};

/**
 * Temporary flashcard candidate returned from AI generation
 * These are NOT saved to the database until explicitly accepted by the user
 */
export type FlashcardCandidateDTO = {
  front: string;
  back: string;
};

/**
 * Response DTO for AI generation
 * Used in POST /api/generations response
 * 
 * Contains the generation metadata and temporary candidates
 * Candidates are not persisted until user accepts them via POST /api/flashcards
 */
export type GenerationResponseDTO = {
  generation_id: number;
  model: string;
  generation_duration: number;
  generated_count: number;
  candidates: FlashcardCandidateDTO[];
};

/**
 * Generation DTO with associated flashcards
 * Used in GET /api/generations/:id response
 * 
 * Includes all accepted flashcards that were created from this generation
 */
export type GenerationWithFlashcardsDTO = Omit<GenerationEntity, 'source_text_hash'> & {
  flashcards: Pick<FlashcardDTO, 'id' | 'front' | 'back' | 'source' | 'created_at'>[];
};

// ============================================================================
// Generation Error Log DTOs
// ============================================================================

/**
 * Generation Error Log DTO returned in API responses
 * Represents an error that occurred during AI generation
 */
export type GenerationErrorLogDTO = GenerationErrorLogEntity;

// ============================================================================
// Analytics DTOs
// ============================================================================

/**
 * Flashcards grouped by source type
 * Used in UserAnalyticsDTO
 */
export type FlashcardsBySourceDTO = {
  manual: number;
  ai_generated: number;
  ai_generated_edited: number;
};

/**
 * User analytics and success metrics
 * Used in GET /api/analytics/user response
 * 
 * Calculated metrics:
 * - ai_adoption_rate: (ai_generated + ai_generated_edited) / total_flashcards
 * - average_acceptance_rate: Average of all generation acceptance rates
 */
export type UserAnalyticsDTO = {
  total_flashcards: number;
  flashcards_by_source: FlashcardsBySourceDTO;
  ai_adoption_rate: number;
  total_generations: number;
  average_acceptance_rate: number;
  created_at: string;
};

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Pagination metadata
 * Included in all paginated API responses
 */
export type PaginationDTO = {
  page: number;
  limit: number;
  total_pages: number;
  total_items: number;
};

/**
 * Generic paginated response wrapper
 * Used for all list endpoints that support pagination
 * 
 * @template T - The type of items in the data array
 */
export type PaginatedResponseDTO<T> = {
  data: T[];
  pagination: PaginationDTO;
};

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Validation error detail
 * Used in ValidationErrorDTO
 */
export type ValidationErrorDetailDTO = {
  field: string;
  message: string;
};

/**
 * Error response structure
 * All API errors follow this consistent format
 */
export type ErrorResponseDTO = {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetailDTO[] | Record<string, unknown>;
  };
};

// ============================================================================
// API Response Wrapper Types
// ============================================================================

/**
 * Generic successful response wrapper for single resources
 * 
 * @template T - The type of the resource in the data field
 */
export type ApiResponseDTO<T> = {
  data: T;
};

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for listing flashcards
 * Used in GET /api/flashcards
 */
export type ListFlashcardsQueryParams = {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
};

/**
 * Query parameters for listing generations
 * Used in GET /api/generations
 */
export type ListGenerationsQueryParams = {
  page?: number;
  limit?: number;
};

/**
 * Query parameters for listing generation error logs
 * Used in GET /api/generation-error-logs
 */
export type ListGenerationErrorLogsQueryParams = {
  page?: number;
  limit?: number;
  user_id?: string;
  model?: string;
  from_date?: string;
  to_date?: string;
};

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a flashcard source is AI-generated
 */
export const isAiGeneratedSource = (
  source: FlashcardSource
): source is Extract<FlashcardSource, 'ai_generated' | 'ai_generated_edited'> => {
  return source === 'ai_generated' || source === 'ai_generated_edited';
};

/**
 * Type guard to check if a flashcard source is manual
 */
export const isManualSource = (
  source: FlashcardSource
): source is Extract<FlashcardSource, 'manual'> => {
  return source === 'manual';
};

