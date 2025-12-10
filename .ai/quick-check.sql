-- Quick diagnostic queries
-- Run these in your Supabase SQL Editor

-- 1. Check if ANY generations exist
SELECT COUNT(*) as total_generations FROM generations;

-- 2. List all generation IDs
SELECT id, created_at, model, generated_count 
FROM generations 
ORDER BY created_at DESC;

-- 3. Check if ANY flashcards exist
SELECT COUNT(*) as total_flashcards FROM flashcards;

-- 4. List all flashcards with their generation_id
SELECT id, generation_id, source, front, created_at 
FROM flashcards 
ORDER BY created_at DESC;

-- 5. Check if default user exists
SELECT id, email 
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001';

