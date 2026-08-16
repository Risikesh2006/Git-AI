-- ============================================================
-- Git AI — Production readiness migration
-- Adds: repo owner tracking (for the GitHub-API commit engine),
--       per-user usage tracking (LLM spend + scan quotas).
-- RLS audit: every existing table already has RLS enabled with a
-- user-scoped policy + service_role bypass (see supabase_schema.sql)
-- — no changes needed there.
-- ============================================================

ALTER TABLE public.repositories
    ADD COLUMN IF NOT EXISTS repo_owner TEXT;

-- Backfill best-effort from html_url (https://github.com/<owner>/<repo>) for existing rows.
UPDATE public.repositories
SET repo_owner = split_part(regexp_replace(html_url, '^https?://github\.com/', ''), '/', 1)
WHERE repo_owner IS NULL AND html_url IS NOT NULL;

-- ============================================================
-- USAGE TRACKING (Phase 3/4 — per-user LLM spend + scan quotas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('llm_call', 'repo_scan')),
    provider TEXT, -- 'lm_studio' | 'anthropic' | null
    model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_date
    ON public.usage_events (user_id, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_own" ON public.usage_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "service_role_bypass_usage_events" ON public.usage_events
    FOR ALL TO service_role USING (true);
