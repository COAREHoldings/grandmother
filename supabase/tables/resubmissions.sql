CREATE TABLE resubmissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    original_score DECIMAL(3,1),
    summary_statement_text TEXT,
    extracted_critiques JSONB DEFAULT '[]'::jsonb,
    suggested_responses JSONB DEFAULT '[]'::jsonb,
    introduction_draft TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);