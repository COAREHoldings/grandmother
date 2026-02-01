-- Migration: gf_rls_and_triggers
-- Created at: 1769925808


-- Enable RLS
ALTER TABLE gf_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_funding_rules ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their org" ON gf_organizations FOR SELECT USING (
  id IN (SELECT organization_id FROM gf_users WHERE id = auth.uid())
  OR admin_user_id = auth.uid()
);
CREATE POLICY "Admins can update their org" ON gf_organizations FOR UPDATE USING (admin_user_id = auth.uid());

-- Users policies
CREATE POLICY "Users can view own profile" ON gf_users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON gf_users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Allow insert for authenticated" ON gf_users FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies  
CREATE POLICY "Users can CRUD own projects" ON gf_projects FOR ALL USING (user_id = auth.uid());

-- AI Usage policies
CREATE POLICY "Users can view own usage" ON gf_ai_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own usage" ON gf_ai_usage FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Allow insert usage" ON gf_ai_usage FOR INSERT WITH CHECK (user_id = auth.uid());

-- Funding rules - public read
CREATE POLICY "Anyone can read funding rules" ON gf_funding_rules FOR SELECT USING (true);

-- Trigger to create gf_users and ai_usage on signup
CREATE OR REPLACE FUNCTION public.handle_gf_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.gf_users (id, email, user_type, plan_tier)
  VALUES (NEW.id, NEW.email, 'academic', 'fellow')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.gf_ai_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_gf_auth_user_created ON auth.users;
CREATE TRIGGER on_gf_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_gf_new_user();
;