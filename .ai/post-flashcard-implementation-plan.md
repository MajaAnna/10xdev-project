# API Endpoint Implementation Plan: POST /api/flashcards

> **Note**: This implementation plan uses a **shared error architecture** where common HTTP errors (ValidationError, UnauthorizedError, NotFoundError, RateLimitError) are defined in `src/lib/errors/common.errors.ts` and reused across all endpoints. Endpoint-specific errors are defined in their respective error files (e.g., `flashcard.errors.ts`).

## 1. Endpoint Overview

**Purpose**: Creates a single flashcard, either manually created by the user or accepted from an AI generation session.

**Key Responsibilities**:

- Validate flashcard input data (front, back, source, generation_id)
- Enforce business rules for source/generation_id relationship
- Verify generation_id ownership and existence (for AI-generated flashcards)
- Create flashcard record in database
- Update generation statistics (accepted_unedited_count or accepted_edited_count)
- Return created flashcard with appropriate HTTP status

**Business Context**:

- Supports both manual flashcard creation (US-006) and AI generation acceptance (US-004)
- Tracks AI adoption metrics by recording flashcard source
- Links AI-generated flashcards to their generation session for analytics

---

## 2. Request Details

### HTTP Method

`POST`

### URL Structure

```
POST /api/flashcards
```

### Request Headers

```
Content-Type: application/json
```

**Note**: In production, will require `Authorization: Bearer <jwt_token>` header.

### Request Parameters

**Body Parameters** (all required):

| Parameter       | Type           | Constraints                                             | Description                         |
| --------------- | -------------- | ------------------------------------------------------- | ----------------------------------- |
| `front`         | string         | 1-200 chars, non-empty after trim                       | Question/term side of flashcard     |
| `back`          | string         | 1-500 chars, non-empty after trim                       | Answer/definition side of flashcard |
| `source`        | enum           | One of: `manual`, `ai_generated`, `ai_generated_edited` | Origin of the flashcard             |
| `generation_id` | number \| null | Conditionally required                                  | Link to generation session          |

**Business Rules for generation_id**:

- If `source = 'manual'`: `generation_id` MUST be `null`
- If `source = 'ai_generated'` or `'ai_generated_edited'`: `generation_id` MUST be a valid number

### Request Body Examples

**Manual Flashcard**:

```json
{
  "front": "What is photosynthesis?",
  "back": "The process by which plants convert light energy into chemical energy",
  "source": "manual",
  "generation_id": null
}
```

**AI-Generated Flashcard (Unedited)**:

```json
{
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "ai_generated",
  "generation_id": 42
}
```

**AI-Generated Flashcard (Edited)**:

```json
{
  "front": "What is the capital of France?",
  "back": "Paris, the largest city in France and its political center",
  "source": "ai_generated_edited",
  "generation_id": 42
}
```

---

## 3. Types Used

### Command Models

- **CreateFlashcardCommand** (`src/types.ts`): Input validation model
  ```typescript
  interface CreateFlashcardCommand {
    front: string;
    back: string;
    source: FlashcardSource;
    generation_id: number | null;
  }
  ```

### Response DTOs

- **FlashcardDto** (`src/types.ts`): Flashcard response (excludes user_id)

  ```typescript
  type FlashcardDto = Omit<FlashcardEntity, "user_id">;
  ```

- **ApiResponseDto<FlashcardDto>** (`src/types.ts`): Success response wrapper

  ```typescript
  interface ApiResponseDto<T> {
    data: T;
  }
  ```

- **ErrorResponseDto** (`src/types.ts`): Error response structure

  ```typescript
  interface ErrorResponseDto {
    error: {
      code: string;
      message: string;
      details?: ValidationErrorDetailDto[] | Record<string, unknown>;
    };
  }
  ```

- **ValidationErrorDetailDto** (`src/types.ts`): Validation error details
  ```typescript
  interface ValidationErrorDetailDto {
    field: string;
    message: string;
  }
  ```

### Entity Types

- **FlashcardEntity** (`src/types.ts`): Complete database entity
- **FlashcardSource** (`src/types.ts`): Enum for flashcard source
- **GenerationEntity** (`src/types.ts`): Generation database entity

### Database Types

- **SupabaseClient** (`src/db/supabase.client.ts`): Typed Supabase client
- **Database** (`src/db/database.types.ts`): Generated database types

