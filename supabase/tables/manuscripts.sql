CREATE TABLE manuscripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    target_journals JSONB DEFAULT '[]'::jsonb,
    abstract TEXT,
    introduction TEXT,
    methods TEXT,
    results TEXT,
    discussion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);