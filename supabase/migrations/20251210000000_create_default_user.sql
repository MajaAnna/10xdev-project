-- ============================================================================
-- Migration: Create Default User for Development
-- ============================================================================
-- Description: Creates a default user in auth.users table for development
--              This user is used when authentication is not yet implemented
--
-- User ID: 00000000-0000-0000-0000-000000000001
--
-- Special Considerations:
--   - This is for DEVELOPMENT ONLY
--   - In production, users will be created through Supabase Auth
--   - The user_id matches DEFAULT_USER_ID in src/db/supabase.client.ts
--
-- Author: Database Architect
-- Date: 2025-12-10
-- Version: 1.0.0
-- ============================================================================

-- Insert default user into auth.users table
-- This allows foreign key constraints to work during development
insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
values (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'dev@example.com',
    '',  -- No password needed for development
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    '',
    '',
    '',
    ''
)
on conflict (id) do nothing;  -- Skip if user already exists

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   ✓ Created default development user with ID 00000000-0000-0000-0000-000000000001
--   ✓ User email: dev@example.com
--   ✓ User can be used for testing before auth is implemented
--
-- Next Steps:
--   1. Restart your application
--   2. Test API endpoints with curl
--   3. Verify generations are created successfully
-- ============================================================================

