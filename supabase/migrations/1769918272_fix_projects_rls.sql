-- Migration: fix_projects_rls
-- Created at: 1769918272


-- Drop and recreate projects insert policy to be more permissive
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
CREATE POLICY "Users can insert projects" ON projects 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role', 'authenticated'));
;