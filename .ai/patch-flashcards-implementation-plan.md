# API Endpoint Implementation Plan: Update Flashcard

## 1. Endpoint Overview
This document describes the implementation plan for the `PATCH /api/flashcards/:id` endpoint. Its purpose is to allow users to update the content (`front` and/or `back`) of an existing flashcard. The endpoint will automatically update the `source` field if an AI-generated flashcard is modified, and ensure that users can only modify their own resources.

## 2. Request Details
- **HTTP Method:** `PATCH`
- **URL Structure:** `/api/flashcards/[id]`
- **Parameters:**
  - **URL (required):** `id` (integer) - Unique identifier of the flashcard.
  - **Body (optional):**
    - `front` (string, 1-200 characters) - Updated content for the front of the flashcard.
    - `back` (string, 1-500 characters) - Updated content for the back of the flashcard.
- **Request Body:**
  ```json
  {
    "front": "New question content?",
    "back": "New answer content."
  }
  ```
  *Note: At least one of the fields (`front` or `back`) must be present in the request body.*

## 3. Used Types

### `UpdateFlashcardSchema` (Zod)
Validation schema for the request body, to be defined in `@src/lib/schemas/flashcard.schemas.ts`.
```typescript
import { z } from 'zod';

export const UpdateFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front cannot be empty").max(200, "Front cannot exceed 200 characters").optional(),
  back: z.string().trim().min(1, "Back cannot be empty").max(500, "Back cannot exceed 500 characters").optional(),
}).refine(data => data.front !== undefined || data.back !== undefined, {
  message: "At least one field (front or back) must be provided",
  path: ["front", "back"], // Points to the fields related to the error
});

export type UpdateFlashcardDto = z.infer<typeof UpdateFlashcardSchema>;
```

### Database Types
- `Flashcard`: `Tables<'flashcards'>` from `@src/db/database.types.ts`
- `FlashcardSource`: `Enums<'flashcard_source'>` from `@src/db/database.types.ts`

## 4. Response Details
- **200 OK:** Returns the full, updated flashcard object.
  ```json
  {
    "data": {
      "id": 123,
      "user_id": "uuid-string",
      "generation_id": 45,
      "front": "New question content?",
      "back": "New answer content.",
      "source": "ai_generated_edited",
      "created_at": "2025-11-26T10:30:00Z",
      "updated_at": "2025-12-01T11:00:00Z"
    }
  }
  ```
- **400 Bad Request:** Validation error.
- **401 Unauthorized:** Missing authentication.
- **404 Not Found:** Flashcard not found.
- **500 Internal Server Error:** Internal server error.

## 5. Data Flow
1. A `PATCH` request arrives at the Astro endpoint `src/pages/api/flashcards.ts`.
2. Astro middleware verifies the JWT token and places user data in `context.locals`.
3. The `PATCH` handler extracts the `id` from URL parameters and the request body.
4. The request body is validated using `UpdateFlashcardSchema`. If validation fails, a 400 response is returned.
5. The handler calls the `flashcardService.updateFlashcard(id, user.id, validatedData)` method.
6. The `updateFlashcard` method in the service:
   a. Retrieves the original flashcard from the database using `id` and `user.id` to confirm its existence and ownership. If it does not exist, it throws a `NotFoundError`.
   b. Determines the new value for the `source` field according to business logic (e.g., `ai_generated` -> `ai_generated_edited`).
   c. Constructs an object with the data for the update.
   d. Uses the Supabase client to perform the `update` operation on the `flashcards` table.
   e. Returns the updated flashcard.
7. The `PATCH` handler receives the data from the service and sends a 200 OK response with the flashcard object.
8. In case of errors (e.g., `NotFoundError`), they are caught by the global error handler and mapped to appropriate HTTP status codes.

## 6. Security Considerations
- **Authentication:** The endpoint will be protected by middleware that checks the validity of the JWT token (`Authorization: Bearer <token>`). Unauthorized requests will be rejected with a 401 code.
- **Authorization:** The service logic must ensure that a user can only modify their own flashcards. Every database query must include a `where('user_id', '=', userId)` condition.
- **Data Validation:** Using Zod for request body validation prevents injection attacks and ensures data consistency by rejecting invalid formats and lengths.

## 7. Error Handling
Errors will be handled using custom error classes from `@src/lib/errors/common.errors.ts`, ensuring consistent API responses.
- **`ValidationError` (400):** Thrown when request body data fails Zod validation.
- **`UnauthorizedError` (401):** Thrown by middleware in case of a missing or invalid token.
- **`NotFoundError` (404):** Thrown by the service when the flashcard with the given `id` does not exist or does not belong to the user.
- **General Errors (500):** All other unexpected errors (e.g., database connection error) will result in a 500 response.

## 8. Performance Considerations
- The query to find a flashcard will use the primary key (`id`) and an index on `user_id` (`idx_flashcards_user_created`), ensuring high performance.
- The `UPDATE` operation on a single row is very fast.
- No performance issues are anticipated for this endpoint.

## 9. Implementation Steps
1. **Zod Schema Definition:**
   - In the `@src/lib/schemas/flashcard.schemas.ts` file, define and export `UpdateFlashcardSchema` and the `UpdateFlashcardDto` type according to section 3.

2. **Extend `FlashcardService`:**
   - In the `@src/lib/services/flashcard.service.ts` file, add a new `updateFlashcard` method:
     ```typescript
     async updateFlashcard(id: number, userId: string, data: UpdateFlashcardDto): Promise<Tables<'flashcards'>> {
       // 1. Retrieve the original flashcard, throw NotFoundError if it doesn't exist or doesn't belong to the user
       // 2. Prepare the `updatePayload` object with data from the DTO
       // 3. Apply the `source` change logic:
       //    - if current `source` is 'ai_generated', set the new one to 'ai_generated_edited'
       // 4. Execute the update in Supabase
       // 5. Return the updated row
     }
     ```

3. **API Handler Implementation:**
   - In the `@src/pages/api/flashcards.ts` file, add the `PATCH` export:
     ```typescript
     export const PATCH: APIRoute = async ({ params, request, locals }) => {
       // 1. Check if the user is logged in (UnauthorizedError)
       // 2. Get `id` from `params` and parse it to a number.
       // 3. Validate the request body using `UpdateFlashcardSchema` (ValidationError)
       // 4. Call `flashcardService.updateFlashcard`
       // 5. Return a 200 response with data or handle errors (NotFoundError, etc.)
     };
     ```

4. **Testing (manual and/or automated):**
   - Create unit tests for the `flashcard.service.ts` method, checking `source` change logic and error handling.
   - Perform manual tests of the endpoint using an API tool (e.g., Postman, cURL) to verify:
     - Correct data update.
     - Correct change of the `source` field.
     - Rejection of requests without at least one field (`front`/`back`).
     - Validation errors for overly long texts.
     - 404 response for a non-existent `id`.
     - 401 response for a request without a token.
     - Attempt to update a flashcard belonging to another user.