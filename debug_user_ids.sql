-- Debug script to check user_id values in resources table
-- Run this to see what's in the database

SELECT 
    id,
    type,
    user_id,
    created_at,
    meta->>'name' as filename
FROM resources
ORDER BY created_at DESC
LIMIT 20;

-- This will show you:
-- 1. If user_id is NULL for some resources
-- 2. What user_id values exist
-- 3. Recent resources and their ownership