---

## 4. Response Details

### Success Response (201 Created)

**Status Code**: `201 Created`

**Headers**:

```
Content-Type: application/json
```

**Body Structure**:

```json
{
  "data": {
    "id": 124,
    "generation_id": null,
    "front": "What is photosynthesis?",
    "back": "The process by which plants convert light energy into chemical energy",
    "source": "manual",
    "created_at": "2025-11-26T10:35:00Z",
    "updated_at": "2025-11-26T10:35:00Z"
  }
}
```

**Note**: `user_id` is excluded from response (implicit - users only see their own data).

### Error Responses

#### 400 Bad Request - Validation Error

**Scenario**: Invalid input data

**Response Body**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front must be between 1 and 200 characters"
      },
      {
        "field": "generation_id",
        "message": "generation_id is required for AI-generated flashcards"
      }
    ]
  }
}
```

**Common Validation Errors**:

- `front` or `back` missing
- `front` exceeds 200 characters
- `back` exceeds 500 characters
- `front` or `back` is empty or whitespace-only after trimming
- Invalid `source` enum value
- `generation_id` is null when source is `ai_generated` or `ai_generated_edited`
- `generation_id` is not null when source is `manual`
- Invalid JSON format

#### 400 Bad Request - Invalid JSON

**Scenario**: Request body is not valid JSON

**Response Body**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body format",
    "details": {
      "parse_error": "Expected JSON object"
    }
  }
}
```

#### 404 Not Found - Generation Not Found

**Scenario**: `generation_id` doesn't exist or doesn't belong to the user

**Response Body**:

```json
{
  "error": {
    "code": "GENERATION_NOT_FOUND",
    "message": "Generation session not found"
  }
}
```

#### 500 Internal Server Error

**Scenario**: Unexpected database or server error

**Response Body**:

```json
{
  "error": {
    "code": "FLASHCARD_CREATION_FAILED",
    "message": "An unexpected error occurred while creating the flashcard. Please try again later."
  }
}
```

---

## 5. Data Flow

### High-Level Flow

```
1. Client Request
   ↓
2. API Endpoint (POST /api/flashcards)
   ↓
3. Parse & Validate JSON Body
   ↓
4. Validate with Zod Schema
   ↓
5. Service Layer (createFlashcard)
   ├─→ Validate generation_id (if AI-generated or AI generated edited)
   ├─→ Insert flashcard into database
   └─→ Update generation counts (if AI-generated)
   ↓
6. Return Response (201 Created)
```

### Detailed Flow

#### Step 1: Request Parsing

- Extract request body from `request.json()`
- Handle JSON parse errors → 400 Bad Request

#### Step 2: Input Validation (Zod)

- Validate request body against `createFlashcardSchema`
- Check field types, lengths, and required fields
- Validate source/generation_id business rules
- Collect all validation errors → 400 Bad Request

#### Step 3: User Identification

- In dev mode: Use `DEFAULT_USER_ID` constant
- In production: Extract from `locals.supabase.auth.getUser()`

#### Step 4: Service Layer - Generation Validation (if applicable)

- **If source is AI-generated**:
  - Query `generations` table for `generation_id`
  - Verify generation exists
  - Verify generation belongs to current user
  - If not found or unauthorized → 404 Not Found

#### Step 5: Service Layer - Flashcard Creation

- Insert flashcard into `flashcards` table with:
  - `user_id`: Current user ID
  - `generation_id`: From request (or null)
  - `front`: Trimmed front text
  - `back`: Trimmed back text
  - `source`: From request
  - `created_at`: Auto-generated by database
  - `updated_at`: Auto-generated by database

#### Step 6: Service Layer - Update Generation Statistics (if applicable)

- **If source = 'ai_generated'**:
  - Increment `accepted_unedited_count` in `generations` table
- **If source = 'ai_generated_edited'**:
  - Increment `accepted_edited_count` in `generations` table
- **If source = 'manual'**:
  - No generation update needed

#### Step 7: Response Construction

- Map database entity to FlashcardDto (exclude user_id)
- Wrap in ApiResponseDto structure
- Return with 201 Created status

### Database Interactions

**Tables Accessed**:

1. `flashcards` (INSERT)
2. `generations` (SELECT, UPDATE - conditional)

