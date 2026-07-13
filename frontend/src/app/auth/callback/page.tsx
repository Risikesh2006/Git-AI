'use client';

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/components/providers/AuthProvider';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase handles the OAuth code exchange automatically
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Callback] Session error:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (session) {
          router.push('/dashboard');
        } else {
          // Wait a moment for session to establish
          setTimeout(async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            router.push(s ? '/dashboard' : '/?error=no_session');
          }, 1500);
        }
      } catch (err) {
        console.error('[Callback] Error:', err);
        router.push('/?error=callback_error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Connecting your GitHub account...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
