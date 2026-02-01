CREATE TABLE gf_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES gf_users(id) ON DELETE CASCADE UNIQUE,
    scoring_calls_this_cycle INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    reset_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);