**Transaction Considerations**:

- Flashcard creation and generation update should be atomic
- Use Supabase transaction or handle rollback on partial failure
- If generation update fails, flashcard should not be created

---

## 6. Security Considerations

### Authentication & Authorization

**Development Mode**:

- Use `DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"`
- No authentication checks required
- All flashcards belong to default user

**Production Mode** (Future):

- Require `Authorization: Bearer <jwt_token>` header
- Extract user from `locals.supabase.auth.getUser()`
- Return 401 Unauthorized if token is missing or invalid
- Verify generation_id belongs to authenticated user

### Input Validation & Sanitization

**String Sanitization**:

- Trim all string inputs (`front`, `back`) to remove leading/trailing whitespace
- Validate non-empty after trimming
- Enforce character limits (front: 200, back: 500)

**Enum Validation**:

- Validate `source` against FlashcardSource enum
- Reject invalid enum values

**Type Safety**:

- Use Zod for runtime type validation
- Use TypeScript for compile-time type safety

### Business Logic Security

**Generation Ownership Validation**:

- When `generation_id` is provided, verify it exists in database
- Verify generation belongs to current user (prevent cross-user references)
- Return 404 if generation not found or unauthorized

**Source/Generation_ID Relationship**:

- Enforce rule: manual flashcards cannot have generation_id
- Enforce rule: AI-generated flashcards must have valid generation_id
- Prevent data inconsistencies

### Database Security

**SQL Injection Prevention**:

- Use Supabase parameterized queries (built-in protection)
- Never concatenate user input into SQL strings

**Row Level Security (RLS)**:

- RLS policies ensure users can only access their own data
- Even if validation is bypassed, RLS provides defense-in-depth

### Error Handling Security

**Information Disclosure**:

- Don't expose internal error details to client
- Log detailed errors server-side only
- Return generic error messages for unexpected errors

**Error Logging**:

- Log all errors with context (user_id, request data)
- Don't log sensitive data (passwords, tokens)

---

## 7. Error Handling

### Error Architecture

This endpoint uses a **shared error architecture** with common errors in `src/lib/errors/common.errors.ts` and endpoint-specific errors in `src/lib/errors/flashcard.errors.ts`.

**Shared Errors** (used across all endpoints):

- `ValidationError` - Input validation failures (400)
- `UnauthorizedError` - Authentication failures (401)
- `NotFoundError` - Generic resource not found (404)
- `RateLimitError` - Rate limit exceeded (429)

**Flashcard-Specific Errors**:

- `GenerationNotFoundError` - Generation session not found (404)
- `FlashcardCreationError` - Database operation failures (500)
- `FlashcardNotFoundError` - Flashcard not found (404, future use)

### Error Categories

#### 1. Validation Errors (400 Bad Request)

**Custom Error Class**: `ValidationError` (from `common.errors.ts`, re-exported by `flashcard.errors.ts`)

**Scenarios**:

- Missing required fields
- Field length violations
- Empty or whitespace-only content
- Invalid enum values
- Business rule violations (source/generation_id mismatch)

**Handling**:

```typescript
catch (error) {
  if (error instanceof ZodError) {
    // Transform Zod errors to ValidationErrorDetailDto[]
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return 400 with VALIDATION_ERROR
  }
}
```

#### 2. Resource Not Found Errors (404 Not Found)

**Custom Error Class**: `GenerationNotFoundError` (flashcard-specific, from `flashcard.errors.ts`)

**Scenarios**:

- generation_id doesn't exist in database
- generation_id exists but belongs to different user

**Handling**:

```typescript
catch (error) {
  if (error instanceof GenerationNotFoundError) {
    return 404 with GENERATION_NOT_FOUND
  }
}
```

#### 3. Database Errors (500 Internal Server Error)

**Custom Error Class**: `FlashcardCreationError` (flashcard-specific, from `flashcard.errors.ts`)

**Scenarios**:

- Database connection failure
- Insert operation failure
- Update operation failure
- Transaction rollback

**Handling**:

```typescript
catch (error) {
  if (error instanceof FlashcardCreationError) {
    console.error('Database error:', error);
    return 500 with FLASHCARD_CREATION_FAILED
  }
}
```

#### 4. Unexpected Errors (500 Internal Server Error)

