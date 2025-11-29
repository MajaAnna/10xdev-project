# REST API Plan - AI Cards MVP

## Overview

This document defines the complete REST API specification for the AI Cards application MVP. The API is designed to work with Supabase as the backend, following RESTful principles and implementing Row Level Security (RLS) for data protection.

**Base URL**: `/api`  
**Authentication**: JWT Bearer Token (Supabase Auth)  
**Content Type**: `application/json`

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

**Authentication**: Required

**Query Parameters**:
- `page` (optional, integer, default: 1): Page number for pagination
- `limit` (optional, integer, default: 20, max: 100): Number of items per page
- `source` (optional, enum): Filter by source type (`manual`, `ai_generated`, `ai_generated_edited`)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
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

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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
- `401 Unauthorized`: Missing or invalid JWT token
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

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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
- `401 Unauthorized`: Missing or invalid JWT token
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

**Authentication**: Required

**URL Parameters**:
- `id` (required, integer): Flashcard ID

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Flashcard not found or doesn't belong to user
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

**Authentication**: Required

**URL Parameters**:
- `id` (required, integer): Flashcard ID

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Flashcard not found or doesn't belong to user
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

**Authentication**: Required

**URL Parameters**:
- `id` (required, integer): Flashcard ID

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Flashcard not found or doesn't belong to user
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

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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
2. Calculate SHA-256 hash of source text
3. Check for duplicate recent generation (optional optimization - if same hash exists in last 5 minutes, return cached results or error)
4. Call OpenRouter API with source text
5. Parse AI response into flashcard candidates
6. Create generation log record with:
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
- `401 Unauthorized`: Missing or invalid JWT token
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

**Authentication**: Required

**Query Parameters**:
- `page` (optional, integer, default: 1): Page number
- `limit` (optional, integer, default: 20, max: 100): Items per page

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token

---

#### 2.2.3. Get Single Generation

**Endpoint**: `GET /api/generations/:id`

**Description**: Retrieves details of a specific generation session including associated flashcards.

**Authentication**: Required

**URL Parameters**:
- `id` (required, integer): Generation ID

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Generation not found or doesn't belong to user

---

### 2.3. Generation Error Logs Resource (Internal/Admin)

#### 2.3.1. List Generation Error Logs

**Endpoint**: `GET /api/generation-error-logs`

**Description**: Retrieves paginated list of generation error logs for troubleshooting and analytics. This endpoint is intended for admin users or internal monitoring. It helps track AI generation failures and identify patterns.

**Authentication**: Required (Admin access recommended for production)

**Query Parameters**:
- `page` (optional, integer, default: 1): Page number
- `limit` (optional, integer, default: 20, max: 100): Items per page
- `user_id` (optional, uuid): Filter by specific user (admin only)
- `model` (optional, string): Filter by AI model
- `from_date` (optional, ISO 8601 date): Filter errors from this date
- `to_date` (optional, ISO 8601 date): Filter errors until this date

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token
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

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

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
- `401 Unauthorized`: Missing or invalid JWT token

---
## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Provider**: Supabase Auth  
**Method**: JWT Bearer TokenAll endpoints (except authentication endpoints) require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### 3.2. Authentication Endpoints (Supabase Managed)

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

### 3.3. Authorization (Row Level Security)

**Implementation**: All data access is protected by PostgreSQL Row Level Security (RLS) policies defined in the database schema.

**Enforcement**:
- Every query automatically filters by `user_id = auth.uid()`
- Users can only access their own flashcards, generations, and error logs
- Supabase client automatically includes user context from JWT token

**RLS Policies**:
- `SELECT`: Users can view only their own data
- `INSERT`: Users can create only their own data
- `UPDATE`: Users can modify only their own data
- `DELETE`: Users can delete only their own data

### 3.4. Security Headers

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
2. Calculate SHA-256 hash: sha256(source_text)
4. Call OpenRouter API with prompt template
5. Parse AI response into candidates array
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
4. Insert flashcard with user_id from JWT and provided source value
5. If source is AI-generated, update generation record:
   - If source = 'ai_generated': INCREMENT generations.accepted_unedited_count
   - If source = 'ai_generated_edited': INCREMENT generations.accepted_edited_count
6. Return created flashcard
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
3. Create generation_error_logs record:
   - user_id from JWT
   - model used
   - source_text_hash
   - source_text_length
   - error_code
   - error_message
4. Return user-friendly error message (not technical details)
```

#### BL-5: Update Flashcard
```
1. Verify flashcard exists and belongs to current user (via RLS)
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

## 7. Testing Considerations

### 7.1. Test User Accounts

For development and testing, create test users:
- `test@example.com` / `testpass123`
- Use Supabase Auth to create test users
- Seed database with sample flashcards and generations

### 7.2. Mock AI Responses

For testing without AI API costs:
- Create mock generation endpoint: `POST /api/generations/mock`
- Returns predefined candidates without calling OpenRouter
- Use feature flag to enable/disable

### 7.3. End-to-End Test Scenarios

1. **Complete AI Generation Flow**:
   - Generate candidates → Review → Accept some → Reject some → Verify database

2. **Manual Flashcard Management**:
   - Create → List → Update → Delete → Verify

4. **Error Handling**:
   - Invalid input → Rate limit → Generation failure → Auth failure

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

## 10. Deployment and Environment Configuration

### 10.1. Environment Variables

Required environment variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_API_URL=https://openrouter.ai/api/v1

# Application
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

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

