CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    source_module TEXT NOT NULL,
    target_modules JSONB DEFAULT '[]'::jsonb,
    changes JSONB DEFAULT '{}'::jsonb,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);