**Scenarios**:

- Unhandled exceptions
- Runtime errors
- Type coercion failures

**Handling**:

```typescript
catch (error) {
  console.error('Unexpected error in POST /api/flashcards:', error);
  return 500 with FLASHCARD_CREATION_FAILED
}
```

### Error Response Format

All errors follow consistent ErrorResponseDto structure:

```typescript
{
  error: {
    code: string,           // Machine-readable error code
    message: string,        // Human-readable error message
    details?: Array | Object // Optional additional details
  }
}
```

### Error Codes

| Code                        | HTTP Status | Description                                  |
| --------------------------- | ----------- | -------------------------------------------- |
| `VALIDATION_ERROR`          | 400         | Input validation failed                      |
| `GENERATION_NOT_FOUND`      | 404         | Generation session not found or unauthorized |
| `FLASHCARD_CREATION_FAILED` | 500         | Database or unexpected error                 |

---

## 8. Performance Considerations

### Database Optimization

**Indexes Used**:

- `flashcards_pkey` on `flashcards(id)` - Primary key lookup
- `idx_flashcards_user_created` on `flashcards(user_id, created_at DESC)` - User flashcard queries
- `idx_flashcards_generation` on `flashcards(generation_id)` - Generation relationship queries
- `generations_pkey` on `generations(id)` - Generation validation lookup

**Query Optimization**:

- Use `.single()` for generation validation (expects one result)
- Use `.select('id')` when only checking existence
- Minimize data transfer by selecting only needed columns

### Transaction Management

**Atomic Operations**:

- Flashcard insert and generation update must be atomic
- Use Supabase RPC function or handle manually:

  ```typescript
  // Option 1: Sequential with error handling
  const flashcard = await insertFlashcard();
  try {
    await updateGeneration();
  } catch (error) {
    await deleteFlashcard(flashcard.id); // Rollback
    throw error;
  }

  // Option 2: Use Supabase RPC function (preferred)
  await supabase.rpc("create_flashcard_with_generation_update", {
    user_id,
    front,
    back,
    source,
    generation_id,
  });
  ```

### Response Time Targets

- **Target**: < 200ms for typical request
- **Breakdown**:
  - JSON parsing: < 5ms
  - Zod validation: < 10ms
  - Generation validation (if needed): < 50ms
  - Flashcard insert: < 50ms
  - Generation update (if needed): < 50ms
  - Response serialization: < 5ms

### Scalability Considerations

**Potential Bottlenecks**:

1. Database connection pool exhaustion
2. Generation validation query for every AI flashcard
3. Sequential database operations (insert + update)

**Mitigation Strategies**:

1. Use connection pooling (Supabase handles this)
2. Cache generation validation results (if creating multiple flashcards)
3. Use database RPC function for atomic operations
4. Consider batch endpoint for multiple flashcards (POST /api/flashcards/bulk)

### Caching Opportunities

**Not Applicable for POST Operations**:

- POST endpoints create new resources (non-idempotent)
- No caching should be applied to POST requests
- Response caching not applicable (always returns new data)

---

## 9. Implementation Steps

### Step 1: Error Classes (Already Created)

The error architecture has been implemented with a shared error pattern:

**Files Created**:

1. ✅ `src/lib/errors/common.errors.ts` - Shared errors across all endpoints
   - `ValidationError` - Input validation failures (400)
   - `UnauthorizedError` - Authentication failures (401)
   - `NotFoundError` - Generic resource not found (404)
   - `RateLimitError` - Rate limit exceeded (429)

2. ✅ `src/lib/errors/flashcard.errors.ts` - Flashcard-specific errors
   - Re-exports common errors for convenience
   - `GenerationNotFoundError` - Generation session not found (404)
   - `FlashcardCreationError` - Database operation failures (500)
   - `FlashcardNotFoundError` - Flashcard not found (404, future use)

3. ✅ `src/lib/errors/generation.errors.ts` - Refactored to use common errors
   - Re-exports common errors (ValidationError, UnauthorizedError, RateLimitError)
   - `ServiceUnavailableError` - AI service unavailable (503)
   - `GenerationFailedError` - AI generation failures (500)

**Usage in Flashcard Endpoint**:

