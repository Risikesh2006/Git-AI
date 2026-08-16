import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client, holding the service role key.
 *
 * The `server-only` import at the top is the safety mechanism: if any Client
 * Component ever imports this module, the build fails rather than silently
 * bundling the service role key into the browser payload.
 *
 * The service role key bypasses row level security entirely — never expose it,
 * never prefix it with NEXT_PUBLIC_, and never import this from a `'use client'`
 * file.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');

  return createClient(url, serviceRoleKey, {
    auth: {
      // No session to persist or refresh on the server.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
