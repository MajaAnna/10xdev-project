# API Endpoint Implementation Plan: POST /api/generations

## 1. Endpoint Overview

The `POST /api/generations` endpoint generates flashcard candidates from source text using AI models available through the OpenRouter API. The endpoint accepts source text and an optional AI model name, calls the AI service, creates a generation session log in the database, and returns temporary flashcard candidates (which are not saved to the database until accepted by the user).

**Key Features**:
- Validates source text length (100-10,000 characters)
- Calculates SHA-256 hash of source text for deduplication and privacy
- Communicates with OpenRouter API asynchronously
- Creates a record in the `generations` table with session metrics
- Logs errors to the `generation_error_logs` table in case of failure
- Returns temporary candidates without saving them to the database, along with their count
- Implements Supabase Auth authentication for production use

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
```
/api/generations
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token>  (Production only)
```

**Note**: In development mode, the `Authorization` header is optional. In production, it is required.

### Parameters

**Request Body (JSON)**:

**Required**:
- `source_text` (string, 100-10,000 characters): Source text to generate flashcards from

**Optional**:
- `model` (string, default: "gpt-4"): AI model to use for generation

### Example Request Body
```json
{
  "source_text": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar. It occurs in the chloroplasts of plant cells...",
  "model": "gpt-4"
}
```

## 3. Types Used

### Command Models
- **`GenerateFlashcardsCommand`** (from `src/types.ts`):
  ```typescript
  interface GenerateFlashcardsCommand {
    source_text: string;
    model?: string;
  }
  ```

### Response DTOs
- **`GenerationResponseDto`** (from `src/types.ts`):
  ```typescript
  interface GenerationResponseDto {
    generation_id: number;
    model: string;
    generation_duration: number;
    generated_count: number;
    candidates: FlashcardCandidateDto[];
  }
  ```

- **`FlashcardCandidateDto`** (from `src/types.ts`):
  ```typescript
  interface FlashcardCandidateDto {
    front: string;
    back: string;
  }
  ```

- **`ApiResponseDto<T>`** (from `src/types.ts`):
  ```typescript
  interface ApiResponseDto<T> {
    data: T;
  }
  ```

### Error DTOs
- **`ErrorResponseDto`** (from `src/types.ts`):
  ```typescript
  interface ErrorResponseDto {
    error: {
      code: string;
      message: string;
      details?: ValidationErrorDetailDto[] | Record<string, unknown>;
    };
  }
  ```

### Database Entities
- **`GenerationEntity`** (from `src/types.ts`): For interactions with the `generations` table
- **`GenerationErrorLogEntity`** (from `src/types.ts`): For error logging

## 4. Response Details

### Success (201 Created)
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
      }
    ]
  }
}
```

### Errors

#### 400 Bad Request - Validation Error
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

#### 401 Unauthorized - Missing or Invalid Token (Production)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid access token."
  }
}
```

#### 429 Too Many Requests - Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many generation requests. Please try again in a few minutes."
  }
}
```

#### 500 Internal Server Error - Generation Failed
```json
{
  "error": {
    "code": "GENERATION_FAILED",
    "message": "An error occurred while generating flashcards. Please try again later."
  }
}
```

#### 503 Service Unavailable - AI Service Unavailable
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

## 5. Data Flow

### Flow Diagram
```
1. Request arrives at POST /api/generations endpoint
   ↓
2. Authentication (Production mode)
   - Verify JWT token from Authorization header
   - Extract user_id from token
   - If invalid/missing: Return 401 Unauthorized
   ↓
3. Input validation (Zod schema)
   - Validate source_text (100-10,000 characters)
   - Validate model (optional, default "gpt-4")
   ↓
4. Call Generation Service (generation.service.ts)
   - Calculate SHA-256 hash of source text
   - Prepare AI prompt
   - Send async request to OpenRouter API with source_text
   - Wait for response (with 60s timeout)
   ↓
5a. Success: Parse AI response
   - Extract flashcard candidates (front/back)
   - Validate response structure
   ↓
6a. Create record in generations table
   - generation_duration (duration in ms)
   - generated_count (number of candidates)
   - source_text_hash and source_text_length
   - accepted_unedited_count = 0
   - accepted_edited_count = 0
   ↓
7a. Return 201 Created response
   - generation_id
   - model
   - generation_duration
   - generated_count
   - candidates[]
   
5b. Error: Handle failure
   ↓
