CREATE TABLE gf_funding_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funding_program TEXT NOT NULL UNIQUE,
    rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);