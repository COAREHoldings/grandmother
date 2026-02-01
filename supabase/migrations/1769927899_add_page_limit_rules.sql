-- Migration: add_page_limit_rules
-- Created at: 1769927899

-- Add page limit columns to funding rules
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS page_limit_total INTEGER;
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS page_limit_research_strategy INTEGER;
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS page_limit_specific_aims INTEGER DEFAULT 1;
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS page_limit_biosketch INTEGER DEFAULT 5;
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS font_requirements VARCHAR(100);
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS margin_requirements VARCHAR(100);
ALTER TABLE gf_funding_rules ADD COLUMN IF NOT EXISTS line_spacing_requirements VARCHAR(100);

-- Pre-populate funding rules
INSERT INTO gf_funding_rules (funding_program, page_limit_total, page_limit_research_strategy, page_limit_specific_aims, page_limit_biosketch, font_requirements, margin_requirements, line_spacing_requirements, rule_config) VALUES
('nih_r01', 25, 12, 1, 5, 'Arial 11pt or Georgia 11pt', '0.5 inch all sides', 'Single spaced', '{"budget_cap": 500000, "direct_cost_cap": 250000}'),
('nih_r21', 16, 6, 1, 5, 'Arial 11pt or Georgia 11pt', '0.5 inch all sides', 'Single spaced', '{"budget_cap": 275000, "direct_cost_cap": 275000, "max_years": 2}'),
('nih_r03', 10, 6, 1, 5, 'Arial 11pt or Georgia 11pt', '0.5 inch all sides', 'Single spaced', '{"budget_cap": 50000, "max_years": 2}'),
('sbir_phase1', 25, 10, 1, 5, 'Arial 11pt', '1 inch all sides', 'Single spaced', '{"budget_cap": 275000, "duration_months": 12}'),
('sbir_phase2', 50, 25, 1, 5, 'Arial 11pt', '1 inch all sides', 'Single spaced', '{"budget_cap": 1750000, "duration_months": 24}'),
('sttr_phase1', 25, 10, 1, 5, 'Arial 11pt', '1 inch all sides', 'Single spaced', '{"budget_cap": 275000, "duration_months": 12, "academic_min": 30}'),
('sttr_phase2', 50, 25, 1, 5, 'Arial 11pt', '1 inch all sides', 'Single spaced', '{"budget_cap": 1750000, "duration_months": 24, "academic_min": 30}'),
('nsf', 15, 15, 1, 2, 'Arial/Helvetica/Computer Modern 10pt+', '1 inch all sides', 'Single spaced', '{"budget_cap": 500000}'),
('dod', 25, 15, 1, 5, 'Times New Roman 12pt', '1 inch all sides', 'Single spaced', '{"budget_cap": 750000}')
ON CONFLICT DO NOTHING;

-- Create section analytics table
CREATE TABLE IF NOT EXISTS gf_section_analytics (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  word_count INTEGER DEFAULT 0,
  page_estimate DECIMAL(5,2) DEFAULT 0,
  page_limit INTEGER,
  is_over_limit BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);;