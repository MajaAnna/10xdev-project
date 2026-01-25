# Debugging Guide: POST /api/flashcards

## Step-by-Step Troubleshooting

### Step 1: Check if Server is Running

```bash
# Make sure dev server is running
curl http://localhost:4321/
```

If this fails, start the server:

```bash
npm run dev
```

---

### Step 2: Create a Generation First (Required for AI flashcards)

```bash
# Create a generation and capture the response
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "TypeScript is a typed superset of JavaScript. It adds static typing to JavaScript.",
    "model": "openai/gpt-4o-mini"
  }' | jq
```

**Expected response:**

```json
{
  "data": {
    "generation_id": 1, // ← NOTE THIS ID!
    "model": "openai/gpt-4o-mini",
    "generation_duration": 2.5,
    "generated_count": 3,
    "candidates": [{ "front": "...", "back": "..." }]
  }
}
```

**Important:** Save the `generation_id` from the response!

---

### Step 3: Verify Generation Was Created

```sql
-- In your Supabase SQL Editor or psql
SELECT id, user_id, model, generated_count, accepted_unedited_count, accepted_edited_count, created_at
FROM generations
ORDER BY created_at DESC
LIMIT 5;
```

**Expected output:**

```
 id |               user_id                | model              | generated_count | accepted_unedited_count | accepted_edited_count |     created_at
----+--------------------------------------+--------------------+-----------------+-------------------------+-----------------------+---------------------
  1 | 00000000-0000-0000-0000-000000000001 | openai/gpt-4o-mini |               3 |                       0 |                     0 | 2025-12-10 14:30:00
```

---

### Step 4: Create a Manual Flashcard (Simplest Test)

```bash
curl -v -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript",
    "source": "manual",
    "generation_id": null
  }' | jq
```

**What to check:**

- HTTP status code should be `201 Created`
- Response should contain the flashcard with an `id`

**If you get an error:**

- Check the error message in the response
- Check server console for logs

---

### Step 5: Verify Manual Flashcard Was Created

```sql
-- Check flashcards table
SELECT id, generation_id, front, back, source, user_id, created_at
FROM flashcards
ORDER BY created_at DESC
LIMIT 5;
```

**Expected output:**

```
 id | generation_id |        front         |           back            |  source  |               user_id                |     created_at
----+---------------+----------------------+---------------------------+----------+--------------------------------------+---------------------
  1 |          NULL | What is TypeScript?  | A typed superset of JS    | manual   | 00000000-0000-0000-0000-000000000001 | 2025-12-10 14:35:00
```

---

### Step 6: Create AI-Generated Flashcard (Use Real generation_id)

```bash
# Replace 1 with YOUR actual generation_id from Step 2
curl -v -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is static typing?",
    "back": "A type system where types are checked at compile time",
    "source": "ai_generated",
    "generation_id": 1
  }' | jq
```

---

### Step 7: Verify Generation Counts Were Updated

```sql
-- This is the query you ran that returned no rows
SELECT id, generated_count, accepted_unedited_count, accepted_edited_count
FROM generations
WHERE id = 1;
```

**Expected output (after creating AI flashcard):**

```
 id | generated_count | accepted_unedited_count | accepted_edited_count
----+-----------------+-------------------------+-----------------------
  1 |               3 |                       1 |                     0
```

**If no rows returned:**

- The generation with `id = 1` doesn't exist
- Check what generation_id you actually have:
  ```sql
  SELECT id FROM generations ORDER BY created_at DESC LIMIT 5;
  ```

---

## Common Issues and Solutions

### Issue 1: "No rows returned" from generations query

**Cause:** No generation exists with that ID

**Solution:**

```sql
-- Find all generations
SELECT id, created_at FROM generations ORDER BY created_at DESC;

-- If empty, create one via API first (Step 2)
```

---

### Issue 2: Flashcard created but generation counts not updated

**Cause:** Rollback occurred due to error in `updateGenerationCounts()`

**Check server logs:**

```bash
# Look for errors in your terminal where npm run dev is running
# Should see: "Flashcard creation error: ..."
```

**Debug query:**