```typescript
// Import from flashcard.errors.ts (which re-exports common errors)
import {
  ValidationError, // Common error (re-exported)
  GenerationNotFoundError, // Flashcard-specific
  FlashcardCreationError, // Flashcard-specific
} from "../../lib/errors/flashcard.errors";
```

**Benefits of This Architecture**:

- ✅ No code duplication across endpoints
- ✅ Consistent error handling across the application
- ✅ Easy to add new endpoints (reuse common errors)
- ✅ Clear separation: common vs endpoint-specific errors
- ✅ Convenient re-exports for each endpoint

---

### Step 2: Create Zod Validation Schema

**File**: `src/lib/schemas/flashcard.schemas.ts`

**Tasks**:

1. Import Zod and FlashcardSource type
2. Create `createFlashcardSchema` with:
   - `front`: string, min 1, max 200, trim, refine non-empty after trim
   - `back`: string, min 1, max 500, trim, refine non-empty after trim
   - `source`: enum matching FlashcardSource values
   - `generation_id`: number or null
3. Add custom validation using `.refine()`:
   - If source is 'manual', generation_id must be null
   - If source is 'ai_generated' or 'ai_generated_edited', generation_id must be number
4. Export schema and inferred type

**Example**:

```typescript
export const createFlashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front is required")
      .max(200, "Front must not exceed 200 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, {
        message: "Front must contain at least 1 non-whitespace character",
      }),
    back: z
      .string()
      .min(1, "Back is required")
      .max(500, "Back must not exceed 500 characters")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, {
        message: "Back must contain at least 1 non-whitespace character",
      }),
    source: z.enum(["manual", "ai_generated", "ai_generated_edited"]),
    generation_id: z.number().int().positive().nullable(),
  })
  .refine(
    (data) => {
      if (data.source === "manual") {
        return data.generation_id === null;
      }
      return data.generation_id !== null;
    },
    {
      message: "generation_id must be null for manual flashcards and required for AI-generated flashcards",
      path: ["generation_id"],
    }
  );
```

---

### Step 3: Create Service Layer

**File**: `src/lib/services/flashcard.service.ts`

**Tasks**:

#### 3.1. Create Helper Function: validateGenerationOwnership()

- **Purpose**: Verify generation exists and belongs to user
- **Parameters**: supabase, generation_id, user_id
- **Returns**: Promise<void>
- **Throws**: GenerationNotFoundError if not found or unauthorized
- **Implementation**:

  ```typescript
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
  ```

#### 3.2. Create Helper Function: insertFlashcard()

- **Purpose**: Insert flashcard into database
- **Parameters**: supabase, flashcard data
- **Returns**: Promise<FlashcardEntity>
- **Throws**: FlashcardCreationError on database error
- **Implementation**:

  ```typescript
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

    return flashcard;
  }
  ```

#### 3.3. Create Helper Function: updateGenerationCounts()

- **Purpose**: Increment accepted counts in generation record
- **Parameters**: supabase, generation_id, source
- **Returns**: Promise<void>
- **Throws**: FlashcardCreationError on database error
- **Implementation**:

  ```typescript
  async function updateGenerationCounts(
    supabase: SupabaseClient,
    generation_id: number,
    source: FlashcardSource
  ): Promise<void> {
    const field = source === "ai_generated" ? "accepted_unedited_count" : "accepted_edited_count";

    const { error } = await supabase.rpc("increment", {
      table_name: "generations",
      row_id: generation_id,
      column_name: field,
    });

    // Alternative if RPC not available:
    // const { data: gen } = await supabase
    //   .from('generations')
    //   .select(field)
    //   .eq('id', generation_id)
    //   .single();
    //
    // await supabase
    //   .from('generations')
    //   .update({ [field]: gen[field] + 1 })
    //   .eq('id', generation_id);

    if (error) {
      throw new FlashcardCreationError("Failed to update generation counts", error);
    }
  }
  ```

#### 3.4. Create Main Service Function: createFlashcard()

- **Purpose**: Orchestrate flashcard creation with all business logic
- **Parameters**: supabase, CreateFlashcardCommand, user_id
- **Returns**: Promise<FlashcardEntity>
- **Throws**: GenerationNotFoundError, FlashcardCreationError
- **Implementation Flow**:
  1. If AI-generated: Validate generation ownership
  2. Insert flashcard into database
  3. If AI-generated: Update generation counts
  4. Return created flashcard
