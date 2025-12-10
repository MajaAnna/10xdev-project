# REST API Plan - AI Cards MVP

## Overview

This document defines the complete REST API specification for the AI Cards application MVP. The API is designed to work with Supabase as the backend, following RESTful principles.

**Base URL**: `/api`  
**Content Type**: `application/json`  
**Development Mode**: Authentication is DISABLED for initial development. RLS policies are disabled. All operations use a default test user ID.  
**Production Mode**: Will require JWT Bearer Token (Supabase Auth) and RLS policies enabled.

### Development Configuration

For MVP development phase:
- **Authentication**: Not required (will be added later)
- **RLS Policies**: Disabled
- **User ID**: Hard-coded test UUID for all operations (e.g., `00000000-0000-0000-0000-000000000001`)
- **Authorization headers**: Not required - all endpoints work without JWT tokens
- **Error codes**: 401 Unauthorized errors are not implemented in dev mode

### Implementation Notes for Dev Mode

1. **Hardcoded User ID**: Use `DEFAULT_USER_ID` constant from `src/db/supabase.client.ts`:
   ```typescript
   import { DEFAULT_USER_ID } from "../../db/supabase.client";
   const userId = DEFAULT_USER_ID; // '00000000-0000-0000-0000-000000000001'
   ```

2. **Skip Auth Checks**: All endpoints accept requests without checking for authentication

3. **Database Setup**: Ensure RLS policies are disabled in your migrations:
   ```sql
   ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
   ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;
   ```

4. **Migration to Production**: See Section 11 for steps to enable authentication

---

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Flashcards | `flashcards` | User's flashcards (manual and AI-generated) |
| Generations | `generations` | AI generation sessions and analytics |
| Generation Error Logs | `generation_error_logs` | Used for logging errors happening during flashards generation by AI |
| Auth | `auth.users` | User authentication (Supabase managed) |

---

## 2. Endpoints

### 2.1. Flashcards Resource

#### 2.1.1. List User's Flashcards

**Endpoint**: `GET /api/flashcards`

**Description**: Retrieves paginated list of user's flashcards sorted by creation date (newest first).

**Authentication**: Not required in dev mode

**Query Parameters**:
- `page` (optional, integer, default: 1): Page number for pagination
- `limit` (optional, integer, default: 20, max: 100): Number of items per page
- `source` (optional, enum): Filter by source type (`manual`, `ai_generated`, `ai_generated_edited`)

