# API Endpoint Implementation Plan: List User's Flashcards

## 1. Endpoint Overview

**Endpoint**: `GET /api/flashcards`

**Purpose**: Retrieve a list of flashcards belonging to the authenticated user, sorted by creation date (newest first).

**Key Features**:
- Returns up to 20 flashcards at a time (configurable via `limit` parameter)
- Sorted by creation date in descending order (newest first)
- Simple pagination support for future expansion

**Business Rules**:
- Users can only view their own flashcards (enforced by user_id filtering)
- Default: returns first 20 flashcards
- Maximum: can request up to 100 flashcards at once
- Empty results are valid: If user has no flashcards, returns empty array with status 200 OK

---

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/flashcards?page={page}&limit={limit}
```

### Query Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `page` | integer | No | 1 | >= 1 | Which page to retrieve (page 1 = first 20 items, page 2 = next 20 items, etc.) |
| `limit` | integer | No | 20 | >= 1, <= 100 | How many flashcards to return per page |

**Note**: 
- `page=1` means "first page" (items 1-20)
- `page=2` means "second page" (items 21-40)
- `limit=20` means "show 20 items per page" (default)
- `limit=100` means "show 100 items per page" (maximum allowed)

### Headers
- `Authorization: Bearer {token}` (when authentication is enabled in production)
- Response will have `Content-Type: application/json`

### Request Body
None - GET requests don't have a body.

**Get flashcards and authorization**
The user_id comes from authentication:
1. User logs in → receives a token
2. Token is sent in `Authorization` header with each request
3. Backend extracts user_id from the token
4. Backend uses that user_id to filter flashcards

This is more secure - users can't pretend to be someone else.

### Example Requests with curl

**Basic request (returns first 20 flashcards)**:
```bash
curl http://localhost:4321/api/flashcards
```

**Get second page of flashcards**:
```bash
curl http://localhost:4321/api/flashcards?page=2
```

**Get 50 flashcards at once**:
```bash
curl http://localhost:4321/api/flashcards?limit=50
```

---

## 3. Utilized Types

### From `src/types.ts`

**Query Parameters Type**:
```typescript
ListFlashcardsQueryParams {
  page?: number;
  limit?: number;
}
```

**Response Types**:
```typescript
ListFlashcardsResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

FlashcardDto = Omit<FlashcardEntity, "user_id"> {
  id: number;
  generation_id: number | null;
  front: string;
  back: string;
  source: FlashcardSource;
  created_at: string;
  updated_at: string;
}

PaginationDto {
  page: number;
  limit: number;
  total_pages: number;
  total_items: number;
}

FlashcardSource = "manual" | "ai_generated" | "ai_generated_edited"
```

**Error Response Type**:
```typescript
ErrorResponseDto {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetailDto[] | Record<string, unknown>;
  }
}
```

### Database Entity
```typescript
FlashcardEntity = Tables<"flashcards"> {
  id: number;
  user_id: string;              // Excluded from response for security
  generation_id: number | null;
  front: string;
  back: string;
  source: FlashcardSource;
  created_at: string;
  updated_at: string;
}
```

---

## 4. Response Details

### Success Response (200 OK)

**When user has flashcards**:
```json
{
  "data": [
    {
      "id": 123,
      "generation_id": 45,
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "ai_generated",
      "created_at": "2025-11-26T10:30:00Z",
      "updated_at": "2025-11-26T10:30:00Z"
    },
    {
      "id": 122,
      "generation_id": null,
      "front": "What is 2+2?",
      "back": "4",
      "source": "manual",
      "created_at": "2025-11-26T09:15:00Z",
      "updated_at": "2025-11-26T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "total_items": 97
  }
}
```

**When user has no flashcards (empty result)**:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 0,
    "total_items": 0
  }
}
```

This is a **successful response** (200 OK), not an error. It simply means the user hasn't created any flashcards yet.

### Error Responses

**400 Bad Request** - Invalid query parameters:
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid pagination parameters",
    "details": [
      {
        "field": "page",
        "message": "Page must be a positive integer"
      }
    ]
  }
}
```

**401 Unauthorized** - Missing or invalid authentication (production):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid access token."
  }
}
```

