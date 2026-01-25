/**
 * Service layer for flashcard operations
 *
 * This service handles all business logic for flashcard CRUD operations,
 * including validation, database interactions, and generation statistics updates.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardEntity, FlashcardSource, CreateFlashcardCommand } from "../../types";
import { GenerationNotFoundError, FlashcardCreationError, NotFoundError } from "../errors/flashcard.errors";

/**
 * Validates that a generation exists and belongs to the specified user
 *
 * @param supabase - Supabase client instance
 * @param generation_id - ID of the generation to validate
 * @param user_id - ID of the user who should own the generation
 * @throws {GenerationNotFoundError} If generation doesn't exist or belongs to different user
 */
async function validateGenerationOwnership(
  supabase: SupabaseClient,
  generation_id: number,
  user_id: string
): Promise<void> {
  const { data, error } = await supabase
    .from("generations")
    .select("id")
    .eq("id", generation_id)
    .eq("user_id", user_id)
    .single();

  if (error || !data) {
    throw new GenerationNotFoundError();
  }
}

/**
 * Inserts a flashcard into the database
 *
 * @param supabase - Supabase client instance
 * @param data - Flashcard data to insert
 * @returns The created flashcard entity
 * @throws {FlashcardCreationError} If database insert fails
 */
async function insertFlashcard(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    generation_id: number | null;
    front: string;
    back: string;
    source: FlashcardSource;
  }
): Promise<FlashcardEntity> {
  const { data: flashcard, error } = await supabase.from("flashcards").insert(data).select().single();

  if (error || !flashcard) {
    throw new FlashcardCreationError("Failed to insert flashcard", error);
  }

  return flashcard as FlashcardEntity;
}

/**
 * Updates generation statistics after flashcard acceptance
 *
 * Increments either accepted_unedited_count or accepted_edited_count
 * based on the flashcard source.
 *
 * @param supabase - Supabase client instance
 * @param generation_id - ID of the generation to update
 * @param source - Source of the flashcard (determines which counter to increment)
 * @throws {FlashcardCreationError} If database update fails
 */
async function updateGenerationCounts(
  supabase: SupabaseClient,
  generation_id: number,
  source: FlashcardSource
): Promise<void> {
  // Determine which field to increment based on source
  const field = source === "ai_generated" ? "accepted_unedited_count" : "accepted_edited_count";

  // Fetch both count fields to avoid TypeScript indexing issues
  const { data: generation, error: fetchError } = await supabase
    .from("generations")
    .select("accepted_unedited_count, accepted_edited_count")
    .eq("id", generation_id)
    .single();

  if (fetchError || !generation) {
    throw new FlashcardCreationError("Failed to fetch generation for count update", fetchError);
  }

  // Increment the appropriate counter
  const currentCount = generation[field] ?? 0;
  const newCount = currentCount + 1;

  const { error: updateError } = await supabase
    .from("generations")
    .update({ [field]: newCount })
    .eq("id", generation_id);

  if (updateError) {
    throw new FlashcardCreationError("Failed to update generation counts", updateError);
  }
}

/**
 * Creates a new flashcard with full business logic orchestration
 *
 * This is the main service function that:
 * 1. Validates generation ownership (for AI-generated flashcards)
 * 2. Inserts the flashcard into the database
 * 3. Updates generation statistics (for AI-generated flashcards)
 * 4. Handles rollback if generation update fails
 *
 * @param supabase - Supabase client instance
 * @param params - Flashcard creation parameters including user_id
 * @returns The created flashcard entity
 * @throws {GenerationNotFoundError} If generation_id is invalid or unauthorized
 * @throws {FlashcardCreationError} If database operations fail
 *
 * @example
 * // Create manual flashcard
 * const flashcard = await createFlashcard(supabase, {
 *   user_id: "uuid",
 *   front: "What is TypeScript?",
 *   back: "A typed superset of JavaScript",
 *   source: "manual",
 *   generation_id: null
 * });
 *
 * @example
 * // Create AI-generated flashcard
 * const flashcard = await createFlashcard(supabase, {
 *   user_id: "uuid",
 *   front: "What is React?",
 *   back: "A JavaScript library for building user interfaces",
 *   source: "ai_generated",
 *   generation_id: 42
 * });
 */
export async function createFlashcard(
  supabase: SupabaseClient,
  params: CreateFlashcardCommand & { user_id: string }
): Promise<FlashcardEntity> {
  const { user_id, front, back, source, generation_id } = params;

  // Step 1: Validate generation ownership (if AI-generated)
  if (generation_id !== null) {
    await validateGenerationOwnership(supabase, generation_id, user_id);
  }

  // Step 2: Insert flashcard into database
  const flashcard = await insertFlashcard(supabase, {
    user_id,
    generation_id,
    front,
    back,
    source,
  });

  // Step 3: Update generation counts (if AI-generated)
  // Rollback flashcard if generation update fails to maintain data consistency
  if (generation_id !== null) {
    try {
      await updateGenerationCounts(supabase, generation_id, source);
    } catch (error) {
      // Rollback: Delete the flashcard we just created
      await supabase.from("flashcards").delete().eq("id", flashcard.id);
      throw error;
    }
  }

  return flashcard;
}

