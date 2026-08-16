'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/components/providers/AuthProvider';

/** Shared shell so the loading and error states sit on the same surface. */
function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--lp-void)] px-5 font-[family-name:var(--font-display)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,199,156,0.09), transparent 68%)' }}
      />
      <div className="lp-grain" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm text-center">{children}</div>
    </main>
  );
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionFailure, setSessionFailure] = useState<string | null>(null);

  /*
    GitHub reports a denied consent screen (or a misconfigured app) as query
    parameters on the redirect, not as a failed session lookup. This is derived
    straight from the URL during render — it is not state, so putting it in state
    would only add a render pass and risk showing a stale message.
  */
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
  const failure = oauthError ? oauthError.replace(/\+/g, ' ') : sessionFailure;

  useEffect(() => {
    // The OAuth provider already told us it failed; no session to wait for.
    if (oauthError) return;

    let cancelled = false;

    const resolveSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          setSessionFailure(error.message);
          return;
        }

        if (data.session) {
          router.replace('/dashboard');
          return;
        }

        /*
          Supabase exchanges the code and writes the session asynchronously via
          its own listener. Rather than a fixed sleep, wait for the auth event —
          with a timeout as the fallback so this can never hang forever.
        */
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (cancelled) return;
          if (session) {
            sub.subscription.unsubscribe();
            router.replace('/dashboard');
          }
        });

        const timeout = setTimeout(async () => {
          if (cancelled) return;
          const { data: retry } = await supabase.auth.getSession();
          sub.subscription.unsubscribe();
          if (retry.session) router.replace('/dashboard');
          else setSessionFailure('We could not establish a session. Please try connecting again.');
        }, 6000);

        return () => {
          clearTimeout(timeout);
          sub.subscription.unsubscribe();
        };
      } catch (err) {
        if (!cancelled) {
          setSessionFailure(err instanceof Error ? err.message : 'Unexpected error during sign-in.');
        }
      }
    };

    resolveSession();

    return () => {
      cancelled = true;
    };
  }, [router, oauthError]);

  if (failure) {
    return (
      <CallbackShell>
        <div className="lp-glass rounded-[22px] p-7" role="alert" aria-live="assertive">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-red-400/25 bg-red-400/[0.07]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-300/80" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>

          <h1 className="lp-display mt-5 text-[19px] font-semibold text-[var(--lp-text)]">Sign-in failed</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--lp-text-muted)]">{failure}</p>

          <button
            type="button"
            onClick={() => router.replace('/')}
            className="lp-focus mt-7 w-full rounded-full bg-[var(--lp-text)] px-5 py-3 text-[13px] font-medium text-[#080b09] transition-colors hover:bg-white"
          >
            Back to Git AI
          </button>
        </div>
      </CallbackShell>
    );
  }

  return (
    <CallbackShell>
      <div className="flex flex-col items-center" role="status" aria-live="polite">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/12 border-t-[var(--lp-sage)]" />
        <h1 className="lp-display mt-7 text-[17px] font-semibold text-[var(--lp-text)]">
          Connecting your GitHub account
        </h1>
        <p className="mt-2.5 text-[13px] text-[var(--lp-text-muted)]">Establishing a secure session...</p>
      </div>
    </CallbackShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <CallbackShell>
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/12 border-t-[var(--lp-sage)]" />
        </CallbackShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