**500 Internal Server Error** - Server-side error:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while processing your request"
  }
}
```

---

## 5. Data Flow

### High-Level Flow
```
Client Request
    ↓
API Endpoint Handler (src/pages/api/flashcards.ts)
    ↓
Query Parameter Validation (Zod Schema)
    ↓
Authentication Check (extract user_id from token)
    ↓
Service Layer (flashcard.service.ts)
    ↓
Database Query (Supabase Client)
    ├─ SELECT flashcards WHERE user_id = ?
    └─ COUNT total flashcards for this user
    ↓
Data Transformation (remove user_id from response)
    ↓
Response Formatting (add pagination metadata)
    ↓
Client Response
```

### Detailed Flow

1. **Request Reception**:
   - Astro API endpoint receives GET request
   - Extract query parameters from URL (page, limit)

2. **Input Validation**:
   - Parse and validate query parameters using Zod schema
   - Convert string values to numbers (e.g., "2" → 2)
   - Apply default values if not provided (page=1, limit=20)
   - Validate constraints (page >= 1, limit between 1 and 100)

3. **Authentication** (when enabled):
   - Extract user from `context.locals.supabase.auth.getUser()`
   - Get user_id from the authenticated user
   - Throw `UnauthorizedError` if user not authenticated

4. **Service Layer Call**:
   - Call `flashcardService.listFlashcards(userId, page, limit)`
   - Service constructs database query

5. **Database Interaction**:
   - Execute query to get flashcards:
     - WHERE user_id = {authenticated_user_id}
     - ORDER BY created_at DESC (newest first)
     - LIMIT {limit}
     - OFFSET (page - 1) * limit
   - Execute COUNT query to get total number of flashcards
   - Database uses index `idx_flashcards_user_created` for fast lookup

6. **Data Transformation**:
   - Convert `FlashcardEntity[]` to `FlashcardDto[]`
   - Remove `user_id` field from each flashcard (security - don't expose user IDs)

7. **Pagination Calculation**:
   - Calculate total_pages = Math.ceil(total_items / limit)
   - Build pagination metadata object

8. **Response Formation**:
   - Combine flashcards and pagination into response object
   - Set HTTP status 200
   - Return JSON response

9. **Error Handling**:
   - If any error occurs, catch it and return appropriate error response
   - Log errors for debugging

### Database Query Example

**What the database query looks like** (simplified):

```sql
-- Get flashcards for page 2 with limit 20
SELECT id, generation_id, front, back, source, created_at, updated_at
FROM flashcards
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;  -- OFFSET = (page - 1) * limit = (2 - 1) * 20 = 20

-- Get total count
SELECT COUNT(*)
FROM flashcards
WHERE user_id = 'user-uuid-here';
```

**What is OFFSET?**
OFFSET tells the database to skip a certain number of rows:
- OFFSET 0: Start from the first row (page 1)
- OFFSET 20: Skip first 20 rows, start from row 21 (page 2)
- OFFSET 40: Skip first 40 rows, start from row 41 (page 3)

**Why is large OFFSET slow?**
If you request page 1000, the database must:
1. Find all matching rows
2. Sort them
3. Skip the first 19,980 rows (throw them away)
4. Return the next 20 rows

This is wasteful for large page numbers. However, for MVP this is fine because:
- Most users won't have thousands of flashcards
- Most users won't navigate to page 1000
- The database index makes this reasonably fast anyway

---

## 6. Security Considerations

### Authentication
- **Development Mode**: Authentication not required (for easier testing)
- **Production Mode**: Require valid JWT token in Authorization header
- **Implementation**: Check `context.locals.supabase.auth.getUser()`
- **Error**: Return 401 Unauthorized if authentication fails

### Authorization
- **User Isolation**: Always filter flashcards by authenticated user's ID
- **No Cross-User Access**: Users cannot see other users' flashcards
- **Implementation**: Add `WHERE user_id = {authenticated_user_id}` to all queries
- **Why it's secure**: Even if someone tries to hack the URL, they can only see their own flashcards

### Input Validation
- **Query Parameter Sanitization**: Use Zod to validate all inputs
- **SQL Injection Prevention**: Use parameterized queries (Supabase handles this automatically)
- **Numeric Bounds**: Enforce min/max constraints on page and limit

**What is SQL Injection?**
It's a hacking technique where someone puts malicious code in your inputs.

**Example of vulnerable code** (DON'T DO THIS):
```typescript
// BAD - vulnerable to SQL injection
const query = `SELECT * FROM flashcards WHERE user_id = '${userId}'`;
```

If someone sets userId to `'; DELETE FROM flashcards; --`, it would delete all flashcards!

