-- Migration: 20260125145101_add_rls_to_user_tables.sql
-- Purpose: Add Row Level Security (RLS) policies for user-specific tables:
-- flashcards, generations, and generation_error_logs.
-- These policies ensure that authenticated users can only access and modify their own data.

-- Ensure RLS is enabled for tables that store user-specific data.
-- This is a foundational step before defining any policies.

-- Table: public.flashcards
--------------------------------------------------------------------------------

alter table public.flashcards enable row level security;

-- Policy for authenticated users to select their own flashcards.
create policy "authenticated users can view their own flashcards"
on public.flashcards for select to authenticated
using (auth.uid() = user_id);

-- Policy for authenticated users to insert their own flashcards.
create policy "authenticated users can insert their own flashcards"
on public.flashcards for insert to authenticated
with check (auth.uid() = user_id);

-- Policy for authenticated users to update their own flashcards.
create policy "authenticated users can update their own flashcards"
on public.flashcards for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy for authenticated users to delete their own flashcards.
create policy "authenticated users can delete their own flashcards"
on public.flashcards for delete to authenticated
using (auth.uid() = user_id);


-- Table: public.generations
--------------------------------------------------------------------------------

alter table public.generations enable row level security;

-- Policy for authenticated users to select their own generation records.
create policy "authenticated users can view their own generations"
on public.generations for select to authenticated
using (auth.uid() = user_id);

-- Policy for authenticated users to insert their own generation records.
create policy "authenticated users can insert their own generations"
on public.generations for insert to authenticated
with check (auth.uid() = user_id);

-- Policy for authenticated users to update their own generation records.
create policy "authenticated users can update their own generations"
on public.generations for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy for authenticated users to delete their own generation records.
create policy "authenticated users can delete their own generations"
on public.generations for delete to authenticated
using (auth.uid() = user_id);


-- Table: public.generation_error_logs
--------------------------------------------------------------------------------

alter table public.generation_error_logs enable row level security;

-- Policy for authenticated users to select their own generation error logs.
create policy "authenticated users can view their own generation error logs"
on public.generation_error_logs for select to authenticated
using (auth.uid() = user_id);

-- Policy for authenticated users to insert their own generation error logs.
-- Note: It's common for error logs to be insertable by the user who caused them,
-- but typically not updatable or deletable directly by them.
-- The 'with check' clause ensures that the inserted log belongs to the user.
create policy "authenticated users can insert their own generation error logs"
on public.generation_error_logs for insert to authenticated
with check (auth.uid() = user_id);

-- Policy for authenticated users to update their own generation error logs.
-- This policy is included for completeness based on the request for all CRUD operations,
-- but consider if users should truly be able to update their error logs.
create policy "authenticated users can update their own generation error logs"
on public.generation_error_logs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy for authenticated users to delete their own generation error logs.
-- This policy is included for completeness based on the request for all CRUD operations,
-- but consider if users should truly be able to delete their error logs.
create policy "authenticated users can delete their own generation error logs"
on public.generation_error_logs for delete to authenticated
using (auth.uid() = user_id);