6b. Create record in generation_error_logs table
   - error_code (from OpenRouter or internal)
   - error_message
   - source_text_hash and source_text_length
   - model
   ↓
7b. Return error response (429, 500, 503)
```

### External Service Interactions

#### OpenRouter API
- **URL**: `https://openrouter.ai/api/v1/chat/completions`
- **Method**: POST
- **Authorization**: Bearer token (API key from env)
- **Timeout**: 60 seconds
- **Headers**:
  ```
  Authorization: Bearer ${OPENROUTER_API_KEY}
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are a flashcard generator. Generate flashcards from the provided text..."
      },
      {
        "role": "user",
        "content": "<source_text>"
      }
    ]
  }
  ```

### Database Interactions

#### Supabase - generations Table
**Operation**: INSERT
```sql
INSERT INTO generations (
  user_id,
  model,
  generation_duration,
  generated_count,
  accepted_unedited_count,
  accepted_edited_count,
  source_text_hash,
  source_text_length
) VALUES (?, ?, ?, ?, 0, 0, ?, ?)
RETURNING id;
```

#### Supabase - generation_error_logs Table
**Operation**: INSERT (on error)
```sql
INSERT INTO generation_error_logs (
  user_id,
  model,
  source_text_hash,
  source_text_length,
  error_code,
  error_message
) VALUES (?, ?, ?, ?, ?, ?);
```

## 6. Security Considerations

### Authentication and Authorization

#### Supabase Auth Implementation

**Development Mode**:
- Authentication is optional for easier testing
- Endpoint works without `Authorization` header
- `user_id` will use a hardcoded test UUID: `00000000-0000-0000-0000-000000000001`
- **Warning**: This should NEVER be used in production

**Production Mode** (Initial Implementation):
- **Required JWT Bearer token** in `Authorization` header
- Token verification handled by Supabase Auth
- Implementation steps:
  1. Extract token from `Authorization: Bearer <token>` header
  2. Use Supabase client to verify token: `supabase.auth.getUser(token)`
  3. If token is invalid/expired: Return 401 Unauthorized
  4. If token is valid: Extract `user.id` from response
  5. Use `user_id` for all database operations

**Implementation in Endpoint**:
```typescript
// Development mode: Use hardcoded test user ID
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// Check if running in production mode
const isProduction = import.meta.env.PROD;
let userId: string;

if (isProduction) {
  // Extract token from Authorization header
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please provide a valid access token.",
        },
      } satisfies ErrorResponseDto),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Verify token with Supabase
  const { data: { user }, error: authError } = await locals.supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired access token.",
        },
      } satisfies ErrorResponseDto),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Use user.id for subsequent operations
  userId = user.id;
} else {
  // Development mode: Use hardcoded test user ID
  userId = DEV_USER_ID;
}
```

### Input Validation

#### Zod Schema
```typescript
const generateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(100, "Source text must be at least 100 characters")
    .max(10000, "Source text must not exceed 10,000 characters")
    .trim(),
  model: z.string()
    .optional()
    .default("gpt-4")
});
```

#### Additional Validation Safeguards
- **Trim whitespace**: Remove white characters before length validation
- **Sanitization**: Check that text doesn't contain only whitespace
- **Type checking**: Zod automatically validates types
- **SQL Injection prevention**: Use Supabase SDK with parameterized queries

### API Key Security

#### OpenRouter API Key
- **Storage**: In environment variable `OPENROUTER_API_KEY`
- **Access**: Server-side only (Astro API routes)
- **Verification**: Check key exists before calling API
- **Never expose**: Key must never reach client code

### Data Privacy

#### Source Text Hashing
- **Algorithm**: SHA-256
- **Purpose**: Deduplication and analytics without storing full text
- **Implementation**: Native Node.js `crypto.createHash('sha256')`

#### We Don't Store Full Source Text
- Only hash and length in `generations` table
- Only hash and length in `generation_error_logs` table
- Full text is only sent to OpenRouter API

### Rate Limiting

#### Protection Against Abuse
- **OpenRouter**: Built-in limits in the service
- **Handle 429**: Properly forward error to user
- **Future enhancement**: Implement custom per-user rate limiting

## 7. Error Handling

### Error Scenarios and Status Codes

#### 1. Validation Errors (400 Bad Request)

**Scenario A**: Source text too short
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Source text must be between 100 and 10,000 characters",
    details: {
      field: "source_text",
      current_length: 45,
      min_length: 100,
      max_length: 10000
    }
  }
}
```

**Scenario B**: Source text too long
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Source text must be between 100 and 10,000 characters",
    details: {
      field: "source_text",
      current_length: 12000,
      min_length: 100,
      max_length: 10000
    }
  }
}
```

