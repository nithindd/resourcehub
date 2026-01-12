-- EMERGENCY VISIBILITY FIX
-- This script strips away all complex sharing logic to verify basic access.

-- 1. Disable RLS temporarily to check if data exists (Optional explanation to user, but we will just reset policies)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view own and public resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;
DROP POLICY IF EXISTS "Public resources are viewable by everyone" ON resources;
DROP POLICY IF EXISTS "Shared resources are viewable by invited email" ON resources;
DROP POLICY IF EXISTS "Users can select their own resources" ON resources;
DROP POLICY IF EXISTS "Users can view their own data" ON resources;

-- 3. Create SIMPLE Owner-Only Policy (The most basic check)
CREATE POLICY "Owner Access Only"
ON resources
USING (auth.uid() = user_id);

-- 4. Create separate Insert Policy just in case
CREATE POLICY "Owner Insert"
ON resources FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Run this and check the app. 
-- If files appear, the issue was in the complex sharing logic.
-- If files DO NOT appear, the issue is likely the user_id data itself (e.g. user_id column is NULL or mismatch).
