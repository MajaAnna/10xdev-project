# Database Schema - AI Cards MVP

## Overview

This document defines the complete PostgreSQL database schema for the AI Cards application MVP. The schema is designed to work with Supabase and includes all necessary tables, types, constraints, indexes, triggers, and Row Level Security (RLS) policies.

## 1. Custom Types

### flashcard_source (ENUM)

```sql
CREATE TYPE flashcard_source AS ENUM (
    'manual',
    'ai_generated',
    'ai_generated_edited'
);
```

**Description**: Tracks the origin of each flashcard to measure AI adoption metrics.

## 2. Tables

### 2.1. flashcards

Primary table storing all user flashcards (both manually created and AI-generated).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier for the flashcard |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the flashcard |
| generation_id | BIGINT | NULL, REFERENCES generations(id) ON DELETE CASCADE | Link to generation session (NULL for manual cards) |
| front | VARCHAR(200) | NOT NULL | Question/term side of the flashcard |
| back | VARCHAR(500) | NOT NULL | Answer/definition side of the flashcard |
| source | flashcard_source | NOT NULL | Origin of the flashcard |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp of creation |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp of last update |

**Constraints**:
- `CHECK (length(trim(front)) > 0)`: Ensures front is not empty or whitespace-only
- `CHECK (length(trim(back)) > 0)`: Ensures back is not empty or whitespace-only

*Trigger: Automatically update `updated_at` column on record updates.*

### 2.2. generations

Logs each AI generation session for analytics and success metrics tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier for the generation session |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | User who initiated the generation |
| model | VARCHAR(50) | NOT NULL | AI model used for generation (e.g., "gpt-4", "claude-3") |
| generation_duration | INT | NOT NULL | Duration of generation in milliseconds |
| generated_count | INT | NOT NULL, DEFAULT 0 | Total number of flashcard candidates generated |
| accepted_unedited_count | INT | NULLABLE, DEFAULT 0 | Number of candidates accepted without editing |
| accepted_edited_count | INT | NULLABLE, DEFAULT 0 | Number of candidates accepted after editing |
| source_text_hash | VARCHAR(64) | NOT NULL | SHA-256 hash of the source text for deduplication |
| source_text_length | INT | NOT NULL | Length of the source text in characters |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp of generation |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp of last update |

**Constraints**:
- `CHECK (source_text_length >= 100 AND source_text_length <= 10000)`: Enforces PRD text length limits
- `CHECK (generated_count >= 0)`: Ensures non-negative count
- `CHECK (accepted_unedited_count >= 0)`: Ensures non-negative count
- `CHECK (accepted_edited_count >= 0)`: Ensures non-negative count
- `CHECK (generation_duration IS NOT NULL OR generation_duration >= 0)`: Ensures non-negative duration

### 2.3. generation_error_logs

Records errors during AI generation for debugging and monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier for the error log |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | User who experienced the error |
| model | VARCHAR(50) | NOT NULL | AI model that was attempted |
| source_text_hash | VARCHAR(64) |  NOT NULL | SHA-256 hash of the source text |
| source_text_length | INT | NOT NULL | Length of the source text in characters |
| error_code | VARCHAR(100) | NOT NULL | Error code from the AI service |
| error_message | TEXT | NOT NULL | Detailed error message |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp when error occurred |

**Constraints**:
- `CHECK (source_text_length >= 100 AND source_text_length <= 10000)`: Enforces PRD text length limits

## 3. Relationships

### 3.1. Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ├── 1:N → flashcards (user_id)
    ├── 1:N → generations (user_id)
    └── 1:N → generation_error_logs (user_id)

generations
    └── 1:N → flashcards (generation_id)
