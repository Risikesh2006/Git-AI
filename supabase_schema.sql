-- ============================================================
-- Git AI - Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id TEXT UNIQUE,
    github_username TEXT,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    github_access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPOSITORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    repo_name TEXT NOT NULL,
    description TEXT,
    language TEXT,
    html_url TEXT,
    clone_url TEXT,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT false,
    default_branch TEXT DEFAULT 'main',
    topics JSONB DEFAULT '[]',
    priority_score INTEGER DEFAULT 50,
    importance_score INTEGER,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, repo_name)
);

-- ============================================================
-- REPOSITORY METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.repository_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID UNIQUE REFERENCES public.repositories(id) ON DELETE CASCADE,
    days_since_last_commit INTEGER DEFAULT 0,
    total_commits INTEGER DEFAULT 0,
    recent_commits_30d INTEGER DEFAULT 0,
    num_files INTEGER DEFAULT 0,
    test_files INTEGER DEFAULT 0,
    readme_length INTEGER DEFAULT 0,
    documentation_score INTEGER DEFAULT 0,
    open_issues INTEGER DEFAULT 0,
    repo_size_kb INTEGER DEFAULT 0,
    last_commit_date TIMESTAMPTZ,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    implementation_data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'ignored')),
    estimated_hours NUMERIC,
    priority TEXT DEFAULT 'medium',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    commit_hash TEXT,
    commit_message TEXT NOT NULL,
    pushed BOOLEAN DEFAULT false,
    committed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI RECOMMENDATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
    plan_data JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FEEDBACK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES public.repositories(id) ON DELETE SET NULL,
    recommendation_id UUID REFERENCES public.ai_recommendations(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('completed', 'ignored', 'modified', 'in_progress')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users: can read/write own row
CREATE POLICY "users_own" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Repositories: user-scoped
CREATE POLICY "repos_own" ON public.repositories
    FOR ALL USING (user_id = auth.uid());

-- Repository metrics: via repo ownership
CREATE POLICY "metrics_own" ON public.repository_metrics
    FOR ALL USING (
        repo_id IN (SELECT id FROM public.repositories WHERE user_id = auth.uid())
    );

-- Tasks
CREATE POLICY "tasks_own" ON public.tasks
    FOR ALL USING (user_id = auth.uid());

-- Commits
CREATE POLICY "commits_own" ON public.commits
    FOR ALL USING (user_id = auth.uid());

-- AI Recommendations
CREATE POLICY "ai_recs_own" ON public.ai_recommendations
    FOR ALL USING (user_id = auth.uid());

-- Feedback
CREATE POLICY "feedback_own" ON public.feedback
    FOR ALL USING (user_id = auth.uid());

-- Service role bypass (for backend operations)
CREATE POLICY "service_role_bypass_users" ON public.users
    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_repos" ON public.repositories
    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_metrics" ON public.repository_metrics
    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_tasks" ON public.tasks
    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_commits" ON public.commits
    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_ai" ON public.ai_recommendations
    FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bypass_feedback" ON public.feedback
    FOR ALL TO service_role USING (true);

-- ============================================================
-- INDEXES for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_repos_user_id ON public.repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repos_priority ON public.repositories(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_repo_id ON public.repository_metrics(repo_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_repo_id ON public.tasks(repo_id);
CREATE INDEX IF NOT EXISTS idx_commits_user_id ON public.commits(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- ============================================================
-- SUPABASE AUTH HOOK: Create user record on sign-up
-- Run this function to auto-create users table entries
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
