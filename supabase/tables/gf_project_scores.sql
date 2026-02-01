CREATE TABLE gf_project_scores (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL UNIQUE,
    significance INTEGER,
    innovation INTEGER,
    approach INTEGER,
    investigator INTEGER,
    environment INTEGER,
    impact_score INTEGER,
    funding_probability VARCHAR(20),
    module_strength JSONB DEFAULT '{}',
    scored_at TIMESTAMPTZ DEFAULT NOW()
);