/**
 * Lists flashcards for a user with pagination
 *
 * Retrieves flashcards ordered by creation date (newest first) with pagination support.
 * Uses efficient database indexing for fast lookups.
 *
 * @param supabase - Supabase client instance
 * @param params - List parameters including user_id, page, and limit
 * @returns Object containing flashcards array and total count
 * @throws {Error} If database query fails
 *
 * @example
 * // Get first page of flashcards (20 items)
 * const result = await listFlashcards(supabase, {
 *   user_id: "uuid",
 *   page: 1,
 *   limit: 20
 * });
 * // result.flashcards: FlashcardEntity[]
 * // result.totalCount: number
 *
 * @example
 * // Get second page with 50 items
 * const result = await listFlashcards(supabase, {
 *   user_id: "uuid",
 *   page: 2,
 *   limit: 50
 * });
 */
export async function listFlashcards(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    page: number;
    limit: number;
  }
): Promise<{
  flashcards: FlashcardEntity[];
  totalCount: number;
}> {
  const { user_id, page, limit } = params;

  // Calculate offset for pagination
  // Page 1 → offset 0 (items 1-20)
  // Page 2 → offset 20 (items 21-40)
  // Page 3 → offset 40 (items 41-60)
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Query flashcards with count
  // - select('*', { count: 'exact' }): Get all fields + total count
  // - eq('user_id', user_id): Filter by user (security)
  // - order('created_at', { ascending: false }): Newest first
  // - range(from, to): Pagination slice (inclusive range)
  //
  // Note: Supabase may return a malformed error when requesting a range completely
  // beyond available data. This is acceptable - we'll return empty results.
  const result = await supabase
    .from("flashcards")
    .select("*", { count: "exact" })
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  // Handle database errors
  // Note: We encountered an issue where Supabase returns a malformed error when
  // requesting a range beyond available data (e.g., { message: '{"' }).
  // We've added a workaround to handle this gracefully by treating it as empty results.
  // All other legitimate errors are thrown normally.
  if (result.error) {
    const isMalformedRangeError = result.error.message === '{"' || result.error.message === "{";

    if (!isMalformedRangeError) {
      console.error("Database error in listFlashcards:", result.error);
      throw new Error(`Failed to fetch flashcards: ${result.error.message}`);
    }

    // For malformed range errors, we'll return empty results below
    // This is acceptable behavior - requesting page 10 when there's only 1 page
    // should return empty results, not an error
  }

  // Return flashcards and total count
  // Note: data can be empty array if user has no flashcards (valid scenario)
  // When requesting a page beyond available data, Supabase returns empty array (not an error)
  return {
    flashcards: (result.data as FlashcardEntity[]) || [],
    totalCount: result.count || 0,
  };
}

/**
 * Updates an existing flashcard
 *
 * This function handles the business logic for the PATCH /api/flashcards/:id endpoint.
 * It finds the flashcard by id and user_id, determines the new `source` value if the
 * original was `ai_generated`, and then updates the record in the database.
 *
 * @param supabase - Supabase client instance
 * @param id - The ID of the flashcard to update
 * @param userId - The ID of the user requesting the update
 * @param data - The update payload (front and/or back)
 * @returns The updated flashcard entity
 * @throws {NotFoundError} If the flashcard is not found or does not belong to the user
 *
 * @example
 * const updatedFlashcard = await updateFlashcard(supabase, 123, 'user-uuid', {
 *   front: "New front content"
 * });
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  id: number,
  userId: string,
  data: { front?: string; back?: string }
): Promise<FlashcardEntity> {
  // First, retrieve the existing flashcard to check ownership and current source
  const { data: existingFlashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select("source")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingFlashcard) {
    throw new NotFoundError("Flashcard not found or you do not have permission to edit it.", "flashcard");
  }

  const updatePayload: { front?: string; back?: string; source?: FlashcardSource } = { ...data };

  // Business logic: if the source is 'ai_generated', change it to 'ai_generated_edited'
  if (existingFlashcard.source === "ai_generated") {
    updatePayload.source = "ai_generated_edited";
  }

  // Perform the update
  const { data: updatedFlashcard, error: updateError } = await supabase
    .from("flashcards")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updatedFlashcard) {
    // This could happen in a race condition or if the DB is unavailable
    throw new FlashcardCreationError("Failed to update flashcard", updateError);
  }

  return updatedFlashcard as FlashcardEntity;
}

/**
 * Deletes a flashcard for a specific user.
 *
 * This function performs a delete operation on the 'flashcards' table.
 * It ensures that the flashcard exists and belongs to the specified user
 * before deletion.
 *
 * @param supabase - The Supabase client instance.
 * @param flashcardId - The ID of the flashcard to delete.
 * @param userId - The ID of the user requesting the deletion.
 * @returns The ID of the deleted flashcard.
 * @throws {NotFoundError} If no flashcard is found with the given ID and user ID.
 * @throws {Error} If the database operation fails for other reasons.
 */
export async function deleteFlashcard(supabase: SupabaseClient, flashcardId: number, userId: string): Promise<number> {
  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .match({ id: flashcardId, user_id: userId });

  if (error) {
    console.error("Database error in deleteFlashcard:", error);
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  if (count === 0) {
    throw new NotFoundError("Flashcard not found or you do not have permission to delete it.", "flashcard");
  }

  return flashcardId;
}

/**
 * Counts the total number of flashcards for a given user.
 *
 * @param supabase - The Supabase client instance.
 * @param userId - The ID of the user whose flashcards are to be counted.
 * @returns The total number of flashcards for the user.
 * @throws {Error} If the underlying `listFlashcards` operation fails.
 */
export async function countFlashcardsForUser(supabase: SupabaseClient, userId: string): Promise<number> {
  const { totalCount } = await listFlashcards(supabase, {
    user_id: userId,
    page: 1, // We only need the total count, so page and limit don't matter much
    limit: 1, // Smallest limit to minimize data transfer if only count is needed
  });
  return totalCount;
}