**Safe code** (what we use):
```typescript
// GOOD - parameterized query
supabase.from('flashcards').eq('user_id', userId)
```

Supabase treats the userId as data, not code, so it's safe. The hacker's malicious code is treated as a literal string, not executed.

### Data Exposure
- **Exclude Sensitive Fields**: Remove `user_id` from response
- **No Raw Database Errors**: Transform database errors to generic messages (don't expose database structure)
- **Consistent Error Format**: Use ErrorResponseDto for all errors

---

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | HTTP Status | Error Code | Example Message |
|----------|-------------|------------|-----------------|
| Invalid page number (< 1) | 400 | INVALID_PARAMETERS | "Page must be a positive integer" |
| Invalid page number (not a number) | 400 | INVALID_PARAMETERS | "Page must be a number" |
| Invalid limit (< 1) | 400 | INVALID_PARAMETERS | "Limit must be at least 1" |
| Invalid limit (> 100) | 400 | INVALID_PARAMETERS | "Limit cannot exceed 100" |
| Missing authentication | 401 | UNAUTHORIZED | "Authentication required. Please provide a valid access token." |
| Invalid/expired token | 401 | UNAUTHORIZED | "Invalid or expired authentication token" |
| Database connection error | 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred while processing your request" |
| Unexpected service error | 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred while processing your request" |

### Error Handling Strategy

1. **Validation Errors** (400):
   - Catch Zod validation errors
   - Transform to `ValidationError`
   - Extract field-level error details
   - Return 400 with detailed error information

2. **Authentication Errors** (401):
   - Catch Supabase auth errors
   - Transform to `UnauthorizedError`
   - Return 401 with generic message (don't expose auth details)

3. **Database Errors** (500):
   - Catch Supabase client errors
   - Log full error for debugging
   - Return 500 with generic message (don't expose database structure)

4. **Unexpected Errors** (500):
   - Catch all other errors
   - Log error with stack trace
   - Return 500 with generic message

---

## 8. Implementation Steps

### Step 1: Create Zod Validation Schema

**File**: `src/lib/schemas/flashcard.schemas.ts`

**Task**: Add validation schema for list query parameters

```typescript
export const listFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
```

**What this does**:
- `z.coerce.number()`: Converts string "2" to number 2
- `.int()`: Must be a whole number (not 2.5)
- `.min(1)`: Must be at least 1
- `.max(100)`: Cannot exceed 100 (for limit only)
- `.default(1)` or `.default(20)`: Use this value if not provided

---

### Step 2: Implement Service Method

**File**: `src/lib/services/flashcard.service.ts`

**Task**: Add `listFlashcards` method

**Method Signature**:
```typescript
async listFlashcards(
  userId: string,
  params: {
    page: number;
    limit: number;
  }
): Promise<{
  flashcards: FlashcardEntity[];
  totalCount: number;
}>
```

**Implementation Details**:
1. Calculate offset: `const offset = (page - 1) * limit`
2. Build Supabase query:
   ```typescript
   const { data, count, error } = await supabase
     .from('flashcards')
     .select('*', { count: 'exact' })
     .eq('user_id', userId)
     .order('created_at', { ascending: false })
     .range(offset, offset + limit - 1);
   ```
3. Handle errors (throw if query fails)
4. Return flashcards array and total count

---

### Step 3: Create API Endpoint Handler

**File**: `src/pages/api/flashcards.ts`

**Task**: Implement GET handler (or add to existing file if it already has POST)

**Implementation**:
```typescript
export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    // 1. Extract and validate query parameters
    const queryParams = {
      page: context.url.searchParams.get('page'),
      limit: context.url.searchParams.get('limit')
    };
    
    const validatedParams = listFlashcardsQuerySchema.parse(queryParams);
    
    // 2. Get authenticated user
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new UnauthorizedError();
    }
    
    // 3. Call service
    const { flashcards, totalCount } = await flashcardService.listFlashcards(
      user.id,
      validatedParams
    );
    
    // 4. Transform to DTOs (remove user_id)
    const flashcardDtos: FlashcardDto[] = flashcards.map(({ user_id, ...rest }) => rest);
    
    // 5. Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const pagination: PaginationDto = {
      page: validatedParams.page,
      limit: validatedParams.limit,
      total_pages: totalPages,
      total_items: totalCount
    };
    
    // 6. Return response
    return new Response(
      JSON.stringify({ data: flashcardDtos, pagination }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    // Error handling (see Step 4)
  }
}
```

---

### Step 4: Implement Error Handling

**Location**: Wrap entire GET handler in try-catch

**Implementation**:
```typescript
catch (error) {
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_PARAMETERS",
          message: error.message,
          details: error.details
        }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  if (error instanceof UnauthorizedError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: error.message
        }
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Log unexpected errors
  console.error("Unexpected error in GET /api/flashcards:", error);
  
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing your request"
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

---

### Step 5: Test Implementation

**Test with curl**:

```bash
# Test 1: Basic request (should return first 20 flashcards)
curl http://localhost:4321/api/flashcards

# Test 2: Get second page
curl http://localhost:4321/api/flashcards?page=2

# Test 3: Request 50 flashcards
curl http://localhost:4321/api/flashcards?limit=50

# Test 4: Invalid page (should return 400 error)
curl http://localhost:4321/api/flashcards?page=0

# Test 5: Invalid limit (should return 400 error)
curl http://localhost:4321/api/flashcards?limit=200
```

**Expected results**:
- Tests 1-3: Should return 200 OK with flashcards and pagination
- Tests 4-5: Should return 400 Bad Request with error message

---

### Step 6: Verify Database Performance

**Task**: Confirm query uses the appropriate index

**How to check**:
1. Run EXPLAIN ANALYZE on the query in Supabase SQL editor
2. Confirm `idx_flashcards_user_created` is used
3. Check query execution time (should be < 50ms for typical data)

**SQL to test**:
```sql
EXPLAIN ANALYZE
SELECT id, generation_id, front, back, source, created_at, updated_at
FROM flashcards
WHERE user_id = 'some-user-id'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

**What to look for**:
- Should see "Index Scan using idx_flashcards_user_created"
- Execution time should be low (< 50ms)

---

### Step 7: Documentation

**Tasks**:
1. Add JSDoc comments to service method
2. Add inline comments for complex logic
3. Document any edge cases

**Example JSDoc**:
```typescript
/**
 * List flashcards for a user with pagination
 * 
 * @param userId - The authenticated user's ID
 * @param params - Pagination parameters (page and limit)
 * @returns Flashcards array and total count
 * @throws Error if database query fails
 */
async listFlashcards(userId: string, params: { page: number; limit: number }) {
  // implementation
}
```

---

## 9. Related Endpoints

This endpoint is part of the Flashcards resource. Related endpoints include:

- `POST /api/flashcards` - Create single flashcard
- `POST /api/flashcards/bulk` - Bulk create flashcards
- `GET /api/flashcards/:id` - Get single flashcard
- `PATCH /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard

Ensure consistent patterns across all flashcard endpoints for:
- Error handling (same error format)
- Authentication (same auth check)
- Response formatting (same JSON structure)
- Validation approach (use Zod schemas)
