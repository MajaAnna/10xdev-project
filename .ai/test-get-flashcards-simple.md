# Manual Test Commands for GET /api/flashcards

Copy and paste these curl commands into your terminal to test the endpoint.

## ✅ Success Cases

### 1. Default parameters (page=1, limit=20)

```bash
curl -s http://localhost:4321/api/flashcards | jq .
```

### 2. Custom limit (limit=2)

```bash
curl -s "http://localhost:4321/api/flashcards?limit=2" | jq .
```

### 3. Second page with custom limit (page=2, limit=2)

```bash
curl -s "http://localhost:4321/api/flashcards?page=2&limit=2" | jq .
```

### 4. Large limit (limit=50)

```bash
curl -s "http://localhost:4321/api/flashcards?limit=50" | jq .
```

### 5. Page beyond available data (page=100)

**Expected**: Empty array, not an error

```bash
curl -s "http://localhost:4321/api/flashcards?page=100" | jq .
```

---

## ❌ Error Cases (Should return 400 Bad Request)

### 6. Invalid page number (page=0)

```bash
curl -s "http://localhost:4321/api/flashcards?page=0" | jq .
```

### 7. Invalid page number (page=-1)

```bash
curl -s "http://localhost:4321/api/flashcards?page=-1" | jq .
```

### 8. Invalid limit - too large (limit=200, max is 100)

```bash
curl -s "http://localhost:4321/api/flashcards?limit=200" | jq .
```

### 9. Invalid limit - zero (limit=0)

```bash
curl -s "http://localhost:4321/api/flashcards?limit=0" | jq .
```

### 10. Invalid parameter type (page=abc)

```bash
curl -s "http://localhost:4321/api/flashcards?page=abc" | jq .
```

---

## 📊 Quick Verification (One-liner)

Test all scenarios at once and show only pagination info:

```bash
echo "Test 1 (default):" && curl -s "http://localhost:4321/api/flashcards" | jq -c '.pagination' && \
echo "Test 2 (limit=2):" && curl -s "http://localhost:4321/api/flashcards?limit=2" | jq -c '.pagination' && \
echo "Test 3 (page=2,limit=2):" && curl -s "http://localhost:4321/api/flashcards?page=2&limit=2" | jq -c '.pagination' && \
echo "Test 4 (page=100):" && curl -s "http://localhost:4321/api/flashcards?page=100" | jq -c '.pagination' && \
echo "Test 5 (page=0, error):" && curl -s "http://localhost:4321/api/flashcards?page=0" | jq -c '.error.code' && \
echo "Test 6 (limit=200, error):" && curl -s "http://localhost:4321/api/flashcards?limit=200" | jq -c '.error.code'
```

---

## 🔍 Response Format Reference

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "generation_id": null,
      "front": "Question text",
      "back": "Answer text",
      "source": "manual",
      "created_at": "2025-12-10T13:51:38.206928+00:00",
      "updated_at": "2025-12-10T13:51:38.206928+00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 1,
    "total_items": 3
  }
}
```

### Error Response (400 Bad Request)

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

---

## 📝 Notes

- **Empty results are valid**: If a user has no flashcards or requests a page beyond available data, the API returns `200 OK` with an empty `data` array.
- **user_id is excluded**: The response never includes `user_id` for security reasons.
- **Flashcards are sorted**: Results are ordered by `created_at DESC` (newest first).
- **Default values**: If no parameters are provided, defaults to `page=1` and `limit=20`.
- **Maximum limit**: The maximum allowed limit is 100 flashcards per page.
