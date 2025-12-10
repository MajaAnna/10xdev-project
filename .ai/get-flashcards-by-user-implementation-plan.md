# API Endpoint Implementation Plan: List User's Flashcards

## 1. Endpoint Overview

**Endpoint**: `GET /api/flashcards`

**Purpose**: Retrieve a paginated list of flashcards belonging to the authenticated user, sorted by creation date (newest first). Supports optional filtering by flashcard source type.

**Key Features**:
- Pagination with configurable page size
- Filtering by source type (manual, ai_generated, ai_generated_edited)
- Sorted by creation date in descending order
- Returns metadata for pagination navigation

**Business Rules**:
- Users can only view their own flashcards (enforced by user_id filtering)
- Default pagination: page 1, 20 items per page
- Maximum page size: 100 items
- Empty results are valid (returns empty array with pagination metadata)

---

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/flashcards?page={page}&limit={limit}&source={source}
```

### Query Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `page` | integer | No | 1 | >= 1 | Page number for pagination |
| `limit` | integer | No | 20 | >= 1, <= 100 | Number of items per page |
| `source` | enum | No | - | One of: `manual`, `ai_generated`, `ai_generated_edited` | Filter flashcards by source type |

### Headers
- `Authorization: Bearer {token}` (when authentication is enabled in production)
- `Content-Type: application/json` (for response)

### Request Body
None (GET request)

### Example Requests

**Basic request (defaults)**:
```
GET /api/flashcards
```

**With pagination**:
```
GET /api/flashcards?page=2&limit=50
```

**With source filter**:
```
GET /api/flashcards?source=ai_generated
```

**Combined parameters**:
```
GET /api/flashcards?page=1&limit=10&source=manual
```

---

## 3. Utilized Types

### From `src/types.ts`

**Query Parameters Type**:
```typescript
ListFlashcardsQueryParams {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
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
  user_id: string;
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

**Structure**:
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

**Empty Results**:
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
Authentication Check (context.locals.supabase)
    ↓
Service Layer (flashcard.service.ts)
    ↓
Database Query (Supabase Client)
    ├─ SELECT flashcards with filters
    └─ COUNT total matching records
    ↓
Data Transformation (Entity → DTO)
    ↓
Response Formatting
    ↓
Client Response
```

### Detailed Flow

1. **Request Reception**:
   - Astro API endpoint receives GET request
   - Extract query parameters from URL

2. **Input Validation**:
   - Parse and validate query parameters using Zod schema
   - Coerce string values to appropriate types
   - Apply default values (page=1, limit=20)
   - Validate constraints (page >= 1, limit <= 100)
   - Validate source enum if provided

3. **Authentication** (when enabled):
   - Extract user from `context.locals.supabase.auth.getUser()`
   - Throw `UnauthorizedError` if user not authenticated

4. **Service Layer Call**:
   - Call `flashcardService.listFlashcards(userId, queryParams)`
   - Service constructs database query with:
     - WHERE user_id = {userId}
     - AND source = {source} (if filter provided)
     - ORDER BY created_at DESC
     - LIMIT {limit}
     - OFFSET (page - 1) * limit

5. **Database Interaction**:
   - Execute SELECT query using Supabase client
   - Execute COUNT query for total items (or use Supabase count option)
   - Leverage index `idx_flashcards_user_created` for performance

6. **Data Transformation**:
   - Map `FlashcardEntity[]` to `FlashcardDto[]`
   - Exclude `user_id` field from response
   - Format timestamps as ISO 8601 strings

7. **Pagination Calculation**:
   - Calculate `total_pages = Math.ceil(total_items / limit)`
   - Build `PaginationDto` object

8. **Response Formation**:
   - Construct `ListFlashcardsResponseDto`
   - Set HTTP status 200
   - Return JSON response

9. **Error Handling**:
   - Catch and transform errors to appropriate HTTP responses
   - Log errors for debugging

### Database Query Details

**Main Query**:
```sql
SELECT id, generation_id, front, back, source, created_at, updated_at
FROM flashcards
WHERE user_id = $1
  AND ($2::flashcard_source IS NULL OR source = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

**Count Query**:
```sql
SELECT COUNT(*)
FROM flashcards
WHERE user_id = $1
  AND ($2::flashcard_source IS NULL OR source = $2);
```

**Index Used**: `idx_flashcards_user_created ON flashcards(user_id, created_at DESC)`

---

## 6. Security Considerations

### Authentication
- **Development Mode**: Authentication not required (as per specification)
- **Production Mode**: Require valid JWT token in Authorization header
- **Implementation**: Check `context.locals.supabase.auth.getUser()`
- **Error**: Return 401 Unauthorized if authentication fails

### Authorization
- **User Isolation**: Always filter flashcards by authenticated user's ID
- **No Cross-User Access**: Users cannot access other users' flashcards
- **Implementation**: Add `WHERE user_id = {authenticated_user_id}` to all queries

### Input Validation
- **Query Parameter Sanitization**: Use Zod for type-safe validation
- **SQL Injection Prevention**: Use parameterized queries (Supabase handles this)
- **Enum Validation**: Strictly validate source parameter against FlashcardSource enum
- **Numeric Bounds**: Enforce min/max constraints on page and limit

### Data Exposure
- **Exclude Sensitive Fields**: Remove `user_id` from response (use FlashcardDto)
- **No Raw Database Errors**: Transform database errors to generic messages
- **Consistent Error Format**: Use ErrorResponseDto for all errors

### Rate Limiting
- **Consideration**: Implement rate limiting per user/IP to prevent abuse
- **Recommendation**: 100 requests per minute per user
- **Implementation**: Use middleware or external service (e.g., Redis)

### CORS (if applicable)
- **Configuration**: Set appropriate CORS headers for frontend domain
- **Credentials**: Allow credentials if using cookie-based auth

---

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Error Type | HTTP Status | Error Code | Example Message |
|----------|------------|-------------|------------|-----------------|
| Invalid page number (< 1) | ValidationError | 400 | INVALID_PARAMETERS | "Page must be a positive integer" |
| Invalid page number (non-numeric) | ValidationError | 400 | INVALID_PARAMETERS | "Page must be a number" |
| Invalid limit (< 1) | ValidationError | 400 | INVALID_PARAMETERS | "Limit must be at least 1" |
| Invalid limit (> 100) | ValidationError | 400 | INVALID_PARAMETERS | "Limit cannot exceed 100" |
| Invalid source enum | ValidationError | 400 | INVALID_PARAMETERS | "Source must be one of: manual, ai_generated, ai_generated_edited" |
| Missing authentication | UnauthorizedError | 401 | UNAUTHORIZED | "Authentication required. Please provide a valid access token." |
| Invalid/expired token | UnauthorizedError | 401 | UNAUTHORIZED | "Invalid or expired authentication token" |
| Database connection error | Error | 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred while processing your request" |
| Unexpected service error | Error | 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred while processing your request" |

### Error Handling Strategy

1. **Validation Errors**:
   - Catch Zod validation errors
   - Transform to `ValidationError`
   - Extract field-level error details
   - Return 400 with detailed error information

2. **Authentication Errors**:
   - Catch Supabase auth errors
   - Transform to `UnauthorizedError`
   - Return 401 with generic message (don't expose auth details)

3. **Database Errors**:
   - Catch Supabase client errors
   - Log full error for debugging
   - Return 500 with generic message (don't expose database details)

4. **Unexpected Errors**:
   - Catch all other errors
   - Log error with stack trace
   - Return 500 with generic message

### Error Handler Implementation Pattern

```typescript
try {
  // Main logic
} catch (error) {
  if (error instanceof ValidationError) {
    return new Response(JSON.stringify({
      error: {
        code: "INVALID_PARAMETERS",
        message: error.message,
        details: error.details
      }
    }), { status: 400 });
  }
  
  if (error instanceof UnauthorizedError) {
    return new Response(JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: error.message
      }
    }), { status: 401 });
  }
  
  // Log unexpected errors
  console.error("Unexpected error in GET /api/flashcards:", error);
  
  return new Response(JSON.stringify({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while processing your request"
    }
  }), { status: 500 });
}
```

---

## 8. Performance Considerations

### Database Optimization

**Index Usage**:
- Primary index: `idx_flashcards_user_created ON flashcards(user_id, created_at DESC)`
- This index optimally supports:
  - Filtering by user_id
  - Sorting by created_at DESC
  - Efficient pagination with OFFSET/LIMIT

**Query Optimization**:
- Use SELECT with specific columns (avoid SELECT *)
- Combine data query and count query if possible (Supabase supports this)
- Consider using Supabase's range headers for pagination metadata

**Pagination Strategy**:
- OFFSET/LIMIT pagination is simple but can be slow for large offsets
- For very large datasets, consider cursor-based pagination in future
- Current approach is acceptable for typical use cases (< 10,000 flashcards per user)

### Caching Strategy

**Response Caching**:
- Consider caching responses for short periods (30-60 seconds)
- Invalidate cache on flashcard creation/update/deletion
- Use user_id + query params as cache key

**Database Connection Pooling**:
- Supabase handles connection pooling automatically
- Ensure proper connection cleanup in service layer

### Response Size Optimization

**Pagination Limits**:
- Default limit: 20 items (reasonable for most UIs)
- Maximum limit: 100 items (prevents excessive data transfer)
- Encourage clients to use appropriate page sizes

**Field Selection**:
- Current implementation returns all flashcard fields
- Consider adding field selection in future if needed

### Monitoring

**Performance Metrics to Track**:
- Average response time
- 95th/99th percentile response times
- Database query duration
- Error rates by type
- Most common query patterns

**Potential Bottlenecks**:
- Large OFFSET values in pagination (mitigated by typical use patterns)
- COUNT queries on large datasets (acceptable for current scale)
- Concurrent requests from same user (rate limiting helps)

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File**: `src/lib/schemas/flashcard.schemas.ts`

**Task**: Add validation schema for list query parameters

```typescript
export const listFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source: z.enum(["manual", "ai_generated", "ai_generated_edited"]).optional()
});
```

**Validation**:
- Coerce string query params to numbers
- Apply default values
- Enforce constraints (page >= 1, limit 1-100)
- Validate source enum

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
    source?: FlashcardSource;
  }
): Promise<{
  flashcards: FlashcardEntity[];
  totalCount: number;
}>
```

**Implementation Details**:
1. Calculate offset: `(page - 1) * limit`
2. Build Supabase query:
   - Start with `supabase.from('flashcards').select('*', { count: 'exact' })`
   - Add `.eq('user_id', userId)`
   - Add `.eq('source', source)` if source provided
   - Add `.order('created_at', { ascending: false })`
   - Add `.range(offset, offset + limit - 1)`
3. Execute query and extract data + count
4. Handle errors (throw appropriate custom errors)
5. Return flashcards array and total count

**Error Handling**:
- Catch Supabase errors
- Log errors for debugging
- Throw generic Error for unexpected issues

---

### Step 3: Create API Endpoint Handler

**File**: `src/pages/api/flashcards.ts`

**Task**: Implement GET handler

**Implementation**:
```typescript
export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  // Implementation here
}
```

**Handler Logic**:
1. Extract query parameters from `context.url.searchParams`
2. Validate using `listFlashcardsQuerySchema`
3. Get authenticated user from `context.locals.supabase.auth.getUser()`
4. Call `flashcardService.listFlashcards(userId, validatedParams)`
5. Transform entities to DTOs (exclude user_id)
6. Calculate pagination metadata
7. Build response object
8. Return JSON response with status 200

---

### Step 4: Transform Entities to DTOs

**Location**: Within GET handler

**Task**: Map database entities to API DTOs

**Implementation**:
```typescript
const flashcardDtos: FlashcardDto[] = flashcards.map(({ user_id, ...rest }) => rest);
```

**Ensure**:
- `user_id` field is excluded
- All other fields are preserved
- Timestamps are in ISO 8601 format (Supabase returns this by default)

---

### Step 5: Calculate Pagination Metadata

**Location**: Within GET handler

**Task**: Build PaginationDto object

**Implementation**:
```typescript
const totalPages = Math.ceil(totalCount / limit);

const pagination: PaginationDto = {
  page,
  limit,
  total_pages: totalPages,
  total_items: totalCount
};
```

**Edge Cases**:
- If totalCount is 0, total_pages should be 0
- Ensure integer division for total_pages

---

### Step 6: Implement Error Handling

**Location**: Wrap entire GET handler

**Task**: Add comprehensive try-catch blocks

**Implementation Pattern**:
1. Wrap main logic in try-catch
2. Handle `ValidationError` → 400 response
3. Handle `UnauthorizedError` → 401 response
4. Handle generic `Error` → 500 response
5. Log all errors for debugging
6. Return consistent `ErrorResponseDto` format

**Error Response Builder**:
```typescript
function buildErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message, details }
    }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}
