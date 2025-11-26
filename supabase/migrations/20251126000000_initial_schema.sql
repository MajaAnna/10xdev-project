-- ============================================================================
-- Migration: Initial Database Schema for AI Cards MVP
-- ============================================================================
-- Description: Creates the foundational database schema including:
--              - Custom ENUM type for flashcard sources
--              - Core tables: flashcards, generations, generation_error_logs
--              - Performance indexes for common queries
--              - Trigger function for automatic timestamp updates
--              - Row Level Security (RLS) policies for data isolation
--
-- Affected Tables: flashcards, generations, generation_error_logs
--
-- Special Considerations:
--   - This migration assumes auth.users table exists (managed by Supabase Auth)
--   - All tables implement RLS for user data isolation
--   - CASCADE DELETE ensures referential integrity on user/generation deletion
--   - Schema supports PRD success metrics tracking (AI quality & adoption)
--
-- Author: Database Architect
-- Date: 2025-11-26
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- SECTION 1: Custom Types
-- ============================================================================

-- create enum type for tracking flashcard origin
-- this supports the ai adoption metric (prd section 6.2)
create type flashcard_source as enum (
    'manual',              -- manually created by user
    'ai_generated',        -- ai-generated and accepted without edits
    'ai_generated_edited'  -- ai-generated and accepted after editing
);

comment on type flashcard_source is 'tracks the origin of each flashcard for ai adoption metrics';

-- ============================================================================
-- SECTION 2: Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: generations
-- ----------------------------------------------------------------------------
-- Purpose: logs each ai generation session for analytics and success metrics
-- Relationships: 
--   - belongs to auth.users (user_id)
--   - has many flashcards (one-to-many)
-- Notes: created before flashcards due to foreign key dependency
-- ----------------------------------------------------------------------------

create table generations (
    -- primary key
    id bigserial primary key,
    
    -- foreign keys
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- generation metadata
    model varchar(50) not null,
    generation_duration int not null,
    
    -- metrics counters for prd section 6.1 (ai generation quality)
    generated_count int not null default 0,
    accepted_unedited_count int default 0,
    accepted_edited_count int default 0,
    
    -- source text tracking (for deduplication and analytics)
    source_text_hash varchar(64) not null,
    source_text_length int not null,
    
    -- timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- constraints
    constraint check_source_text_length 
        check (source_text_length >= 100 and source_text_length <= 10000),
    constraint check_generated_count 
        check (generated_count >= 0),
    constraint check_accepted_unedited_count 
        check (accepted_unedited_count >= 0),
    constraint check_accepted_edited_count 
        check (accepted_edited_count >= 0),
    constraint check_generation_duration 
        check (generation_duration >= 0)
);

comment on table generations is 'logs ai generation sessions for analytics and success metrics tracking';
comment on column generations.model is 'ai model identifier (e.g., gpt-4, claude-3-sonnet)';
comment on column generations.generation_duration is 'duration of generation in milliseconds';
comment on column generations.generated_count is 'total number of flashcard candidates generated in this session';
comment on column generations.accepted_unedited_count is 'number of candidates accepted without editing';
comment on column generations.accepted_edited_count is 'number of candidates accepted after editing';
comment on column generations.source_text_hash is 'sha-256 hash of source text for deduplication';
comment on column generations.source_text_length is 'character count of source text (enforced: 100-10000)';

-- ----------------------------------------------------------------------------
-- Table: flashcards
-- ----------------------------------------------------------------------------
-- Purpose: stores all user flashcards (manual and ai-generated)
-- Relationships:
--   - belongs to auth.users (user_id)
--   - optionally belongs to generations (generation_id, nullable for manual cards)
-- Notes: central table for the application, supports us-006 through us-009
-- ----------------------------------------------------------------------------

create table flashcards (
    -- primary key
    id bigserial primary key,
    
    -- foreign keys
    user_id uuid not null references auth.users(id) on delete cascade,
    generation_id bigint references generations(id) on delete cascade,
    
    -- flashcard content
    front varchar(200) not null,
    back varchar(500) not null,
    
    -- metadata
    source flashcard_source not null,
    
    -- timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- constraints
    constraint check_front_not_empty 
        check (length(trim(front)) > 0),
    constraint check_back_not_empty 
        check (length(trim(back)) > 0)
);

comment on table flashcards is 'stores all user flashcards (manual and ai-generated)';
comment on column flashcards.generation_id is 'links to generation session; null for manually created cards';
comment on column flashcards.front is 'question/term side (max 200 chars, prd us-013)';
comment on column flashcards.back is 'answer/definition side (max 500 chars, prd us-013)';
comment on column flashcards.source is 'tracks flashcard origin for ai adoption metrics (prd section 6.2)';

-- ----------------------------------------------------------------------------
-- Table: generation_error_logs
-- ----------------------------------------------------------------------------
-- Purpose: immutable audit trail for ai generation errors
-- Relationships:
--   - belongs to auth.users (user_id)
-- Notes: no update/delete policies (immutable), supports us-014
-- ----------------------------------------------------------------------------

create table generation_error_logs (
    -- primary key
    id bigserial primary key,
    
    -- foreign keys
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- error context
    model varchar(50) not null,
    source_text_hash varchar(64) not null,
    source_text_length int not null,
    
    -- error details
    error_code varchar(100) not null,
    error_message text not null,
    
    -- timestamp
    created_at timestamptz not null default now(),
    
    -- constraints
    constraint check_error_source_text_length 
        check (source_text_length >= 100 and source_text_length <= 10000)
);

comment on table generation_error_logs is 'immutable audit trail for ai generation errors';
comment on column generation_error_logs.model is 'ai model that was attempted';
comment on column generation_error_logs.source_text_hash is 'sha-256 hash of source text that caused error';
comment on column generation_error_logs.error_code is 'error code from ai service or application';
comment on column generation_error_logs.error_message is 'detailed error message for debugging';