- **Error Handling**: Rollback flashcard if generation update fails

**Example**:

```typescript
export async function createFlashcard(
  supabase: SupabaseClient,
  params: CreateFlashcardCommand & { user_id: string }
): Promise<FlashcardEntity> {
  const { user_id, front, back, source, generation_id } = params;

  // Step 1: Validate generation ownership (if AI-generated)
  if (generation_id !== null) {
    await validateGenerationOwnership(supabase, generation_id, user_id);
  }

  // Step 2: Insert flashcard
  const flashcard = await insertFlashcard(supabase, {
    user_id,
    generation_id,
    front,
    back,
    source,
  });

  // Step 3: Update generation counts (if AI-generated)
  if (generation_id !== null) {
    try {
      await updateGenerationCounts(supabase, generation_id, source);
    } catch (error) {
      // Rollback: Delete flashcard if generation update fails
      await supabase.from("flashcards").delete().eq("id", flashcard.id);
      throw error;
    }
  }

  return flashcard;
}
```

---

### Step 4: Create API Endpoint

**File**: `src/pages/api/flashcards.ts`

**Tasks**:

#### 4.1. Setup and Imports

```typescript
import type { APIRoute } from "astro";
import type { CreateFlashcardCommand, FlashcardDto, ApiResponseDto, ErrorResponseDto } from "../../types";
import { createFlashcardSchema } from "../../lib/schemas/flashcard.schemas";
import { createFlashcard } from "../../lib/services/flashcard.service";
import { GenerationNotFoundError, FlashcardCreationError } from "../../lib/errors/flashcard.errors";
import { ZodError } from "zod";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;
```