```

### 3.2. Relationship Details

1. **users → flashcards**: One-to-Many
   - A user can have many flashcards
   - Each flashcard belongs to exactly one user
   - CASCADE DELETE: Deleting a user removes all their flashcards

2. **users → generations**: One-to-Many
   - A user can have many generation sessions
   - Each generation session belongs to exactly one user
   - CASCADE DELETE: Deleting a user removes all their generation logs

3. **users → generation_error_logs**: One-to-Many
   - A user can have many error logs
   - Each error log belongs to exactly one user
   - CASCADE DELETE: Deleting a user removes all their error logs

4. **generations → flashcards**: One-to-Many (Optional)
   - A generation session can produce many flashcards
   - A flashcard may belong to one generation session (NULL for manual cards)
   - CASCADE DELETE: Deleting a generation removes all its associated flashcards

## 4. Indexes

### 4.1. Primary Indexes (Automatic)

- `flashcards_pkey` on `flashcards(id)`
- `generations_pkey` on `generations(id)`
- `generation_error_logs_pkey` on `generation_error_logs(id)`

### 4.2. Performance Indexes

```sql
-- Optimize listing user's flashcards (most common query)
CREATE INDEX idx_flashcards_user_created 
ON flashcards(user_id, created_at DESC);

-- Optimize finding flashcards by generation
CREATE INDEX idx_flashcards_generation 
ON flashcards(generation_id) 
WHERE generation_id IS NOT NULL;

-- Optimize user generations lookup
CREATE INDEX idx_generations_user_created 
ON generations(user_id, created_at DESC);

-- Optimize error logs lookup by user
CREATE INDEX idx_generation_error_logs_user 
ON generation_error_logs(user_id, created_at DESC);

-- Optimize deduplication checks by hash
CREATE INDEX idx_generations_hash 
ON generations(user_id, source_text_hash) 
WHERE source_text_hash IS NOT NULL;
```

## 5. Triggers

### 5.1. Automatic Timestamp Updates

```sql
-- Create reusable trigger function for updated_at
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to flashcards table
CREATE TRIGGER handle_updated_at_flashcards
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

