'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { LenisProvider } from '@/components/providers/LenisProvider';
import { toast } from '@/components/ui/Toaster';

import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { RepositoryIntelligence } from '@/components/landing/RepositoryIntelligence';
import { RepositoryScanner } from '@/components/landing/RepositoryScanner';
import { PriorityEngine } from '@/components/landing/PriorityEngine';
import { DailyPlanner } from '@/components/landing/DailyPlanner';
import { CapabilityGrid } from '@/components/landing/CapabilityGrid';
import { WorkflowSection } from '@/components/landing/WorkflowSection';
import { CommitAssistant } from '@/components/landing/CommitAssistant';
import { LocalAISection } from '@/components/landing/LocalAISection';
import { TechnologyStrip } from '@/components/landing/TechnologyStrip';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

/*
  The WebGL environment is client-only: it touches `window`, WebGL contexts and
  the 2D canvas API at module scope, none of which exist during prerender.
  `ssr: false` is legal here because this file is a Client Component.

  Loading it dynamically also keeps three/R3F out of the initial bundle, so the
  first paint of the page content is not blocked on the 3D layer.
*/
const GitAIScene = dynamic(() => import('@/components/three/GitAIScene'), {
  ssr: false,
});

/**
 * Git AI landing page.
 *
 * Layer order:
 *   z-0   fixed WebGL repository network (decorative, aria-hidden)
 *   z-10  page content
 *   z-50  floating navigation
 *   z-100 loading curtain
 *
 * Signed-in visitors are redirected to the dashboard, so this route only ever
 * renders for anonymous traffic.
 */
export default function HomePage() {
  const { user, loading, signInWithGithub } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  /*
    Surface an OAuth failure that redirected back to the landing page. Read from
    `window.location` rather than `useSearchParams` so this component does not
    need a Suspense boundary and can still be statically prerendered.
  */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error_description') ?? params.get('error');
    if (!error) return;

    toast.error(
      error === 'auth_failed' || error === 'no_session' || error === 'callback_error'
        ? 'GitHub sign-in did not complete. Please try again.'
        : error.replace(/\+/g, ' ')
    );

    // Clear the parameter so a refresh does not re-announce the same error.
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const handleConnectGitHub = async () => {
    try {
      await signInWithGithub();
    } catch {
      toast.error('Could not start GitHub sign-in. Please try again.');
    }
  };

  /*
    The page is NOT gated on `loading`.

    Blocking the render until the Supabase session check resolves would ship an
    empty document: no marketing copy for crawlers, nothing to paint, and a
    guaranteed layout shift when content finally arrives. Anonymous visitors are
    the overwhelming majority here and they need none of that round-trip.

    Signed-in visitors are redirected by the effect above the moment `loading`
    resolves, which costs them a brief glimpse of the hero — the right trade
    against a blank first paint for everyone else.
  */
  return (
    <LenisProvider>
      <div className="relative min-h-screen bg-[var(--lp-void)] font-[family-name:var(--font-display)] text-[var(--lp-text)]">
        <GitAIScene />

        <Navbar onConnect={handleConnectGitHub} />

        <main className="relative z-10">
          <Hero onConnect={handleConnectGitHub} />
          <RepositoryIntelligence />
          <RepositoryScanner />
          <PriorityEngine />
          <DailyPlanner />
          <CapabilityGrid />
          <WorkflowSection />
          <CommitAssistant />
          <LocalAISection />
          <TechnologyStrip />
          <FinalCTA onConnect={handleConnectGitHub} />
        </main>

        <Footer />
      </div>
    </LenisProvider>
  );
}