```sql
-- Check if flashcard exists
SELECT COUNT(*) FROM flashcards WHERE generation_id = 1;

-- Check generation counts
SELECT accepted_unedited_count, accepted_edited_count
FROM generations
WHERE id = 1;
```

---

### Issue 3: "Generation session not found" error

**Cause:** Using wrong generation_id or generation belongs to different user

**Solution:**

```sql
-- Verify generation exists and belongs to default user
SELECT id, user_id
FROM generations
WHERE id = 1
  AND user_id = '00000000-0000-0000-0000-000000000001';
```

---

### Issue 4: Flashcard not created at all

**Check:**

1. Server logs for errors
2. Validation errors in curl response
3. Database connection

```bash
# Test with verbose output
curl -v -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Test",
    "back": "Answer",
    "source": "manual",
    "generation_id": null
  }'
```

---

## Complete Test Flow

Here's a complete flow to test everything:

```bash
# 1. Create generation
GENERATION_RESPONSE=$(curl -s -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "React is a JavaScript library for building user interfaces.",
    "model": "openai/gpt-4o-mini"
  }')

echo "Generation Response:"
echo $GENERATION_RESPONSE | jq

# Extract generation_id (requires jq)
GENERATION_ID=$(echo $GENERATION_RESPONSE | jq -r '.data.generation_id')
echo "Generation ID: $GENERATION_ID"

# 2. Create manual flashcard
echo "\n--- Creating manual flashcard ---"
curl -s -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "A JavaScript library for building UIs",
    "source": "manual",
    "generation_id": null
  }' | jq

# 3. Create AI-generated flashcard (unedited)
echo "\n--- Creating AI-generated flashcard (unedited) ---"
curl -s -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d "{
    \"front\": \"What is JSX?\",
    \"back\": \"A syntax extension for JavaScript\",
    \"source\": \"ai_generated\",
    \"generation_id\": $GENERATION_ID
  }" | jq

# 4. Create AI-generated flashcard (edited)
echo "\n--- Creating AI-generated flashcard (edited) ---"
curl -s -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d "{
    \"front\": \"What is Virtual DOM?\",
    \"back\": \"A lightweight copy of the actual DOM used by React for efficient updates\",
    \"source\": \"ai_generated_edited\",
    \"generation_id\": $GENERATION_ID
  }" | jq

# 5. Verify in database
echo "\n--- Database verification needed ---"
echo "Run this SQL query:"
echo "SELECT id, generated_count, accepted_unedited_count, accepted_edited_count"
echo "FROM generations"
echo "WHERE id = $GENERATION_ID;"
```

Save this as `test-complete-flow.sh` and run:

```bash
chmod +x test-complete-flow.sh
./test-complete-flow.sh
```

---

## Quick Diagnostic Queries

```sql
-- 1. Check if default user exists
SELECT id, email FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Count total flashcards
SELECT COUNT(*) as total_flashcards FROM flashcards;

-- 3. Count flashcards by source
SELECT source, COUNT(*) as count
FROM flashcards
GROUP BY source;

-- 4. Check generation statistics
SELECT
  id,
  generated_count,
  accepted_unedited_count,
  accepted_edited_count,
  (accepted_unedited_count + accepted_edited_count)::float /
    NULLIF(generated_count, 0) * 100 as acceptance_rate
FROM generations
ORDER BY created_at DESC;

-- 5. Check flashcards with their generation info
SELECT
  f.id,
  f.front,
  f.source,
  f.generation_id,
  g.model,
  f.created_at
FROM flashcards f
LEFT JOIN generations g ON f.generation_id = g.id
ORDER BY f.created_at DESC
LIMIT 10;
```

---

## What to Check Right Now

Run these commands in order:

```bash
# 1. Check if any generations exist
echo "SELECT COUNT(*) FROM generations;" | # your psql command

# 2. If count > 0, get the latest generation_id
echo "SELECT id FROM generations ORDER BY created_at DESC LIMIT 1;" | # your psql command

# 3. Check if any flashcards exist
echo "SELECT COUNT(*) FROM flashcards;" | # your psql command

# 4. If flashcards exist, check their generation_ids
echo "SELECT id, generation_id, source FROM flashcards;" | # your psql command
```

**Tell me the results and I'll help you debug further!**