-- ============================================================================
-- SECTION 3: Indexes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- flashcards indexes
-- ----------------------------------------------------------------------------

-- composite index for listing user's flashcards chronologically (us-007)
-- this is the most common query: "show me my flashcards, newest first"
create index idx_flashcards_user_created 
on flashcards(user_id, created_at desc);

comment on index idx_flashcards_user_created is 'optimizes listing user flashcards chronologically (most common query)';

-- partial index for finding flashcards by generation
-- only indexes rows where generation_id is not null (ai-generated cards)
create index idx_flashcards_generation 
on flashcards(generation_id) 
where generation_id is not null;

comment on index idx_flashcards_generation is 'optimizes finding flashcards by generation session (partial index)';

-- ----------------------------------------------------------------------------
-- generations indexes
-- ----------------------------------------------------------------------------

-- composite index for user generations lookup
create index idx_generations_user_created 
on generations(user_id, created_at desc);

comment on index idx_generations_user_created is 'optimizes listing user generation sessions chronologically';

-- partial index for deduplication checks by hash
-- helps prevent duplicate generations from same source text
create index idx_generations_hash 
on generations(user_id, source_text_hash);

comment on index idx_generations_hash is 'optimizes deduplication checks by source text hash';

-- ----------------------------------------------------------------------------
-- generation_error_logs indexes
-- ----------------------------------------------------------------------------

-- composite index for error logs lookup by user
create index idx_generation_error_logs_user 
on generation_error_logs(user_id, created_at desc);

comment on index idx_generation_error_logs_user is 'optimizes listing user error logs chronologically';

-- ============================================================================
-- SECTION 4: Triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: moddatetime()
-- ----------------------------------------------------------------------------
-- Purpose: reusable trigger function to automatically update updated_at column
-- Usage: attach to tables with updated_at column using before update trigger
-- Notes: follows dry principle, standard postgresql pattern
-- ----------------------------------------------------------------------------

create or replace function moddatetime()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

comment on function moddatetime() is 'reusable trigger function to automatically update updated_at timestamps';

-- attach trigger to flashcards table
create trigger handle_updated_at_flashcards
    before update on flashcards
    for each row
    execute function moddatetime();

comment on trigger handle_updated_at_flashcards on flashcards is 'automatically updates updated_at on flashcard modifications';

-- attach trigger to generations table
create trigger handle_updated_at_generations
    before update on generations
    for each row
    execute function moddatetime();

comment on trigger handle_updated_at_generations on generations is 'automatically updates updated_at on generation modifications';

-- ============================================================================
-- SECTION 5: Row Level Security (RLS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------------------------
-- IMPORTANT: rls must be enabled even if policies allow public access
-- this is a supabase best practice and security requirement
-- ----------------------------------------------------------------------------

alter table flashcards enable row level security;
alter table generations enable row level security;
alter table generation_error_logs enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policies: flashcards
-- ----------------------------------------------------------------------------
-- Purpose: ensure users can only access their own flashcards
-- Rationale: enforces data isolation at database level (prd section 3.6)
-- Coverage: full crud operations (select, insert, update, delete)
-- ----------------------------------------------------------------------------

-- policy: authenticated users can view their own flashcards
create policy "authenticated users can select own flashcards"
on flashcards for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert their own flashcards
create policy "authenticated users can insert own flashcards"
on flashcards for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users can update their own flashcards
create policy "authenticated users can update own flashcards"
on flashcards for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own flashcards
create policy "authenticated users can delete own flashcards"
on flashcards for delete
to authenticated
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policies: generations
-- ----------------------------------------------------------------------------
-- Purpose: ensure users can only access their own generation logs
-- Rationale: protects user privacy and analytics data
-- Coverage: full crud operations (select, insert, update, delete)
-- ----------------------------------------------------------------------------

-- policy: authenticated users can view their own generations
create policy "authenticated users can select own generations"
on generations for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert their own generations
create policy "authenticated users can insert own generations"
on generations for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users can update their own generations
create policy "authenticated users can update own generations"
on generations for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own generations
create policy "authenticated users can delete own generations"
on generations for delete
to authenticated
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policies: generation_error_logs
-- ----------------------------------------------------------------------------
-- Purpose: ensure users can only access their own error logs
-- Rationale: protects user privacy, immutable audit trail
-- Coverage: select and insert only (no update/delete for audit integrity)
-- Note: error logs are intentionally immutable for debugging purposes
-- ----------------------------------------------------------------------------

-- policy: authenticated users can view their own error logs
create policy "authenticated users can select own error logs"
on generation_error_logs for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert their own error logs
create policy "authenticated users can insert own error logs"
on generation_error_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- note: no update or delete policies for error logs
-- this maintains immutable audit trail for debugging and compliance

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   ✓ Created flashcard_source enum type
--   ✓ Created 3 tables: generations, flashcards, generation_error_logs
--   ✓ Created 5 performance indexes
--   ✓ Created reusable moddatetime() trigger function
--   ✓ Attached triggers to flashcards and generations tables
--   ✓ Enabled RLS on all tables
--   ✓ Created 10 RLS policies for data isolation
--
-- Next Steps:
--   1. Run migration: supabase db push
--   2. Verify schema: supabase db diff
--   3. Test RLS policies with different user contexts
--   4. Set up Supabase Auth for user management
--
-- Success Metrics Support:
--   ✓ AI Generation Quality (PRD 6.1): generations table tracks acceptance rates
--   ✓ AI Adoption (PRD 6.2): flashcards.source tracks origin for metrics
-- ============================================================================

