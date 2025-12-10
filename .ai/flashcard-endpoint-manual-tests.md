# Manual Testing: POST /api/flashcards

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Ensure you have a generation record in the database (for AI-generated flashcard tests):
```bash
# First, create a generation via POST /api/generations
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.",
    "model": "openai/gpt-4o-mini"
  }'

# Note the generation_id from the response
```

---

## Test Cases

### ✅ Test 1: Create Manual Flashcard (Happy Path)

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual",
    "generation_id": null
  }'
```

**Expected Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "generation_id": null,
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual",
    "created_at": "2025-12-10T14:30:00Z",
    "updated_at": "2025-12-10T14:30:00Z"
  }
}
```

---

### ✅ Test 2: Create AI-Generated Flashcard (Unedited)

```bash
# Replace 1 with your actual generation_id
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source": "ai_generated",
    "generation_id": 1
  }'
```

**Expected Response (201 Created):**
```json
{
  "data": {
    "id": 2,
    "generation_id": 1,
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source": "ai_generated",
    "created_at": "2025-12-10T14:31:00Z",
    "updated_at": "2025-12-10T14:31:00Z"
  }
}
```

**Verify generation counts updated:**
```bash
# Check that accepted_unedited_count was incremented
# Query the database or check via GET /api/generations/1 (when implemented)
```

---

### ✅ Test 3: Create AI-Generated Flashcard (Edited)

```bash
# Replace 1 with your actual generation_id
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces, developed by Meta",
    "source": "ai_generated_edited",
    "generation_id": 15
  }'
```

**Expected Response (201 Created):**
```json
{
  "data": {
    "id": 3,
    "generation_id": 1,
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces, developed by Meta",
    "source": "ai_generated_edited",
    "created_at": "2025-12-10T14:32:00Z",
    "updated_at": "2025-12-10T14:32:00Z"
  }
}
```

---

## Error Test Cases

### ❌ Test 4: Missing Required Field (front)

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "back": "A typed superset of JavaScript",
    "source": "manual",
    "generation_id": null
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front is required"
      }
    ]
  }
}
```

---

### ❌ Test 5: Front Exceeds 200 Characters

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "back": "Test answer",
    "source": "manual",
    "generation_id": null
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front must not exceed 200 characters"
      }
    ]
  }
}
```

---

### ❌ Test 6: Empty Front After Trim

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "   ",
    "back": "Test answer",
    "source": "manual",
    "generation_id": null
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front must contain at least 1 non-whitespace character"
      }
    ]
  }
}
```

---

### ❌ Test 7: Invalid Source Enum

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript",
    "source": "invalid_source",
    "generation_id": null
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "source",
        "message": "Invalid enum value. Expected 'manual' | 'ai_generated' | 'ai_generated_edited', received 'invalid_source'"
      }
    ]
  }
}
```

---

### ❌ Test 8: Manual Flashcard with generation_id

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript",
    "source": "manual",
    "generation_id": 1
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "generation_id",
        "message": "generation_id must be null for manual flashcards and required for AI-generated flashcards"
      }
    ]
  }
}
```

---

### ❌ Test 9: AI Flashcard without generation_id

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "A JavaScript library",
    "source": "ai_generated",
    "generation_id": null
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "generation_id",
        "message": "generation_id must be null for manual flashcards and required for AI-generated flashcards"
      }
    ]
  }
}
```

---

### ❌ Test 10: Invalid generation_id (doesn't exist)

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "A JavaScript library",
    "source": "ai_generated",
    "generation_id": 99999
  }'
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "GENERATION_NOT_FOUND",
    "message": "Generation session not found"
  }
}
```

---

### ❌ Test 11: Invalid JSON

```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d 'invalid json here'
```

**Expected Response (400 Bad Request):**
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

---

## Verification Queries

After creating flashcards, verify in the database:

```sql
-- Check flashcards were created
SELECT * FROM flashcards ORDER BY created_at DESC LIMIT 5;

-- Check generation counts were updated
SELECT id, generated_count, accepted_unedited_count, accepted_edited_count 
FROM generations 
WHERE id = 1;

-- Verify flashcard belongs to default user
SELECT * FROM flashcards WHERE user_id = '00000000-0000-0000-0000-000000000001';
```

---

## Tips for Testing

1. **Use jq for pretty output:**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"front":"Test","back":"Answer","source":"manual","generation_id":null}' \
  | jq
```

2. **Save response to file:**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"front":"Test","back":"Answer","source":"manual","generation_id":null}' \
  -o response.json
```

3. **Include response headers:**
```bash
curl -i -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"front":"Test","back":"Answer","source":"manual","generation_id":null}'
```

4. **Verbose output for debugging:**
```bash
curl -v -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"front":"Test","back":"Answer","source":"manual","generation_id":null}'
```