**Scenario C**: Invalid JSON format
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request body format",
    details: {
      parse_error: "Expected JSON object"
    }
  }
}
```

**Scenario D**: Missing required field
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Missing required field: source_text",
    details: {
      field: "source_text"
    }
  }
}
```

#### 2. Authentication Errors (401 Unauthorized)

**Scenario A**: Missing Authorization header (Production)
```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required. Please provide a valid access token."
  }
}
```

**Scenario B**: Invalid or expired token (Production)
```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Invalid or expired access token."
  }
}
```

**Logging**: NO - These are user authentication errors, not system errors

#### 3. Rate Limit Exceeded (429 Too Many Requests)

**Scenario**: OpenRouter API returns 429
```typescript
{
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many generation requests. Please try again in a few minutes."
  }
}
```

**Logging**: YES - Save to `generation_error_logs`

#### 4. AI Service Unavailable (503 Service Unavailable)

**Scenario A**: OpenRouter API doesn't respond (timeout)
```typescript
{
  error: {
    code: "SERVICE_UNAVAILABLE",
    message: "AI service is temporarily unavailable. Please try again later."
  }
}
```

**Scenario B**: OpenRouter API returns 503
```typescript
{
  error: {
    code: "SERVICE_UNAVAILABLE",
    message: "AI service is temporarily unavailable. Please try again later."
  }
}
```

**Logging**: YES - Save to `generation_error_logs`

#### 5. AI Generation Failed (500 Internal Server Error)

**Scenario A**: OpenRouter API returns malformed response structure
```typescript
{
  error: {
    code: "GENERATION_FAILED",
    message: "An error occurred while generating flashcards. Please try again later."
  }
}
```

**Scenario B**: Error parsing AI response
```typescript
{
  error: {
    code: "GENERATION_FAILED",
    message: "An error occurred while generating flashcards. Please try again later."
  }
}
```

**Scenario C**: Database write error
```typescript
{
  error: {
    code: "GENERATION_FAILED",
    message: "An error occurred while generating flashcards. Please try again later."
  }
}
```

**Scenario D**: Missing OpenRouter API key
```typescript
{
  error: {
    code: "GENERATION_FAILED",
    message: "AI service configuration error. Please contact support."
  }
}
```

**Logging**: YES - Save to `generation_error_logs` (except Scenario D - configuration error)

### Error Logging Strategy

#### What to Log to generation_error_logs
- **Rate limiting errors** (429)
- **Service unavailable errors** (503)
- **AI parsing errors** (500)
- **OpenRouter API errors** (4xx, 5xx)

#### What NOT to Log
- **Validation errors** (400) - User errors, not system errors
- **Authentication errors** (401) - User auth issues
- **Configuration errors** (missing API key) - Developer errors

#### Error Log Record Structure
```typescript
{
  user_id: string,               // DEV_USER_ID in dev mode, real user ID in production
  model: string,                 // Model that was attempted
  source_text_hash: string,      // SHA-256 hash
  source_text_length: number,
  error_code: string,            // e.g., "OPENROUTER_RATE_LIMIT", "OPENROUTER_TIMEOUT"
  error_message: string          // Full error message
}
```

### Try-Catch Blocks

#### Main Endpoint Function
```typescript
try {
  // Authentication
  // Validation
  // Call Generation Service
  // Return response
} catch (error) {
  // Handle all unexpected errors
  // Log to generation_error_logs (if applicable)
  // Return appropriate error to user
}
```

#### Generation Service
```typescript
try {
  // Call OpenRouter API
  // Parse response
  // Save to database
} catch (error) {
  if (error.status === 429) {
    throw new RateLimitError();
  }
  if (error.status === 503) {
    throw new ServiceUnavailableError();
  }
  if (error.name === 'AbortError') {
    throw new ServiceUnavailableError();
  }
  throw new GenerationFailedError();
}
```

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. OpenRouter API Call
- **Problem**: Long response time (can take several seconds)
- **Impact**: User waits for generation
- **Metric**: `generation_duration` in database
- **Mitigation**: 60-second timeout, async processing

#### 2. AI Response Parsing
- **Problem**: Large JSON responses to parse
- **Impact**: Minimal (parsing is fast)

