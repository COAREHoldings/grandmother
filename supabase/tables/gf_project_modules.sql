CREATE TABLE gf_project_modules (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL,
    module_id INTEGER NOT NULL,
    scores JSONB DEFAULT '{}',
    section_status VARCHAR(20) DEFAULT 'missing',
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);