```

---

### Step 7: Add Response Headers

**Location**: All response returns

**Task**: Set appropriate HTTP headers

**Headers to Include**:
```typescript
{
  "Content-Type": "application/json",
  "Cache-Control": "private, no-cache" // Prevent caching of user-specific data
}
```

---

### Step 8: Test Implementation

**Manual Testing**:
1. Test default parameters (no query params)
2. Test custom pagination (page=2, limit=50)
3. Test source filtering (each enum value)
4. Test invalid parameters (negative page, limit > 100, invalid source)
5. Test empty results (new user with no flashcards)
6. Test edge cases (page beyond total_pages)

**Test Cases**:
```bash
# Default request
GET /api/flashcards

# Custom pagination
GET /api/flashcards?page=2&limit=10

# Source filter
GET /api/flashcards?source=manual
GET /api/flashcards?source=ai_generated
GET /api/flashcards?source=ai_generated_edited

# Invalid parameters
GET /api/flashcards?page=0          # Should return 400
GET /api/flashcards?page=-1         # Should return 400
GET /api/flashcards?limit=0         # Should return 400
GET /api/flashcards?limit=101       # Should return 400
GET /api/flashcards?source=invalid  # Should return 400

# Edge cases
GET /api/flashcards?page=999        # Should return empty array with valid pagination
```

---

### Step 9: Verify Database Performance

**Task**: Confirm query uses appropriate index

**Verification**:
1. Run EXPLAIN ANALYZE on generated queries
2. Confirm `idx_flashcards_user_created` is used
3. Check query execution time
4. Test with various data volumes

**Expected Query Plan**:
```
Index Scan using idx_flashcards_user_created on flashcards
  Index Cond: (user_id = '...')
  Filter: (source = '...')  -- if source filter applied
  Rows: ...
