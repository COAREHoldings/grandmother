CREATE TABLE gf_modules (
    id SERIAL PRIMARY KEY,
    module_number INTEGER NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    sub_questions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);