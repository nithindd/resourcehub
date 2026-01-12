-- Re-enable RLS with proper user-specific policies
-- This ensures users only see their own resources

-- 1. Enable RLS on resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own and public resources" ON resources;
DROP POLICY IF EXISTS "View Resources" ON resources;
DROP POLICY IF EXISTS "Manage Resources" ON resources;
DROP POLICY IF EXISTS "Owner Access Only" ON resources;
DROP POLICY IF EXISTS "Owner Insert" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;

-- 3. Create simple, clear policies

-- SELECT: Users can only see their own resources
CREATE POLICY "Users can view their own resources"
ON resources FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only create resources for themselves
CREATE POLICY "Users can insert their own resources"
ON resources FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own resources
CREATE POLICY "Users can update their own resources"
ON resources FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own resources
CREATE POLICY "Users can delete their own resources"
ON resources FOR DELETE
USING (auth.uid() = user_id);

-- Note: Sharing policies will be added later when we implement that feature
