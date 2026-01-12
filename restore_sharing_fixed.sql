-- RESTORE SHARING POLICIES (FIXED)

-- 1. Ensure RLS is on
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;

-- 2. Drop the simple policies to avoid duplicates (we will recreate the comprehensive ones)
DROP POLICY IF EXISTS "Owner Access Only" ON resources;
DROP POLICY IF EXISTS "Owner Insert" ON resources;

-- 3. Resources Policies

-- A. VIEW: Combined logic for Owner OR Public OR Shared
CREATE POLICY "View Resources"
ON resources FOR SELECT
USING (
    user_id = auth.uid()                            -- Case 1: Owner
    OR is_public = true                             -- Case 2: Public
    OR EXISTS (                                     -- Case 3: Shared with me
        SELECT 1 FROM resource_shares
        WHERE resource_shares.resource_id = resources.id
        AND resource_shares.user_email = (auth.jwt() ->> 'email')
    )
);

-- B. MODIFY: Owners only (Insert, Update, Delete)
CREATE POLICY "Manage Resources"
ON resources FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 4. Resource Shares Policies

-- A. VIEW: Owners only (Users can't see who else a file is shared with, only the owner can)
CREATE POLICY "View Shares"
ON resource_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);

-- B. MANAGE: Owners only (Add/Remove shares)
CREATE POLICY "Manage Shares"
ON resource_shares FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);