#### 3. SHA-256 Hash Calculation
- **Problem**: Hashing long texts (up to 10,000 characters)
- **Impact**: Minimal (hashing is fast in Node.js)

#### 4. Database Write
- **Problem**: Network latency to Supabase
- **Impact**: Minimal (single INSERT)

### Optimization Strategies

#### 1. Timeout for API Call
```typescript
const OPENROUTER_TIMEOUT = 60000; // 60 seconds
```
- Set reasonable timeout for OpenRouter call
- If exceeded, return 503 Service Unavailable
- Prevents requests from hanging indefinitely

#### 2. Asynchronous Processing
- All I/O operations use async/await
- Non-blocking execution
- Better resource utilization

#### 3. Connection Pooling (Supabase)
- Supabase SDK automatically manages connection pooling
- No additional configuration needed

#### 4. Performance Monitoring
- **Metric**: `generation_duration` in `generations` table
- **Analytics**: Average generation time per model
- **Alerts**: If average time > 10 seconds, investigate

#### 5. Source Text Length Limit
- **Current**: 10,000 characters
- **Rationale**: 
  - Limits API costs (fewer tokens)
  - Reduces generation time
  - Decreases timeout risk

### Performance Metrics to Monitor

1. **Average generation time** (`avg(generation_duration)`)
2. **AI error count** (`count(*) from generation_error_logs`)
3. **Rate limit errors** (`count(*) where error_code = 'RATE_LIMIT_EXCEEDED'`)
4. **Service unavailable errors** (`count(*) where error_code LIKE '%UNAVAILABLE%'`)
5. **Acceptance rate** (calculated later when users accept flashcards)

## 9. Implementation Steps

### Phase 1: Structure and Types Preparation

#### Step 1.1: Create Zod Schema for Validation
**File**: `src/lib/schemas/generation.schemas.ts`

```typescript
import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(100, "Source text must be at least 100 characters")
    .max(10000, "Source text must not exceed 10,000 characters")
    .transform((val) => val.trim())
    .refine((val) => val.length >= 100, {
      message: "Source text must contain at least 100 non-whitespace characters",
    }),
  model: z.string().optional().default("gpt-4"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

#### Step 1.2: Create Custom Error Classes
**File**: `src/lib/errors/generation.errors.ts`

```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required. Please provide a valid access token.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends Error {
  constructor(message = "Too many generation requests. Please try again in a few minutes.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message = "AI service is temporarily unavailable. Please try again later.") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class GenerationFailedError extends Error {
  constructor(
    message = "An error occurred while generating flashcards. Please try again later.",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "GenerationFailedError";
  }
}
```

#### Step 1.3: Create Hash Utility
**File**: `src/lib/utils/hash.utils.ts`

```typescript
import crypto from "crypto";

/**
 * Calculates SHA-256 hash for the given text
 */
export function calculateSHA256Hash(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}
```

### Phase 2: Generation Service Implementation

#### Step 2.1: Create Generation Service
**File**: `src/lib/services/generation.service.ts`

This service integrates with the external AI service (OpenRouter) and handles:
- AI flashcard generation
- Database writes to `generations` table
- Error logging to `generation_error_logs` table

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardCandidateDto } from "../../types";
import {
  ServiceUnavailableError,
  RateLimitError,
  GenerationFailedError,
} from "../errors/generation.errors";
import { calculateSHA256Hash } from "../utils/hash.utils";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT = 60000; // 60 seconds

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GenerateFlashcardsResult {
  generation_id: number;
  model: string;
  generation_duration: number;
  generated_count: number;
  candidates: FlashcardCandidateDto[];
}

/**
 * Creates system prompt for AI flashcard generation
 */
function createSystemPrompt(): string {
  return `You are a flashcard generator. Generate flashcards from the provided text.
Return ONLY a JSON array of flashcard objects with "front" and "back" fields.
Each flashcard should test understanding of key concepts.
Generate between 3 and 10 flashcards depending on the content length and complexity.

Example output format:
[
  {"front": "What is X?", "back": "X is..."},
  {"front": "How does Y work?", "back": "Y works by..."}
]`;
}

/**
 * Calls OpenRouter API to generate flashcard candidates
 */
async function callOpenRouterAPI(
  sourceText: string,
  model: string
): Promise<FlashcardCandidateDto[]> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new GenerationFailedError("AI service configuration error. Please contact support.");
  }

  const requestBody: OpenRouterRequest = {
    model,
    messages: [
      {
        role: "system",
        content: createSystemPrompt(),
      },
      {
        role: "user",
        content: sourceText,
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle rate limiting
    if (response.status === 429) {
      throw new RateLimitError();
    }

    // Handle service unavailable
    if (response.status === 503) {
      throw new ServiceUnavailableError();
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new GenerationFailedError(
        `OpenRouter API returned status ${response.status}`,
        { status: response.status, body: errorText }
      );
    }

    const data: OpenRouterResponse = await response.json();

    // Parse AI response
    const candidates = parseAIResponse(data);

    return candidates;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new ServiceUnavailableError("AI service request timed out. Please try again later.");
    }

    // Re-throw custom errors
    if (
      error instanceof RateLimitError ||
      error instanceof ServiceUnavailableError ||
      error instanceof GenerationFailedError
    ) {
      throw error;
    }

    // Handle unexpected errors
    throw new GenerationFailedError("Unexpected error during AI generation", error);
  }
}

/**
 * Parses OpenRouter API response into flashcard candidates array
 */
function parseAIResponse(response: OpenRouterResponse): FlashcardCandidateDto[] {
  try {
    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices in AI response");
    }

    const content = response.choices[0].message.content;

    // Try to parse as JSON
    const candidates = JSON.parse(content);

    // Validate structure
    if (!Array.isArray(candidates)) {
      throw new Error("AI response is not an array");
    }

    if (candidates.length === 0) {
      throw new Error("AI returned empty candidates array");
    }

    // Validate each candidate
    const validatedCandidates: FlashcardCandidateDto[] = candidates.map((candidate, index) => {
      if (!candidate.front || !candidate.back) {
        throw new Error(`Candidate at index ${index} missing front or back field`);
      }

      if (typeof candidate.front !== "string" || typeof candidate.back !== "string") {
        throw new Error(`Candidate at index ${index} has invalid field types`);
      }

      return {
        front: candidate.front.trim(),
        back: candidate.back.trim(),
      };
    });

    return validatedCandidates;
  } catch (error) {
    throw new GenerationFailedError("Failed to parse AI response", error);
  }
}

/**
 * Creates a generation record in the database
 */
async function createGenerationRecord(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    model: string;
    generation_duration: number;
    generated_count: number;
    source_text_hash: string;
    source_text_length: number;
  }
): Promise<number> {
  const { data: result, error } = await supabase
    .from("generations")
    .insert({
      user_id: data.user_id,
      model: data.model,
      generation_duration: data.generation_duration,
      generated_count: data.generated_count,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash: data.source_text_hash,
      source_text_length: data.source_text_length,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create generation record: ${error.message}`);
  }

  if (!result) {
    throw new Error("Failed to create generation record: No result returned");
  }

  return result.id;
}

