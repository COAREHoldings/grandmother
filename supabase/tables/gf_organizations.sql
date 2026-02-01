CREATE TABLE gf_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_type TEXT NOT NULL CHECK (org_type IN ('department',
    'institution',
    'commercial_team')),
    name TEXT NOT NULL,
    seat_limit INTEGER DEFAULT 1,
    contract_value DECIMAL(12,2),
    admin_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);