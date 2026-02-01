CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    institution TEXT,
    orcid_id TEXT,
    expertise JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);