/**
 * Logs generation error to the database
 */
async function logGenerationError(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    model: string;
    source_text_hash: string;
    source_text_length: number;
    error_code: string;
    error_message: string;
  }
): Promise<void> {
  const { error } = await supabase.from("generation_error_logs").insert({
    user_id: data.user_id,
    model: data.model,
    source_text_hash: data.source_text_hash,
    source_text_length: data.source_text_length,
    error_code: data.error_code,
    error_message: data.error_message,
  });

  if (error) {
    // Don't throw here - logging errors should not break the response
    console.error("Failed to create generation error log:", error);
  }
}

/**
 * Main service function: Generates flashcards and saves generation to database
 * 
 * This function orchestrates the entire generation process:
 * 1. Calls OpenRouter API to generate flashcard candidates
 * 2. Saves successful generation to the database
 * 3. Returns generation result
 * 
 * In case of errors, the error is logged to generation_error_logs (handled by caller)
 */
export async function generateFlashcards(
  supabase: SupabaseClient,
  params: {
    source_text: string;
    model: string;
    user_id: string;
  }
): Promise<GenerateFlashcardsResult> {
  const startTime = Date.now();
  const sourceTextHash = calculateSHA256Hash(params.source_text);
  const sourceTextLength = params.source_text.length;

  try {
    // Call OpenRouter API asynchronously
    const candidates = await callOpenRouterAPI(params.source_text, params.model);

    // Calculate generation duration
    const generationDuration = Date.now() - startTime;

    // Create generation record
    const generationId = await createGenerationRecord(supabase, {
      user_id: params.user_id,
      model: params.model,
      generation_duration: generationDuration,
      generated_count: candidates.length,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
    });

    return {
      generation_id: generationId,
      model: params.model,
      generation_duration: generationDuration,
      generated_count: candidates.length,
      candidates,
    };
  } catch (error) {
    // Log error to database
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = "An unexpected error occurred";

    if (error instanceof RateLimitError) {
      errorCode = "RATE_LIMIT_EXCEEDED";
      errorMessage = error.message;
    } else if (error instanceof ServiceUnavailableError) {
      errorCode = "SERVICE_UNAVAILABLE";
      errorMessage = error.message;
    } else if (error instanceof GenerationFailedError) {
      errorCode = "GENERATION_FAILED";
      errorMessage = error.message;
    }

    // Log error (don't await - let it run in background)
    logGenerationError(supabase, {
      user_id: params.user_id,
      model: params.model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage,
    });

    // Re-throw error for endpoint to handle
    throw error;
  }
}
```

### Phase 3: API Endpoint Implementation

#### Step 3.1: Create API Endpoint
**File**: `src/pages/api/generations.ts`

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import type {
  GenerateFlashcardsCommand,
  GenerationResponseDto,
  ApiResponseDto,
  ErrorResponseDto,
} from "../../types";
import { generateFlashcardsSchema } from "../../lib/schemas/generation.schemas";
import { generateFlashcards } from "../../lib/services/generation.service";
import {
  UnauthorizedError,
  RateLimitError,
  ServiceUnavailableError,
  GenerationFailedError,
} from "../../lib/errors/generation.errors";
import { ZodError } from "zod";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Development mode: Use hardcoded test user ID
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
    
    // 1. Authentication (Production mode only)
    const isProduction = import.meta.env.PROD;
    let userId: string;

    if (isProduction) {
      // Extract token from Authorization header
      const authHeader = request.headers.get("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required. Please provide a valid access token.",
            },
          } satisfies ErrorResponseDto),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Verify token with Supabase
      const {
        data: { user },
        error: authError,
      } = await locals.supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid or expired access token.",
            },
          } satisfies ErrorResponseDto),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      userId = user.id;
    } else {
      // Development mode: Use hardcoded test user ID
      userId = DEV_USER_ID;
    }

    // 2. Parse request body
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

    // 3. Validate request body with Zod
    let validatedData: GenerateFlashcardsCommand;
    try {
      validatedData = generateFlashcardsSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: firstError.message,
              details: {
                field: firstError.path.join("."),
                min_length: 100,
                max_length: 10000,
              },
            },
          } satisfies ErrorResponseDto),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // 4. Generate flashcards with service
    const result = await generateFlashcards(locals.supabase, {
      source_text: validatedData.source_text,
      model: validatedData.model || "gpt-4",
      user_id: userId,
    });

    // 5. Return success response
    const responseData: GenerationResponseDto = {
      generation_id: result.generation_id,
      model: result.model,
      generation_duration: result.generation_duration,
      generated_count: result.generated_count,
      candidates: result.candidates,
    };

    return new Response(
      JSON.stringify({ data: responseData } satisfies ApiResponseDto<GenerationResponseDto>),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Return appropriate error response
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof ServiceUnavailableError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof GenerationFailedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "GENERATION_FAILED",
            message: error.message,
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Unexpected error
    console.error("Unexpected error in POST /api/generations:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "GENERATION_FAILED",
          message: "An unexpected error occurred while generating flashcards. Please try again later.",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Phase 4: Configuration and Environment Variables

#### Step 4.1: Add Environment Variable to .env
**File**: `.env` (local) and production configuration

```bash
# OpenRouter API
OPENROUTER_API_KEY=your_api_key_here
```

#### Step 4.2: Add Type to env.d.ts
**File**: `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  // ... other variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Phase 5: Documentation and Finalization

#### Step 5.1: Add JSDoc Comments to Key Functions
Ensure all public functions have JSDoc comments

#### Step 5.2: Update README (if exists)
Add information about the new endpoint to project documentation

#### Step 5.3: Code Review Checklist
- [ ] Zod validation works correctly
- [ ] All error scenarios are handled
- [ ] Errors are logged to `generation_error_logs`
- [ ] SHA-256 hash is calculated correctly
- [ ] OpenRouter API is called with 60s timeout
- [ ] Responses have correct status codes
- [ ] Response structure matches DTO types
- [ ] Environment variables are properly configured
- [ ] Early returns for errors
- [ ] Code is readable and well-commented
- [ ] Authentication with Supabase Auth is implemented
- [ ] Async/await is used for all I/O operations
- [ ] Generation service integrates AI calls and database operations