**Response Body** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid-string",
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

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid pagination parameters"
  }
}
```

---

#### 2.1.2. Create Single Flashcard

**Endpoint**: `POST /api/flashcards`

**Description**: Creates a new flashcard (manual or from AI generation).

**Authentication**: Not required in dev mode

**Request Headers**:
```
Content-Type: application/json
```

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Request Body**:
```json
{
  "front": "What is photosynthesis?",
  "back": "The process by which plants convert light energy into chemical energy",
  "source": "manual",
  "generation_id": null
}
```

**Request Body Schema**:
- `front` (required, string, 1-200 chars): Question/term side
- `back` (required, string, 1-500 chars): Answer/definition side
- `source` (required, enum): One of `manual`, `ai_generated`, `ai_generated_edited`
- `generation_id` (conditionally required, integer or null):
  - REQUIRED for `ai_generated` and `ai_generated_edited` sources
  - MUST be null for `manual` source

**Business Logic**:
1. Validate generation_id based on source:
   - If `source` = `manual`: generation_id MUST be null
   - If `source` = `ai_generated` or `ai_generated_edited`: generation_id MUST be provided and valid
2. If source is AI-generated, update generation record:
   - Increment `accepted_unedited_count` (if `source` = `ai_generated`)
   - Increment `accepted_edited_count` (if `source` = `ai_generated_edited`)

**Response Body** (201 Created):
```json
{
  "data": {
    "id": 124,
    "user_id": "uuid-string",
    "generation_id": null,
    "front": "What is photosynthesis?",
    "back": "The process by which plants convert light energy into chemical energy",
    "source": "manual",
    "created_at": "2025-11-26T10:35:00Z",
    "updated_at": "2025-11-26T10:35:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
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
      },
      {
        "field": "generation_id",
        "message": "generation_id must be null for manual flashcards"
      }
    ]
  }
}
```
- `404 Not Found`: Generation ID not found or doesn't belong to user
```json
{
  "error": {
    "code": "GENERATION_NOT_FOUND",
    "message": "Generation session not found"
  }
}
```

---

#### 2.1.3. Bulk Create Flashcards

**Endpoint**: `POST /api/flashcards/bulk`

**Description**: Creates multiple flashcards at once (used for "Accept All" feature).

**Authentication**: Not required in dev mode

**Request Headers**:
```
Content-Type: application/json
```

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Request Body**:
```json
{
  "generation_id": 45,
  "flashcards": [
    {
      "front": "What is HTML?",
      "back": "HyperText Markup Language",
      "source": "ai_generated"
    },
    {
      "front": "What is CSS?",
      "back": "Cascading Style Sheets - used for styling web pages",
      "source": "ai_generated_edited"
    }
  ]
}
```

**Request Body Schema**:
- `generation_id` (required, integer): ID of generation session
- `flashcards` (required, array): Array of flashcard objects
  - `front` (required, string, 1-200 chars)
  - `back` (required, string, 1-500 chars)
  - `source` (required, enum): One of `ai_generated`, `ai_generated_edited`

**Business Logic**:
1. Validate all flashcards before creating any
2. Create all flashcards in a transaction
3. Update generation record with total counts:
   - `accepted_unedited_count` += count where `source` = `ai_generated`
   - `accepted_edited_count` += count where `source` = `ai_generated_edited`
4. Insert flashcards with their respective `source` values

**Response Body** (201 Created):
```json
{
  "data": {
    "created_count": 2,
    "flashcards": [
      {
        "id": 125,
        "user_id": "uuid-string",
        "generation_id": 45,
        "front": "What is HTML?",
        "back": "HyperText Markup Language",
        "source": "ai_generated",
        "created_at": "2025-11-26T10:40:00Z",
        "updated_at": "2025-11-26T10:40:00Z"
      },
      {
        "id": 126,
        "user_id": "uuid-string",
        "generation_id": 45,
        "front": "What is CSS?",
        "back": "Cascading Style Sheets - used for styling web pages",
        "source": "ai_generated_edited",
        "created_at": "2025-11-26T10:40:00Z",
        "updated_at": "2025-11-26T10:40:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors (includes index of failing flashcard)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for flashcard at index 1",
    "details": [
      {
        "index": 1,
        "field": "front",
        "message": "Front must be between 1 and 200 characters"
      }
    ]
  }
}
```
- `404 Not Found`: Generation ID not found
- `413 Payload Too Large`: Too many flashcards in one request (max 50)

---

#### 2.1.4. Get Single Flashcard

**Endpoint**: `GET /api/flashcards/:id`

**Description**: Retrieves a specific flashcard by ID.

**Authentication**: Not required in dev mode

**URL Parameters**:
- `id` (required, integer): Flashcard ID

**Request Headers**: None required in dev mode

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Response Body** (200 OK):
```json
{
  "data": {
    "id": 123,
    "user_id": "uuid-string",
    "generation_id": 45,
    "front": "What is the capital of France?",
    "back": "Paris",
    "source": "ai_generated",
    "created_at": "2025-11-26T10:30:00Z",
    "updated_at": "2025-11-26T10:30:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Flashcard not found
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

---

#### 2.1.5. Update Flashcard

**Endpoint**: `PATCH /api/flashcards/:id`

**Description**: Updates an existing flashcard's content. Automatically updates the source field based on the flashcard's origin.

**Authentication**: Not required in dev mode

**URL Parameters**:
- `id` (required, integer): Flashcard ID

**Request Headers**:
```
Content-Type: application/json
```

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Request Body**:
```json
{
  "front": "What is the capital city of France?",
  "back": "Paris, located in the north-central part of the country"
}
```

**Request Body Schema**:
- `front` (optional, string, 1-200 chars, not empty/whitespace): Updated question/term
- `back` (optional, string, 1-500 chars, not empty/whitespace): Updated answer/definition
- At least one field must be provided

**Business Logic**:
1. Validate that at least one field (front or back) is provided
2. Validate length constraints (min 1 char after trim, max 200 for front, max 500 for back)
3. Automatically update the `source` field based on current source:
   - If current source = `ai_generated` → update to `ai_generated_edited`
   - If current source = `ai_generated_edited` → keep as `ai_generated_edited`
   - If current source = `manual` → keep as `manual`
4. Update `updated_at` timestamp automatically (database trigger)

**Response Body** (200 OK):
```json
{
  "data": {
    "id": 123,
    "user_id": "uuid-string",
    "generation_id": 45,
    "front": "What is the capital city of France?",
    "back": "Paris, located in the north-central part of the country",
    "source": "ai_generated_edited",
    "created_at": "2025-11-26T10:30:00Z",
    "updated_at": "2025-11-26T11:45:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Flashcard not found
- `400 Bad Request`: Validation errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front must be between 1 and 200 characters"
      }
    ]
  }
}
```

---

#### 2.1.6. Delete Flashcard

**Endpoint**: `DELETE /api/flashcards/:id`

**Description**: Permanently deletes a flashcard.

**Authentication**: Not required in dev mode

**URL Parameters**:
- `id` (required, integer): Flashcard ID

**Request Headers**: None required in dev mode

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Response Body** (200 OK):
```json
{
  "data": {
    "message": "Flashcard deleted successfully",
    "deleted_id": 123
  }
}
```

**Error Responses**:
- `404 Not Found`: Flashcard not found
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

---

### 2.2. Generations Resource

#### 2.2.1. Create AI Generation

**Endpoint**: `POST /api/generations`

**Description**: Generates flashcard candidates from source text using AI. Creates generation log and returns temporary candidates (not saved to database).

**Authentication**: Not required in dev mode

**Request Headers**:
```
Content-Type: application/json
```

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Request Body**:
```json
{
  "source_text": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar. It occurs in the chloroplasts of plant cells...",
  "model": "gpt-4"
}
```

**Request Body Schema**:
- `source_text` (required, string, 100-10,000 chars): Text to generate flashcards from
- `model` (optional, string, default: "gpt-4"): AI model to use for generation

**Business Logic**:
1. Validate source text length (100-10,000 characters)
2. Calculate MD5 hash of source text
3. Call OpenRouter API with source text
4. Parse AI response into flashcard candidates
5. Create generation log record with:
   - `generated_count` = number of candidates returned
   - `generation_duration` = time taken in milliseconds
   - `source_text_hash` and `source_text_length`
7. Return generation_id and candidates array

**Response Body** (201 Created):
```json
{
  "data": {
    "generation_id": 46,
    "model": "gpt-4",
    "generation_duration": 3450,
    "generated_count": 5,
    "candidates": [
      {
        "front": "What is photosynthesis?",
        "back": "The process by which plants use sunlight, water, and CO2 to create oxygen and sugar"
      },
      {
        "front": "Where does photosynthesis occur?",
        "back": "In the chloroplasts of plant cells"
      },
      {
        "front": "What are the inputs of photosynthesis?",
        "back": "Sunlight, water, and carbon dioxide"
      },
      {
        "front": "What are the outputs of photosynthesis?",
        "back": "Oxygen and energy in the form of sugar"
      },
      {
        "front": "What organelle is responsible for photosynthesis?",
        "back": "Chloroplasts"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Source text must be between 100 and 10,000 characters",
    "details": {
      "field": "source_text",
      "current_length": 45,
      "min_length": 100,
      "max_length": 10000
    }
  }
}
```
- `500 Internal Server Error`: AI generation failed
```json
{
  "error": {
    "code": "GENERATION_FAILED",
    "message": "An error occurred while generating flashcards. Please try again later."
  }
}
```
- `429 Too Many Requests`: Rate limit exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many generation requests. Please try again in a few minutes."
  }
}
```
- `503 Service Unavailable`: AI service unavailable
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

**Note**: When AI generation fails, the error is logged to `generation_error_logs` table with error details for analytics and debugging.

---

#### 2.2.2. Get User's Generations

**Endpoint**: `GET /api/generations`

**Description**: Retrieves paginated list of user's generation sessions with analytics data.

**Authentication**: Not required in dev mode

**Query Parameters**:
- `page` (optional, integer, default: 1): Page number
- `limit` (optional, integer, default: 20, max: 100): Items per page

**Request Headers**: None required in dev mode

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Response Body** (200 OK):
```json
{
  "data": [
    {
      "id": 46,
      "user_id": "uuid-string",
      "model": "gpt-4",
      "generation_duration": 3450,
      "generated_count": 5,
      "accepted_unedited_count": 3,
      "accepted_edited_count": 1,
      "source_text_length": 245,
      "created_at": "2025-11-26T10:30:00Z",
      "acceptance_rate": 0.8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 2,
    "total_items": 35
  }
}
```

**Note**: `acceptance_rate` is calculated as `(accepted_unedited_count + accepted_edited_count) / generated_count`.

**Error Responses**:
None specific (standard error format applies if needed)

---

#### 2.2.3. Get Single Generation

**Endpoint**: `GET /api/generations/:id`

**Description**: Retrieves details of a specific generation session including associated flashcards.

**Authentication**: Not required in dev mode

**URL Parameters**:
- `id` (required, integer): Generation ID

**Request Headers**: None required in dev mode

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Response Body** (200 OK):
```json
{
  "data": {
    "id": 46,
    "user_id": "uuid-string",
    "model": "gpt-4",
    "generation_duration": 3450,
    "generated_count": 5,
    "accepted_unedited_count": 3,
    "accepted_edited_count": 1,
    "source_text_length": 245,
    "created_at": "2025-11-26T10:30:00Z",
    "updated_at": "2025-11-26T10:35:00Z",
    "flashcards": [
      {
        "id": 125,
        "front": "What is photosynthesis?",
        "back": "The process by which plants use sunlight, water, and CO2 to create oxygen and sugar",
        "source": "ai_generated",
        "created_at": "2025-11-26T10:32:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `404 Not Found`: Generation not found

---

### 2.3. Generation Error Logs Resource (Internal/Admin)

#### 2.3.1. List Generation Error Logs

**Endpoint**: `GET /api/generation-error-logs`

**Description**: Retrieves paginated list of generation error logs for troubleshooting and analytics. This endpoint is intended for admin users or internal monitoring. It helps track AI generation failures and identify patterns.

**Authentication**: Not required in dev mode (Admin access recommended for production)

**Query Parameters**:
- `page` (optional, integer, default: 1): Page number
- `limit` (optional, integer, default: 20, max: 100): Items per page
- `user_id` (optional, uuid): Filter by specific user (admin only)
- `model` (optional, string): Filter by AI model
- `from_date` (optional, ISO 8601 date): Filter errors from this date
- `to_date` (optional, ISO 8601 date): Filter errors until this date

**Request Headers**: None required in dev mode

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Response Body** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid-string",
      "model": "gpt-4",
      "source_text_hash": "a3f5d8e9c2b1...",
      "source_text_length": 245,
      "error_code": "RATE_LIMIT_EXCEEDED",
      "error_message": "OpenRouter API rate limit exceeded",
      "created_at": "2025-11-26T10:30:00Z"
    },
    {
      "id": 122,
      "user_id": "uuid-string-2",
      "model": "gpt-4",
      "source_text_hash": "b2e4c7a8d1f3...",
      "source_text_length": 1850,
      "error_code": "API_ERROR",
      "error_message": "OpenRouter API returned 500 error",
      "created_at": "2025-11-26T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 3,
    "total_items": 58
  }
}
```

**Use Cases**:
- Monitor AI generation failure rates
- Identify problematic source texts (via hash)
- Track API errors by model
- Analyze error patterns over time
- Debug user-reported generation issues

**Error Responses**:
None specific (standard error format applies if needed)
- `403 Forbidden`: User lacks admin permissions (if admin-only in production)
- `400 Bad Request`: Invalid query parameters
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid date format for from_date parameter"
  }
}
```

**Note**: For MVP, this endpoint returns only the current user's error logs. In production with admin roles, it can be extended to allow filtering by any user_id.

---

### 2.4. Analytics Resource (Internal/Admin)

#### 2.4.1. Get User Analytics

**Endpoint**: `GET /api/analytics/user`

**Description**: Retrieves user's statistics and success metrics. This endpoint supports the PRD success metrics tracking.

**Authentication**: Not required in dev mode

**Request Headers**: None required in dev mode

**Note**: In production, this endpoint will require `Authorization: Bearer <jwt_token>` header.

**Response Body** (200 OK):
```json
{
  "data": {
    "total_flashcards": 97,
    "flashcards_by_source": {
      "manual": 20,
      "ai_generated": 55,
      "ai_generated_edited": 22
    },
    "ai_adoption_rate": 0.794,
    "total_generations": 15,
    "average_acceptance_rate": 0.82,
    "created_at": "2025-10-15T08:00:00Z"
  }
}
```

**Calculated Metrics**:
- `ai_adoption_rate`: `(ai_generated + ai_generated_edited) / total_flashcards`
- `average_acceptance_rate`: Average of all generation acceptance rates

**Error Responses**:
None specific (standard error format applies if needed)

---
## 3. Authentication and Authorization

### 3.1. Development Mode (Current)

**Status**: Authentication is **NOT IMPLEMENTED** in development mode

**Implementation**:
- All endpoints work without authentication
- No JWT tokens required
- Hardcoded user ID used for all operations: `00000000-0000-0000-0000-000000000001`
- RLS policies are disabled

### 3.2. Production Mode (Future)

**Provider**: Supabase Auth  
**Method**: JWT Bearer Token

All endpoints (except authentication endpoints) will require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

See Section 11 for migration steps.

### 3.3. Authentication Endpoints (Production Only - Supabase Managed)

**Note**: These endpoints are NOT used in development mode. They will be enabled in production.

These endpoints are provided by Supabase Auth and don't require custom implementation:

#### Sign Up
```
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Sign In
```
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Sign Out
```
POST /auth/v1/logout
Authorization: Bearer <jwt_token>
```

#### Get Current User
```
GET /auth/v1/user
Authorization: Bearer <jwt_token>
```

#### Password Reset Request
```
POST /auth/v1/recover
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 3.4. Authorization - Row Level Security (Production Only)

**Development Mode**: RLS is **DISABLED**. All users can access all data using hardcoded user ID.

**Production Mode**: All data access will be protected by PostgreSQL Row Level Security (RLS) policies defined in the database schema.

**Production Enforcement**:
- Every query automatically filters by `user_id = auth.uid()`
- Users can only access their own flashcards, generations, and error logs
- Supabase client automatically includes user context from JWT token

**RLS Policies** (defined in schema, but currently disabled):
- `SELECT`: Users can view only their own data
- `INSERT`: Users can create only their own data
- `UPDATE`: Users can modify only their own data
- `DELETE`: Users can delete only their own data

### 3.5. Security Headers

All API responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
---

## 4. Validation and Business Logic

### 4.1. Validation Rules

#### Flashcards
| Field | Rules | Error Message |
|-------|-------|---------------|
| front | Required, 1-200 chars, not empty/whitespace | "Front must be between 1 and 200 characters and cannot be empty or whitespace only" |
| back | Required, 1-500 chars, not empty/whitespace | "Back must be between 1 and 500 characters and cannot be empty or whitespace only" |
| source | Required, enum (manual, ai_generated, ai_generated_edited) | "Source must be one of: manual, ai_generated, ai_generated_edited" |
| generation_id | REQUIRED for ai_generated/ai_generated_edited, MUST be null for manual, must exist in database | "generation_id is required for AI-generated flashcards" / "generation_id must be null for manual flashcards" / "Invalid generation_id" |

#### Generations
| Field | Rules | Error Message |
|-------|-------|---------------|
| source_text | Required, 100-10,000 chars | "Source text must be between 100 and 10,000 characters" |
| model | Optional, max 50 chars | "Model name must not exceed 50 characters" |

### 4.2. Business Logic Implementation

#### BL-1: AI Generation Flow
```
1. Validate source text length (100-10,000 characters)
2. Calculate MD5 hash: md5(source_text)
3. Call OpenRouter API with prompt template
4. Parse AI response into candidates array
6. Validate each candidate (front: 1-200, back: 1-500)
7. Create generation record:
   - generated_count = candidates.length
   - generation_duration = (end_time - start_time) in ms
   - accepted_unedited_count = 0
   - accepted_edited_count = 0
8. Return generation_id + candidates (not saved)
```

#### BL-2: Accept Single Flashcard
```
1. Validate front/back according to rules
2. Validate source is one of: manual, ai_generated, ai_generated_edited
3. Validate generation_id based on source:
   - If source = 'manual': generation_id MUST be null (error if not)
   - If source = 'ai_generated' or 'ai_generated_edited': 
     - generation_id MUST be provided (error if null)
     - generation_id MUST exist in database (error if not found)
4. Get user_id:
   - Dev mode: Use DEFAULT_USER_ID from src/db/supabase.client.ts
   - Production: Use user_id from JWT (locals.user.id)
5. Insert flashcard with user_id and provided source value
6. If source is AI-generated, update generation record:
   - If source = 'ai_generated': INCREMENT generations.accepted_unedited_count
   - If source = 'ai_generated_edited': INCREMENT generations.accepted_edited_count
7. Return created flashcard
```

#### BL-3: Bulk Accept Flashcards
```
1. Validate generation_id exists in database
2. Validate all flashcards before creating any:
   - Each flashcard must have source = 'ai_generated' or 'ai_generated_edited'
   - Validate front/back for each flashcard
3. Start database transaction
4. For each flashcard:
   - Insert flashcard with provided source value and generation_id
5. Update generation record:
   - accepted_unedited_count += count(where source = 'ai_generated')
   - accepted_edited_count += count(where source = 'ai_generated_edited')
6. Commit transaction
7. Return all created flashcards
```

#### BL-4: Error Logging
```
When POST /api/generations fails:
1. Catch error from OpenRouter API
2. Extract error_code and error_message
3. Get user_id (DEFAULT_USER_ID in dev mode, or from JWT in production)
4. Create generation_error_logs record:
   - user_id
   - model used
   - source_text_hash
   - source_text_length
   - error_code
   - error_message
5. Return user-friendly error message (not technical details)
```

#### BL-5: Update Flashcard
```
1. Verify flashcard exists:
   - Dev mode: Check flashcard belongs to DEFAULT_USER_ID
   - Production: RLS automatically filters by current user
2. Validate at least one field (front or back) is provided
3. Validate provided fields:
   - front: 1-200 chars, not empty/whitespace only
   - back: 1-500 chars, not empty/whitespace only
4. Determine new source value based on current source:
   - If current source = 'ai_generated': new source = 'ai_generated_edited'
   - If current source = 'ai_generated_edited': keep 'ai_generated_edited'
   - If current source = 'manual': keep 'manual'
5. Update flashcard with new values and source
6. updated_at timestamp updated automatically by database trigger
7. Return updated flashcard
```

### 4.3. Rate Limiting

To prevent abuse and manage AI API costs:

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| POST /api/generations | 10 requests | per minute per user |
| POST /api/flashcards | 100 requests | per minute per user |
| POST /api/flashcards/bulk | 20 requests | per minute per user |
| GET /api/flashcards | 100 requests | per minute per user |
| Other endpoints | 200 requests | per minute per user |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1732622400
```

### 4.4. Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { }
  }
}
```

**Error Codes**:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User lacks permission for this resource
- `VALIDATION_ERROR`: Request data validation failed
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `GENERATION_FAILED`: AI generation error
- `SERVICE_UNAVAILABLE`: External service unavailable
- `INTERNAL_ERROR`: Unexpected server error

---

## 5. Performance Considerations

### 5.1. Database Indexing

The following indexes (defined in database schema) optimize API performance:

- `idx_flashcards_user_created`: Optimizes `GET /api/flashcards` (user's flashcards sorted by date)
- `idx_flashcards_generation`: Optimizes flashcard lookup by generation_id
- `idx_generations_user_created`: Optimizes `GET /api/generations`
- `idx_generations_hash`: Optimizes duplicate generation detection

### 5.2. Pagination

All list endpoints support pagination to prevent large data transfers:
- Default page size: 20 items
- Maximum page size: 100 items
- Cursor-based pagination can be implemented post-MVP for better performance

### 5.3. Caching Strategy

**Client-side caching**:
- Flashcard lists: Cache with short TTL (30 seconds)
- Single flashcard: Cache until mutation
- Generations: Cache until new generation created

**Server-side caching** (optional optimization):
- Generation candidates: Cache by source_text_hash for 5 minutes
- User analytics: Cache for 60 seconds

### 5.4. Database Connection Pooling

Supabase handles connection pooling automatically. Recommended settings:
- Pool size: 20 connections
- Idle timeout: 10 minutes

---

## 6. API Versioning

**Current Version**: v1  
**Strategy**: URL path versioning (e.g., `/api/v1/flashcards`)

For MVP, version prefix is optional. Post-MVP, when breaking changes are introduced:
- New version: `/api/v2/flashcards`
- Old version: `/api/v1/flashcards` (maintained for 6 months)

---


## 8. Success Metrics Support

The API directly supports PRD success metrics:

### Metric 6.1: AI Generation Quality (75% acceptance rate)

**Endpoint**: `GET /api/analytics/user`

**Calculation**:
```
acceptance_rate = (accepted_unedited_count + accepted_edited_count) / generated_count

Target: acceptance_rate >= 0.75
```

**Data Source**: `generations` table aggregated across all user sessions

### Metric 6.2: AI Adoption (75% of flashcards from AI)

**Endpoint**: `GET /api/analytics/user`

**Calculation**:
```
ai_adoption_rate = 
  COUNT(flashcards WHERE source IN ('ai_generated', 'ai_generated_edited')) / 
  COUNT(flashcards)

Target: ai_adoption_rate >= 0.75
```

**Data Source**: `flashcards.source` field

### 10.2. CORS Configuration

For Astro application running on same domain:
- Allow credentials: true
- Allow origin: Same origin or specified domains
- Allow methods: GET, POST, PATCH, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization

### 10.3. Monitoring and Logging

**Logging Strategy**:
- Info: All successful API calls (method, path, user_id, duration)
- Warning: Rate limit hits, validation errors
- Error: Generation failures, database errors, unexpected errors

**Monitoring Metrics**:
- API response times by endpoint
- Error rates by endpoint
- Generation success/failure rates
- Active user count
- Database query performance

**Tools**: Consider Sentry for error tracking, LogRocket for session replay

---

## 11. Migration from Dev Mode to Production

When ready to enable authentication and security, follow these steps:

### 11.1. Enable Supabase Auth

1. **Start Supabase** (if using local development):
   ```bash
   supabase start
   ```
   This automatically creates the `auth.users` table and auth schema.

2. **Create a test user**:
   ```bash
   # Using Supabase Studio: http://localhost:54323
   # Navigate to Authentication > Users > Add User
   # Or use the API:
   curl -X POST 'http://localhost:54321/auth/v1/signup' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

### 11.2. Update Database - Enable RLS

```sql
-- Enable Row Level Security on all tables
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

The RLS policies should already be defined in your migrations (see database schema plan).

### 11.3. Update API Implementation

1. **Update Supabase client to handle auth**:
   ```typescript
   // src/db/supabase.client.ts
   import { createClient } from "@supabase/supabase-js";
   import type { Database } from "./database.types";

   export const createSupabaseClient = (accessToken?: string) => {
     const supabaseUrl = import.meta.env.SUPABASE_URL;
     const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
     
     return createClient<Database>(supabaseUrl, supabaseAnonKey, {
       global: {
         headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
       }
     });
   };
   ```

2. **Update middleware to extract user from JWT**:
   ```typescript
   // src/middleware/index.ts
   import { defineMiddleware } from "astro:middleware";
   import { createSupabaseClient } from "../db/supabase.client";

   export const onRequest = defineMiddleware(async (context, next) => {
     const authHeader = context.request.headers.get('Authorization');
     const token = authHeader?.replace('Bearer ', '');
     
     const supabase = createSupabaseClient(token);
     const { data: { user }, error } = await supabase.auth.getUser();
     
     context.locals.supabase = supabase;
     context.locals.user = user;
     
     return next();
   });
   ```

3. **Add auth checks to API endpoints**:
   ```typescript
   // Example: src/pages/api/flashcards/index.ts
   import type { APIRoute } from 'astro';

   export const GET: APIRoute = async ({ locals }) => {
     // Check authentication
     if (!locals.user) {
       return new Response(
         JSON.stringify({
           error: {
             code: 'UNAUTHORIZED',
             message: 'Authentication required'
           }
         }),
         { status: 401, headers: { 'Content-Type': 'application/json' } }
       );
     }

     // Use locals.user.id instead of hardcoded DEV_USER_ID
     const { data, error } = await locals.supabase
       .from('flashcards')
       .select('*')
       .order('created_at', { ascending: false });

     // RLS automatically filters by user_id
     return new Response(JSON.stringify({ data }), {
       status: 200,
       headers: { 'Content-Type': 'application/json' }
     });
   };
   ```

4. **Remove hardcoded user IDs**:
   - Replace `DEFAULT_USER_ID` constant with `locals.user.id`
   - Let RLS policies handle user_id filtering automatically
   - Remove manual user_id filters from queries (RLS handles this)

### 11.4. Update API Responses

- Add 401 Unauthorized responses where authentication fails
- Update error messages to mention authentication requirements
- Update documentation to show required Authorization headers

### 11.5. Frontend Changes

Update your frontend to:
1. Handle user sign up/sign in
2. Store JWT token (Supabase handles this automatically)
3. Include `Authorization: Bearer <token>` header in all API requests
4. Handle 401 errors and redirect to login

### 11.6. Testing with Authentication

```bash
# 1. Get JWT token
curl -X POST 'http://localhost:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Extract access_token from response

# 2. Use token in API requests
curl -X GET 'http://localhost:4321/api/flashcards' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Appendix A: Example AI Generation Prompt Template

```
You are a flashcard generation assistant. Given the following text, create educational flashcards that help users learn and retain the key concepts.

SOURCE TEXT:
{source_text}

Generate 5-10 high-quality flashcards following these rules:
1. Each flashcard must have a clear question (front) and concise answer (back)
2. Front side: Maximum 200 characters
3. Back side: Maximum 500 characters
4. Focus on key concepts, definitions, facts, and relationships
5. Questions should be specific and answerable
6. Answers should be clear and complete
7. Avoid overly simple or trivial flashcards
8. Ensure variety in question types (what, why, how, when, etc.)

Return the flashcards as a JSON array:
[
  {
    "front": "Question text here",
    "back": "Answer text here"
  }
]
```

---

## Appendix B: HTTP Status Code Usage

| Code | Usage |
|------|-------|
| 200 OK | Successful GET, PATCH, DELETE requests |
| 201 Created | Successful POST requests creating resources |
| 400 Bad Request | Validation errors, malformed requests |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Valid auth but insufficient permissions |
| 404 Not Found | Resource doesn't exist or doesn't belong to user |
| 413 Payload Too Large | Request body exceeds size limits |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server errors |
| 503 Service Unavailable | External service (AI, database) unavailable |

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-26  
**Status**: Ready for Implementation