-- Apply to generations table
CREATE TRIGGER handle_updated_at_generations
    BEFORE UPDATE ON generations
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();
```

## 6. Row Level Security (RLS) Policies

### 6.1. Enable RLS on All Tables

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

### 6.2. flashcards Policies

```sql
-- Users can view only their own flashcards
CREATE POLICY "Users can view own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own flashcards
CREATE POLICY "Users can insert own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own flashcards
CREATE POLICY "Users can update own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own flashcards
CREATE POLICY "Users can delete own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);
```

### 6.3. generations Policies

```sql
-- Users can view only their own generations
CREATE POLICY "Users can view own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own generations
CREATE POLICY "Users can insert own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own generations
CREATE POLICY "Users can update own generations"
ON generations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own generations
CREATE POLICY "Users can delete own generations"
ON generations FOR DELETE
USING (auth.uid() = user_id);
```

### 6.4. generation_error_logs Policies

```sql
-- Users can view only their own error logs
CREATE POLICY "Users can view own error logs"
ON generation_error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own error logs
CREATE POLICY "Users can insert own error logs"
ON generation_error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies for error logs (immutable audit trail)
```

## 7. Design Decisions and Rationale

### 7.1. Use of ENUM for flashcard_source

**Decision**: Define `flashcard_source` as PostgreSQL ENUM type.

**Rationale**: 
- Ensures data integrity at the database level
- Prevents invalid source values
- Required for tracking AI adoption metrics (PRD Section 6.2)
- More efficient than CHECK constraints with text values

### 7.2. Nullable generation_id in flashcards

**Decision**: Allow `generation_id` to be NULL in the `flashcards` table.

**Rationale**:
- Supports both AI-generated and manually created flashcards
- Manual flashcards (US-006) have no associated generation session
- Maintains data integrity while allowing flexible flashcard creation

### 7.3. VARCHAR Length Limits

**Decision**: Use `VARCHAR(200)` for front, `VARCHAR(500)` for back.

**Rationale**:
- Enforces PRD requirements (US-013) at database level
- Provides additional validation layer beyond application logic
- Prevents data inconsistencies
- Improves storage efficiency

### 7.4. Separate generations and generation_error_logs Tables

**Decision**: Maintain separate tables for successful generations and errors.

**Rationale**:
- Successful generations have different data needs (counts, relationships)
- Error logs are immutable audit trails
- Simplifies queries and analytics
- Allows for different retention policies

### 7.5. SHA-256 Hash Storage

**Decision**: Use `VARCHAR(64)` for `source_text_hash`.

**Rationale**:
- SHA-256 produces 64 hexadecimal characters
- Enables deduplication without storing full source text
- Improves privacy (source text not stored)
- Efficient for lookup operations

### 7.6. Cascade Deletion Strategy

**Decision**: Implement `ON DELETE CASCADE` for user and generation relationships.

**Rationale**:
- Ensures referential integrity
- Simplifies user account deletion (GDPR compliance)
- Prevents orphaned records
- Maintains data consistency

### 7.7. Composite Index on (user_id, created_at DESC)

**Decision**: Create composite index on `flashcards(user_id, created_at DESC)`.

**Rationale**:
- Optimizes most common query: listing user's flashcards chronologically (US-007)
- Supports efficient pagination
- DESC order matches display requirements (newest first)

### 7.8. Integer Counters with DEFAULT 0

**Decision**: Set `DEFAULT 0` for all counter columns.

**Rationale**:
- Simplifies application logic (no need to explicitly set to 0)
- Ensures counters are never NULL
- Facilitates aggregation queries
- Required for calculating AI adoption metrics

### 7.9. Comprehensive RLS Policies

**Decision**: Implement full CRUD policies for all tables.

**Rationale**:
- Enforces security at database level (defense in depth)
- Prevents data leaks even if application logic has bugs
- Required by PRD Section 3.6 (Security requirements)
- Leverages Supabase Auth integration

### 7.10. Reusable Trigger Function

**Decision**: Create single `moddatetime()` function for all tables.

**Rationale**:
- DRY principle (Don't Repeat Yourself)
- Easier to maintain and test
- Consistent behavior across all tables
- Standard PostgreSQL pattern

## 8. Migration Notes

### 8.1. Deployment Order

1. Create custom ENUM type (`flashcard_source`)
2. Create tables in order: `generations`, `flashcards`, `generation_error_logs`
3. Create indexes
4. Create trigger function and triggers
5. Enable RLS on all tables
6. Create RLS policies

### 8.2. Supabase-Specific Considerations

- The `auth.users` table is managed by Supabase and will be created in the next step by Supabase Auth
- Use Supabase CLI or Dashboard for migrations
- Test RLS policies with different user contexts
- Consider using Supabase's `service_role` key for admin operations

### 8.3. Data Validation

The schema enforces validation at multiple levels:
- **Database level**: CHECK constraints, NOT NULL, FOREIGN KEY
- **Application level**: Additional validation in API endpoints (PRD Section 3.6)
- **UI level**: Character counters and input validation (US-013)

## 9. Future Considerations (Post-MVP)

While not implemented in MVP, the schema is designed to accommodate:

1. **Decks/Collections**: Add `decks` table and `deck_id` FK to `flashcards`
2. **Learning Progress**: Add `learning_sessions` table with spaced repetition data
3. **User Profiles**: Add `profiles` table extending `auth.users`
4. **Shared Decks**: Add `deck_shares` table for collaborative features
5. **Tags**: Add `tags` and `flashcard_tags` tables for organization
6. **Media Support**: Add `media` table and `media_id` FK to `flashcards`

The current schema maintains normalization (3NF) and can be extended without breaking changes.

## 10. Success Metrics Support

The schema directly supports PRD success metrics:

### Metric 6.1: AI Generation Quality (75% acceptance rate)

**Supported by**:
- `generations.generated_count`: Total candidates produced
- `generations.accepted_unedited_count`: Direct acceptances
- `generations.accepted_edited_count`: Edited acceptances
- **Formula**: `(accepted_unedited_count + accepted_edited_count) / generated_count >= 0.75`

### Metric 6.2: AI Adoption (75% of flashcards from AI)

**Supported by**:
- `flashcards.source`: Tracks origin of each flashcard
- **Query**: 
```sql
SELECT 
    COUNT(*) FILTER (WHERE source IN ('ai_generated', 'ai_generated_edited')) * 100.0 / COUNT(*) as ai_adoption_rate
FROM flashcards;
```

---

**Schema Version**: 1.0.0  
**Last Updated**: 2025-11-26  
**Status**: Ready for Implementation


