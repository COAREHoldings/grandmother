CREATE TABLE gf_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('academic',
    'commercial')),
    academic_verified BOOLEAN DEFAULT FALSE,
    verification_method TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'fellow',
    billing_cycle TEXT DEFAULT 'monthly',
    subscription_status TEXT DEFAULT 'active',
    organization_id UUID REFERENCES gf_organizations(id),
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);