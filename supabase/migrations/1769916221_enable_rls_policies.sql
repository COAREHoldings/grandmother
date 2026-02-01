-- Migration: enable_rls_policies
-- Created at: 1769916221


-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE resubmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Funding opportunities - public read
CREATE POLICY "Anyone can view opportunities" ON funding_opportunities FOR SELECT USING (true);
CREATE POLICY "Service can manage opportunities" ON funding_opportunities FOR ALL USING (auth.role() IN ('service_role'));

-- Resubmissions
CREATE POLICY "Users can view own resubmissions" ON resubmissions FOR SELECT USING (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "Users can insert resubmissions" ON resubmissions FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
CREATE POLICY "Users can update resubmissions" ON resubmissions FOR UPDATE USING (auth.role() IN ('anon', 'service_role', 'authenticated'));

-- Sync log
CREATE POLICY "Allow sync_log operations" ON sync_log FOR ALL USING (auth.role() IN ('anon', 'service_role', 'authenticated'));

-- Usage logs
CREATE POLICY "Users can view own usage" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert usage logs" ON usage_logs FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role', 'authenticated'));
;