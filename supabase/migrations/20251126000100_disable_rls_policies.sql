-- ============================================================================
-- Migration: Disable RLS Policies and RLS
-- ============================================================================
-- Description: Drops all Row Level Security (RLS) policies and disables RLS on:
--              - flashcards
--              - generations
--              - generation_error_logs
--
-- Affected Tables: flashcards, generations, generation_error_logs
--
-- Special Considerations:
--   - RLS is DISABLED on all tables
--   - All policies are dropped before disabling RLS
--   - After this migration, all authenticated users will have full access
--   - Access control must be handled at the application level
--
-- WARNING: Disabling RLS removes database-level security enforcement.
--          Ensure application-level security is properly implemented.
--
-- Author: Database Architect
-- Date: 2025-11-26
-- Version: 1.0.1
-- ============================================================================

-- ============================================================================
-- SECTION 1: Drop flashcards Policies
-- ============================================================================

-- drop select policy for flashcards
drop policy if exists "authenticated users can select own flashcards" on flashcards;

-- drop insert policy for flashcards
drop policy if exists "authenticated users can insert own flashcards" on flashcards;

-- drop update policy for flashcards
drop policy if exists "authenticated users can update own flashcards" on flashcards;

-- drop delete policy for flashcards
drop policy if exists "authenticated users can delete own flashcards" on flashcards;

-- ============================================================================
-- SECTION 2: Drop generations Policies
-- ============================================================================

-- drop select policy for generations
drop policy if exists "authenticated users can select own generations" on generations;

-- drop insert policy for generations
drop policy if exists "authenticated users can insert own generations" on generations;

-- drop update policy for generations
drop policy if exists "authenticated users can update own generations" on generations;

-- drop delete policy for generations
drop policy if exists "authenticated users can delete own generations" on generations;

-- ============================================================================
-- SECTION 3: Drop generation_error_logs Policies
-- ============================================================================

-- drop select policy for generation_error_logs
drop policy if exists "authenticated users can select own error logs" on generation_error_logs;

-- drop insert policy for generation_error_logs
drop policy if exists "authenticated users can insert own error logs" on generation_error_logs;

-- ============================================================================
-- SECTION 4: Disable RLS on All Tables
-- ============================================================================
-- WARNING: This removes database-level security enforcement.
--          All authenticated users will have full access to all data.
--          Application-level security MUST be implemented to protect user data.
-- ============================================================================

-- disable rls on flashcards table
alter table flashcards disable row level security;

-- disable rls on generations table
alter table generations disable row level security;

-- disable rls on generation_error_logs table
alter table generation_error_logs disable row level security;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   ✓ Dropped 4 policies from flashcards table
--   ✓ Dropped 4 policies from generations table
--   ✓ Dropped 2 policies from generation_error_logs table
--   ✓ Disabled RLS on flashcards table
--   ✓ Disabled RLS on generations table
--   ✓ Disabled RLS on generation_error_logs table
--
-- Current State:
--   - All tables have RLS DISABLED
--   - No policies exist
--   - All authenticated users have full access to all data
--   - Security must be enforced at application level
--
-- WARNING: Without RLS, there is no database-level protection preventing
--          users from accessing other users' data. Ensure your application
--          properly filters queries by user_id.
--
-- Next Steps:
--   1. Implement application-level security checks
--   2. Filter all queries by user_id in application code
--   3. Consider re-enabling RLS with proper policies for production
-- ============================================================================

