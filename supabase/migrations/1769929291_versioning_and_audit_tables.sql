-- Migration: versioning_and_audit_tables
-- Created at: 1769929291

-- Project versions table
CREATE TABLE IF NOT EXISTS gf_project_versions (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- Section versions table
CREATE TABLE IF NOT EXISTS gf_section_versions (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  content TEXT,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score history table
CREATE TABLE IF NOT EXISTS gf_score_history (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  module_scores JSONB NOT NULL DEFAULT '{}',
  weighted_score DECIMAL(5,2),
  nih_score DECIMAL(3,1),
  probability_band VARCHAR(20),
  structural_cap_applied BOOLEAN DEFAULT FALSE,
  model_version VARCHAR(50) DEFAULT 'heuristic_v1',
  prompt_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS gf_audit_log (
  id SERIAL PRIMARY KEY,
  project_id UUID,
  user_id UUID,
  event_type VARCHAR(50) NOT NULL,
  scoring_method VARCHAR(50),
  rule_set_version VARCHAR(20) DEFAULT '1.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add probability bands to funding rules
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS probability_bands JSONB DEFAULT '{
  "1-3": "45-60%",
  "4-5": "20-35%",
  "6-7": "10-20%",
  "8-9": "<10%"
}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_versions_project ON gf_project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_score_history_project ON gf_score_history(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_project ON gf_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON gf_audit_log(event_type);;