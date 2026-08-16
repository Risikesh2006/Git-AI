import { createClient } from '@supabase/supabase-js';

/**
 * The single browser Supabase client for the whole app.
 *
 * There must be exactly one instance per browser context. Supabase stores the
 * session under one storage key, so multiple clients mean multiple GoTrue
 * instances each running their own token-refresh timer against that key — which
 * surfaces as intermittent "Invalid Refresh Token" sign-outs that are very hard
 * to reproduce. Supabase logs a "Multiple GoTrueClient instances detected"
 * warning when this happens.
 *
 * Every consumer — AuthProvider, the axios interceptor in lib/api.ts, the OAuth
 * callback route — imports this instance rather than calling `createClient`.
 *
 * Only the public anon key is used here. It is safe to ship to the browser and
 * is constrained by row level security. The service role key belongs exclusively
 * to lib/supabase/server.ts.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

/** GitHub OAuth scopes required by Git AI. */
export const GITHUB_OAUTH_SCOPES = 'read:user user:email repo';
