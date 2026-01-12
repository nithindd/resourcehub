-- DEBUG: OPEN ALL ACCESS
-- This will disable Row Level Security on the resources table.
-- ALL files should become visible immediately.

ALTER TABLE resources DISABLE ROW LEVEL SECURITY;

-- If this works, it means your data exists but the 'user_id' check was failing.
-- If this DOES NOT work (still no files), then the 'resources' table itself might be empty.
