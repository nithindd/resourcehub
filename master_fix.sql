-- MASTER FIX SCRIPT
-- This script does EVERYTHING: resets schema and policies from scratch.
-- This ensures no mismatched types or missing columns cause hidden file issues.

-- 1. Add 'is_public' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'is_public') THEN
        ALTER TABLE resources ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Force Re-create 'resource_shares' to ensure correct types (BIGINT vs UUID)
DROP TABLE IF EXISTS resource_shares CASCADE;

CREATE TABLE resource_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_email)
);

-- 3. Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;

-- 4. Clean up ALL old policies (to ensure no conflicts)
DROP POLICY IF EXISTS "Users can view own and public resources" ON resources;
DROP POLICY IF EXISTS "View Resources" ON resources;
DROP POLICY IF EXISTS "Manage Resources" ON resources;
DROP POLICY IF EXISTS "Owner Access Only" ON resources;
DROP POLICY IF EXISTS "Owner Insert" ON resources;
DROP POLICY IF EXISTS "Users can select their own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;
DROP POLICY IF EXISTS "Public resources are viewable by everyone" ON resources;
DROP POLICY IF EXISTS "Shared resources are viewable by invited email" ON resources;

-- 5. Re-create Robust Policies

-- Resources: View (Owner + Public + Shared)
CREATE POLICY "View Resources"
ON resources FOR SELECT
USING (
    user_id = auth.uid()                            -- Owner
    OR is_public = true                             -- Public
    OR EXISTS (                                     -- Shared
        SELECT 1 FROM resource_shares
        WHERE resource_shares.resource_id = resources.id
        AND resource_shares.user_email = (auth.jwt() ->> 'email')
    )
);

-- Resources: Manage (Owner Only)
CREATE POLICY "Manage Resources"
ON resources FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- Resource Shares: Owners only can view/add/remove
DROP POLICY IF EXISTS "View Shares" ON resource_shares;
DROP POLICY IF EXISTS "Manage Shares" ON resource_shares;

CREATE POLICY "View Shares"
ON resource_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);

CREATE POLICY "Manage Shares"
ON resource_shares FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);