#### 4.2. Implement POST Handler

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user ID (dev mode uses default)
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body format",
            details: { parse_error: "Expected JSON object" },
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Validate with Zod
    let validatedData: CreateFlashcardCommand;
    try {
      validatedData = createFlashcardSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
              })),
            },
          } satisfies ErrorResponseDto),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // Step 4: Create flashcard via service
    const flashcard = await createFlashcard(locals.supabase, {
      ...validatedData,
      user_id: userId,
    });

    // Step 5: Map to DTO (exclude user_id)
    const flashcardDto: FlashcardDto = {
      id: flashcard.id,
      generation_id: flashcard.generation_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    };

    // Step 6: Return success response
    return new Response(JSON.stringify({ data: flashcardDto } satisfies ApiResponseDto<FlashcardDto>), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle generation not found
    if (error instanceof GenerationNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_NOT_FOUND",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle flashcard creation errors
    if (error instanceof FlashcardCreationError) {
      console.error("Flashcard creation error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "FLASHCARD_CREATION_FAILED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/flashcards:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "FLASHCARD_CREATION_FAILED",
          message: "An unexpected error occurred while creating the flashcard. Please try again later.",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

---

### Step 5: Testing Strategy

#### 5.1. Unit Tests (Service Layer)

**Test File**: `src/lib/services/flashcard.service.test.ts`

**Test Cases**:

1. **createFlashcard - Manual Flashcard**
   - Should create flashcard with null generation_id
   - Should not call validateGenerationOwnership
   - Should not call updateGenerationCounts
   - Should return FlashcardEntity with all fields

2. **createFlashcard - AI-Generated Unedited**
   - Should validate generation ownership
   - Should create flashcard with generation_id
   - Should increment accepted_unedited_count
   - Should return FlashcardEntity

3. **createFlashcard - AI-Generated Edited**
   - Should validate generation ownership
   - Should create flashcard with generation_id
   - Should increment accepted_edited_count
   - Should return FlashcardEntity

4. **createFlashcard - Generation Not Found**
   - Should throw GenerationNotFoundError
   - Should not create flashcard

5. **createFlashcard - Generation Belongs to Different User**
   - Should throw GenerationNotFoundError
   - Should not create flashcard

6. **createFlashcard - Database Insert Failure**
   - Should throw FlashcardCreationError
   - Should not update generation counts

7. **createFlashcard - Generation Update Failure**
   - Should rollback flashcard creation
   - Should throw FlashcardCreationError

#### 5.2. Integration Tests (API Endpoint)

**Test File**: `src/pages/api/flashcards.test.ts`

**Test Cases**:

1. **POST - Valid Manual Flashcard**
   - Should return 201 Created
   - Should return flashcard with id and timestamps
   - Should exclude user_id from response

2. **POST - Valid AI-Generated Flashcard**
   - Should return 201 Created
   - Should link to generation_id
   - Should increment generation accepted count

3. **POST - Missing Required Fields**
   - Should return 400 Bad Request
   - Should return validation errors for missing fields

4. **POST - Front Exceeds 200 Characters**
   - Should return 400 Bad Request
   - Should return validation error for front field

5. **POST - Back Exceeds 500 Characters**
   - Should return 400 Bad Request
   - Should return validation error for back field

6. **POST - Empty Front After Trim**
   - Should return 400 Bad Request
   - Should return validation error

7. **POST - Invalid Source Enum**
   - Should return 400 Bad Request
   - Should return validation error

8. **POST - Manual Flashcard with generation_id**
   - Should return 400 Bad Request
   - Should return validation error

9. **POST - AI Flashcard without generation_id**
   - Should return 400 Bad Request
   - Should return validation error

10. **POST - Invalid generation_id**
    - Should return 404 Not Found
    - Should return GENERATION_NOT_FOUND error

11. **POST - Invalid JSON Body**
    - Should return 400 Bad Request
    - Should return parse error

12. **POST - Database Connection Failure**
    - Should return 500 Internal Server Error
    - Should log error server-side

#### 5.3. Manual Testing Checklist

- [ ] Create manual flashcard via Postman/curl
- [ ] Create AI-generated flashcard (unedited)
- [ ] Create AI-generated flashcard (edited)
- [ ] Verify generation counts increment correctly
- [ ] Test with invalid generation_id
- [ ] Test with generation_id from different user
- [ ] Test with missing fields
- [ ] Test with oversized fields
- [ ] Test with whitespace-only content
- [ ] Test with invalid JSON
- [ ] Verify response excludes user_id
- [ ] Verify timestamps are set correctly

---

### Step 6: Documentation

#### 6.1. Code Documentation

- Add JSDoc comments to all service functions
- Document error handling behavior
- Document transaction/rollback logic
- Add inline comments for complex business logic

#### 6.2. API Documentation

- Update API documentation with endpoint details
- Include request/response examples
- Document all error codes and scenarios
- Add authentication requirements (dev vs production)

#### 6.3. Developer Notes

- Document the source/generation_id relationship rules
- Explain rollback strategy for failed generation updates
- Note performance considerations for batch operations
- Document future enhancement: POST /api/flashcards/bulk

---

### Step 7: Deployment Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Linter errors resolved
- [ ] Type errors resolved
- [ ] Error handling tested
- [ ] Database indexes verified
- [ ] RLS policies verified (if applicable)
- [ ] Manual testing completed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Migration scripts ready (if schema changes)
- [ ] Monitoring/logging configured

---

## 10. Future Enhancements

### 10.1. Batch Creation Endpoint

- Implement `POST /api/flashcards/bulk` for creating multiple flashcards
- Reduce API calls when accepting multiple AI candidates
- Use database transaction for atomic batch insert

### 10.2. Authentication

- Implement JWT token validation
- Extract user_id from authenticated session
- Add authorization checks for generation ownership

### 10.3. Rate Limiting

- Add rate limiting per user (e.g., 100 flashcards per hour)
- Prevent abuse and database overload
- Return 429 Too Many Requests when limit exceeded

### 10.4. Duplicate Detection

- Check for duplicate flashcards (same front/back for user)
- Warn user before creating duplicate
- Optional: Auto-merge duplicates

### 10.5. Soft Delete

- Implement soft delete instead of hard delete
- Add `deleted_at` column to flashcards table
- Allow users to restore deleted flashcards

### 10.6. Audit Trail

- Log all flashcard creation events
- Track who created, when, and from where
- Support compliance and debugging

---

## 11. Appendix

### A. Related Endpoints

This endpoint is part of the flashcards resource. Related endpoints:

- `GET /api/flashcards` - List user's flashcards (with pagination and filtering)
- `GET /api/flashcards/:id` - Get single flashcard by ID
- `PATCH /api/flashcards/:id` - Update existing flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard
- `POST /api/flashcards/bulk` - Bulk create flashcards (future)

### B. Error Architecture Reference

**File Structure**:

```
src/lib/errors/
├── common.errors.ts          # Shared errors across all endpoints
│   ├── ValidationError       # 400 - Input validation failures
│   ├── UnauthorizedError     # 401 - Authentication failures
│   ├── NotFoundError         # 404 - Generic resource not found
│   └── RateLimitError        # 429 - Rate limit exceeded
│
├── generation.errors.ts      # Generation endpoint errors
│   ├── (re-exports common errors)
│   ├── ServiceUnavailableError   # 503 - AI service unavailable
│   └── GenerationFailedError     # 500 - AI generation failures
│
└── flashcard.errors.ts       # Flashcard endpoint errors
    ├── (re-exports common errors)
    ├── GenerationNotFoundError   # 404 - Generation not found
    ├── FlashcardCreationError    # 500 - Database failures
    └── FlashcardNotFoundError    # 404 - Flashcard not found (future)
```

**Usage Pattern**:

```typescript
// In flashcard endpoint/service
import {
  ValidationError, // Common (re-exported)
  GenerationNotFoundError, // Flashcard-specific
  FlashcardCreationError, // Flashcard-specific
} from "../../lib/errors/flashcard.errors";

// In generation endpoint/service
import {
  ValidationError, // Common (re-exported)
  RateLimitError, // Common (re-exported)
  ServiceUnavailableError, // Generation-specific
  GenerationFailedError, // Generation-specific
} from "../../lib/errors/generation.errors";
```

**Benefits**:

- ✅ No code duplication (common errors defined once)
- ✅ Consistent error handling across endpoints
- ✅ Easy to extend (add new common or specific errors)
- ✅ Clear separation of concerns
- ✅ Convenient re-exports per endpoint

### C. Database Schema Reference

**flashcards table**:

```sql
CREATE TABLE flashcards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id BIGINT REFERENCES generations(id) ON DELETE CASCADE,
  front VARCHAR(200) NOT NULL,
  back VARCHAR(500) NOT NULL,
  source flashcard_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_front_not_empty CHECK (length(trim(front)) > 0),
  CONSTRAINT check_back_not_empty CHECK (length(trim(back)) > 0)
);
```

**generations table** (relevant columns):

```sql
CREATE TABLE generations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_count INT NOT NULL DEFAULT 0,
  accepted_unedited_count INT NOT NULL DEFAULT 0,
  accepted_edited_count INT NOT NULL DEFAULT 0,
  -- ... other columns
);
```

### D. Error Code Reference

| Error Code                  | HTTP Status | Trigger Condition     | User Action                    |
| --------------------------- | ----------- | --------------------- | ------------------------------ |
| `VALIDATION_ERROR`          | 400         | Invalid input data    | Fix input and retry            |
| `GENERATION_NOT_FOUND`      | 404         | Invalid generation_id | Use valid generation_id        |
| `FLASHCARD_CREATION_FAILED` | 500         | Database/server error | Retry later or contact support |

### E. Example cURL Commands

**Create Manual Flashcard**:

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is the capital of France?",
    "back": "Paris",
    "source": "manual",
    "generation_id": null
  }'
```

**Create AI-Generated Flashcard (Unedited)**:

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is photosynthesis?",
    "back": "The process by which plants convert light energy into chemical energy",
    "source": "ai_generated",
    "generation_id": 42
  }'
```

**Create AI-Generated Flashcard (Edited)**:

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is photosynthesis?",
    "back": "The process by which plants convert light energy into chemical energy, storing it in glucose molecules",
    "source": "ai_generated_edited",
    "generation_id": 42
  }'
```

### F. Glossary

- **Flashcard**: A learning tool with a question (front) and answer (back)
- **Generation**: An AI session that produces flashcard candidates
- **Candidate**: A temporary flashcard suggestion from AI (not yet saved)
- **Source**: Origin of flashcard (manual, ai_generated, ai_generated_edited)
- **Acceptance**: User action of saving an AI candidate as a flashcard
- **Acceptance Rate**: Percentage of AI candidates that users accept
- **RLS**: Row Level Security - Postgres feature for data isolation
- **DTO**: Data Transfer Object - Type for API responses
- **Command Model**: Type for API requests
- **Entity**: Type for database records

---

**End of Implementation Plan**
