-- Add is_public column to resources
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create resource_shares table
CREATE TABLE IF NOT EXISTS resource_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_email)
);

-- Enable RLS on the new table
ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;

-- RESOURCE POLICIES --

-- Allow public access if is_public is true
-- Note: We drop existing policies if they conflict, but pure additions are safer. 
-- Assuming existing policy is "Users can only see their own resources".
-- We need to OR that with public/shared access.
-- Since Supabase policies are permissive (OR), adding new policies works.

CREATE POLICY "Public resources are viewable by everyone"
ON resources FOR SELECT
USING (is_public = true);

CREATE POLICY "Shared resources are viewable by invited email"
ON resources FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM resource_shares
        WHERE resource_shares.resource_id = resources.id
        AND resource_shares.user_email = (auth.jwt() ->> 'email')
    )
);

-- RESOURCE_SHARES POLICIES --

-- 1. Owners can VIEW who they shared with
CREATE POLICY "Owners can view shares"
ON resource_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);

-- 2. Owners can ADD shares
CREATE POLICY "Owners can add shares"
ON resource_shares FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);

-- 3. Owners can REMOVE shares
CREATE POLICY "Owners can delete shares"
ON resource_shares FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM resources
        WHERE resources.id = resource_shares.resource_id
        AND resources.user_id = auth.uid()
    )
);