```

---

### Step 10: Documentation and Code Review

**Tasks**:
1. Add JSDoc comments to service method
2. Add inline comments for complex logic
3. Update API documentation if needed
4. Request code review from team
5. Address review feedback

**Documentation Checklist**:
- [ ] Service method has JSDoc with description, params, returns
- [ ] Complex logic has explanatory comments
- [ ] Error handling is documented
- [ ] Type definitions are clear
- [ ] Edge cases are noted

---

## 10. Testing Checklist

### Functional Tests
- [ ] Returns flashcards for authenticated user
- [ ] Sorts by created_at DESC
- [ ] Applies default pagination (page=1, limit=20)
- [ ] Respects custom page parameter
- [ ] Respects custom limit parameter
- [ ] Filters by source when provided
- [ ] Returns correct pagination metadata
- [ ] Returns empty array for no results
- [ ] Excludes user_id from response

### Validation Tests
- [ ] Rejects page < 1
- [ ] Rejects limit < 1
- [ ] Rejects limit > 100
- [ ] Rejects invalid source enum
- [ ] Coerces string numbers to integers
- [ ] Applies default values correctly

### Security Tests
- [ ] Returns only authenticated user's flashcards
- [ ] Returns 401 when authentication missing (production)
- [ ] Cannot access other users' flashcards
- [ ] No SQL injection via query parameters

### Performance Tests
- [ ] Query uses idx_flashcards_user_created index
- [ ] Response time < 200ms for typical dataset
- [ ] Handles large page numbers gracefully
- [ ] Handles maximum limit (100) efficiently

### Error Handling Tests
- [ ] Returns 400 for validation errors
- [ ] Returns 401 for auth errors (production)
- [ ] Returns 500 for unexpected errors
- [ ] Error responses match ErrorResponseDto format
- [ ] Errors are logged appropriately

---

## 11. Future Enhancements

### Potential Improvements
1. **Cursor-based Pagination**: For better performance with large datasets
2. **Field Selection**: Allow clients to specify which fields to return
3. **Additional Filters**: Filter by date range, search by text, etc.
4. **Sorting Options**: Allow sorting by different fields (front, back, updated_at)
5. **Response Caching**: Cache responses for better performance
6. **Batch Requests**: Support requesting multiple pages in one call
7. **GraphQL Alternative**: Consider GraphQL for more flexible querying

### Monitoring and Analytics
1. Track most common query patterns
2. Monitor response times by page size
3. Identify slow queries for optimization
4. Track error rates and types
5. Monitor cache hit rates (if caching implemented)

---

## 12. Related Endpoints

This endpoint is part of the Flashcards resource. Related endpoints include:

- `POST /api/flashcards` - Create single flashcard
- `POST /api/flashcards/bulk` - Bulk create flashcards
- `GET /api/flashcards/:id` - Get single flashcard
- `PATCH /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard

Ensure consistent patterns across all flashcard endpoints for:
- Error handling
- Authentication
- Response formatting
- Validation approach

