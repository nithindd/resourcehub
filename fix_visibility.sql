-- Reset and Fix RLS Policies for Resources

-- Ensure RLS is enabled
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 1. DROP potential conflicting policies to be clean
DROP POLICY IF EXISTS "Users can select their own resources" ON resources;
DROP POLICY IF EXISTS "Users can view their own data" ON resources;
DROP POLICY IF EXISTS "Public resources are viewable by everyone" ON resources;
DROP POLICY IF EXISTS "Shared resources are viewable by invited email" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;
DROP POLICY IF EXISTS "Owners can select shares" ON resource_shares;


-- 2. CREATE POLICIES --

-- SELECT: Owners + Public + Shared
CREATE POLICY "Users can view own and public resources"
ON resources FOR SELECT
USING (
    user_id = auth.uid() -- Owner
    OR is_public = true  -- Public
    OR EXISTS (          -- Shared
        SELECT 1 FROM resource_shares
        WHERE resource_shares.resource_id = resources.id
        AND resource_shares.user_email = (auth.jwt() ->> 'email')
    )
);

-- INSERT: Owners only
CREATE POLICY "Users can insert their own resources"
ON resources FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Owners only
CREATE POLICY "Users can update their own resources"
ON resources FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Owners only
CREATE POLICY "Users can delete their own resources"
ON resources FOR DELETE
USING (auth.uid() = user_id);

-- Verify resource_shares RLS as well
ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;

-- Allow owners to manage shares
CREATE POLICY "Owners can view shares"
ON resource_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);

CREATE POLICY "Owners can add shares"
ON resource_shares FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);

CREATE POLICY "Owners can delete shares"
ON resource_shares FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);
