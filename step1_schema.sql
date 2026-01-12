-- STEP 1: Setup Database Schema for Sharing
-- Run this first to add the necessary tables and columns

-- 1. Add is_public column to resources (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE resources ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Create resource_shares table (if not exists)
CREATE TABLE IF NOT EXISTS resource_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_email)
);

-- 3. Enable RLS on resource_shares
ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;

-- Note: We're keeping RLS DISABLED on resources table for now
-- We'll enable it in step 2 after testing the schema works
