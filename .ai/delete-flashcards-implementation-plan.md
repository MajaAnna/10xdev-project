# API Endpoint Implementation Plan: DELETE /api/flashcards/:id

## 1. Endpoint Overview
This endpoint is responsible for the permanent deletion of a single flashcard from the database. It is a critical destructive action that must be protected to ensure a user can only delete flashcards they own.

## 2. Request Details
- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/flashcards/[id].ts` (Astro file-based routing)
- **Parameters**:
  - **Required**:
    - `id` (integer): The unique identifier of the flashcard to be deleted, passed as a URL path parameter.
  - **Optional**: None
- **Request Body**: None.

## 3. Utilized Types
- **Input Validation**: A `zod` schema will be used to validate the `id` parameter.
  - `z.coerce.number().int().positive()`
- **Success Response DTO**: `DeleteFlashcardResponseDto` from `src/types.ts`.
- **Error Response DTO**: `ErrorResponseDto` from `src/types.ts`.
- **Service Layer**:
  - `SupabaseClient` from `src/db/supabase.client.ts`.
  - Custom error types (`NotFoundError`, `UnauthorizedError`, `ValidationError`) from `src/lib/errors/common.errors.ts`.

## 4. Data Flow
1. A client sends a `DELETE` request to `/api/flashcards/{id}` with a valid JWT.
2. The Astro middleware (`src/middleware/index.ts`) validates the JWT, retrieves the user session, and attaches the `user` and `supabase` client instance to `context.locals`.
3. The `DELETE` handler in `src/pages/api/flashcards/[id].ts` is invoked.
4. The handler retrieves the `id` from `Astro.params`.
5. The `id` is validated using a Zod schema to ensure it is a positive integer. If validation fails, a `ValidationError` is thrown.
6. The handler retrieves the `user` object from `context.locals`. If the user is not present, an `UnauthorizedError` is thrown.
7. The handler calls a new service function: `flashcardService.deleteFlashcard(user.id, flashcardId, supabase)`.
8. The `deleteFlashcard` service function constructs and executes a Supabase query: `supabase.from('flashcards').delete().match({ id: flashcardId, user_id: userId })`.
9. The service function inspects the response from Supabase. If the `count` of deleted rows is 0, it means no flashcard was found for that `id` and `user_id`, so a `NotFoundError` is thrown.
10. If the deletion is successful (count is 1), the service function returns the `deleted_id`.
11. The API handler catches any thrown errors and formats an appropriate `ErrorResponseDto` with the corresponding status code.
12. If the service call is successful, the handler constructs the `ApiResponseDto<DeleteFlashcardResponseDto>` and sends a `200 OK` response.

## 5. Security Considerations
- **Authentication**: All requests to this endpoint must be authenticated. The existing middleware is expected to handle JWT validation. The endpoint logic must reject any request that does not have a valid user session attached to the context.
- **Authorization**: This is the most critical security aspect. The database query **must** include a `WHERE` clause matching both the `id` of the flashcard and the `user_id` of the authenticated user. This prevents a user from deleting another user's resources by guessing IDs.
- **Input Validation**: The `id` parameter will be strictly validated as a positive integer to prevent invalid query formats or potential injection vectors, even with the safety of the Supabase client.

## 6. Error Handling
The endpoint will return standardized error responses in the `ErrorResponseDto` format.
- **`400 Bad Request`**:
  - **Trigger**: The `id` parameter is not a valid positive integer.
  - **Error Code**: `VALIDATION_FAILED`
- **`401 Unauthorized`**:
  - **Trigger**: The request lacks a valid JWT token, or the session is expired.
  - **Error Code**: `UNAUTHORIZED`
- **`404 Not Found`**:
  - **Trigger**: No flashcard exists with the given `id`, or the flashcard exists but belongs to a different user.
  - **Error Code**: `FLASHCARD_NOT_FOUND`
- **`500 Internal Server Error`**:
  - **Trigger**: An unexpected failure occurs during the database operation.
  - **Error Code**: `INTERNAL_SERVER_ERROR`

## 7. Performance Considerations
- The `DELETE` operation targets a single record by its primary key (`id`), which is indexed (`flashcards_pkey`).
- The query will be highly performant, and no significant performance bottlenecks are anticipated. The operation should complete in milliseconds.

## 8. Implementation Steps
1.  **Create API Route File**:
    - Create the file `src/pages/api/flashcards/[id].ts`.
2.  **Implement DELETE Handler**:
    - Within the new file, export an async function named `DELETE` that accepts the `APIContext`.
3.  **Add Input Validation**:
    - Inside the `DELETE` handler, retrieve the `id` from `Astro.params`.
    - Define a Zod schema for a positive integer and use it to parse the `id`.
    - Implement a `try/catch` block to handle Zod validation errors, returning a 400 response if parsing fails.
4.  **Enforce Authentication**:
    - Retrieve the `user` from `context.locals`. If `user` is null, throw an `UnauthorizedError` to be caught and handled.
5.  **Create Service Function**:
    - Open `src/lib/services/flashcard.service.ts`.
    - Add a new async function: `deleteFlashcard(userId: string, flashcardId: number, supabase: SupabaseClient): Promise<number>`.
6.  **Implement Deletion Logic**:
    - In `deleteFlashcard`, execute `supabase.from('flashcards').delete().match({ id: flashcardId, user_id: userId })`.
    - Check the `error` and `count` properties of the response. If there's an `error`, throw it. If `count` is 0, throw a `NotFoundError` with the message "Flashcard not found."
    - On success, return the `flashcardId`.
7.  **Integrate Handler with Service**:
    - In the `[id].ts` handler, call the `deleteFlashcard` service function, passing the validated `id` and `user.id`.
    - Use a `try/catch` block to manage errors thrown from the service layer.
8.  **Format Responses**:
    - In the main `try` block, upon successful deletion, create the `DeleteFlashcardResponseDto` and return it inside an `ApiResponseDto` with a `200 OK` status.
    - In the `catch` block, inspect the error type (`NotFoundError`, `ValidationError`, etc.) and return the appropriate HTTP status code and `ErrorResponseDto`.

## 9. Manual Testing / cURL Examples

Below are `cURL` commands to manually test the `DELETE /api/flashcards/:id` endpoint for different scenarios. Replace `YOUR_BASE_URL`, `YOUR_JWT_TOKEN`, `VALID_FLASHCARD_ID`, and `INVALID_FLASHCARD_ID` with actual values before executing.

### 9.1. Successful Deletion (200 OK)

Deletes an existing flashcard that belongs to the authenticated user.

```bash
curl -X DELETE "http://localhost:4321/api/flashcards/1" \
     -H "Content-Type: application/json"
```

**Expected Response (200 OK):**
```json
{
  "data": {
    "message": "Flashcard deleted successfully.",
    "deleted_id": VALID_FLASHCARD_ID
  }
}
```

### 9.3. Invalid Flashcard ID (400 Bad Request)

Attempts to delete a flashcard with an `id` that is not a positive integer (e.g., "abc" or "0").

```bash
curl -X DELETE "http://localhost:4321/api/flashcards/abc" \
     -H "Content-Type: application/json"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid flashcard ID provided.",
    "details": [
      {
        "field": "id",
        "message": "Expected number, received nan"
      }
    ]
  }
}
```

### 9.4. Flashcard Not Found or Not Owned (404 Not Found)

Attempts to delete a flashcard that does not exist or exists but belongs to another user.

```bash
curl -X DELETE "http://localhost:4321/api/flashcards/INVALID_FLASHCARD_ID" \
     -H "Content-Type: application/json"
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found or you do not have permission to delete it."
  }
}
```
