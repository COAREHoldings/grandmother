CREATE TABLE funding_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency TEXT NOT NULL,
    mechanism TEXT,
    foa_number TEXT,
    title TEXT NOT NULL,
    description TEXT,
    keywords JSONB DEFAULT '[]'::jsonb,
    award_ceiling INTEGER,
    deadline DATE,
    success_rate DECIMAL(5,2),
    requirements JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);