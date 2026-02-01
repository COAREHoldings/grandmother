CREATE TABLE gf_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES gf_users(id) ON DELETE CASCADE,
    title TEXT,
    funding_program TEXT NOT NULL,
    award_type TEXT NOT NULL CHECK (award_type IN ('grant',
    'contract',
    'cooperative_agreement')),
    phase_type TEXT CHECK (phase_type IN ('phase1',
    'phase2',
    'phase2b',
    'fasttrack')),
    academic_partner_required BOOLEAN DEFAULT FALSE,
    academic_allocation_percent INTEGER,
    status TEXT DEFAULT 'draft',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);