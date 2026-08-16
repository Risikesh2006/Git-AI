'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState } from '@/lib/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Smooth scrolling + GSAP synchronisation.
 *
 * Wiring, in order:
 *  1. Lenis owns the scroll animation and writes real `scrollTop`.
 *  2. Every Lenis tick calls `ScrollTrigger.update()` so triggers read the
 *     eased position rather than the raw wheel position.
 *  3. GSAP's ticker — not a second requestAnimationFrame loop — drives
 *     `lenis.raf()`, so both run on one clock and cannot drift apart.
 *  4. `lagSmoothing(0)` is disabled because GSAP's catch-up behaviour fights
 *     scrub animations after a dropped frame.
 *
 * Under prefers-reduced-motion Lenis is not instantiated at all: the page
 * falls back to native scrolling and ScrollTrigger still works normally.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  // Guards against React Strict Mode's double-invoked effect in development
  // creating two Lenis instances bound to the same scroller.
  const initialised = useRef(false);

  useEffect(() => {
    if (reduced) return;
    if (initialised.current) return;
    initialised.current = true;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      // Gentle exponential ease-out — long tail, no elastic finish.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native momentum on touch feels better than emulated smoothing.
      syncTouch: false,
      touchMultiplier: 1.6,
    });

    const onScroll = () => {
      // `progress` is 0 → 1 across the whole document; the 3D camera rig
      // reads this from module scope inside useFrame.
      scrollState.progress = lenis.progress || 0;
      ScrollTrigger.update();
    };

    lenis.on('scroll', onScroll);

    const raf = (time: number) => {
      // GSAP ticker time is in seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Recalculate trigger positions once fonts/images have settled.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      scrollState.progress = 0;
      initialised.current = false;
    };
  }, [reduced]);

  /*
    With Lenis disabled we still need scroll progress for the 3D rig, so
    fall back to a passive listener. Cheap: one read per scroll event.
  */
  useEffect(() => {
    if (!reduced) return;

    const onNativeScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.progress = max > 0 ? window.scrollY / max : 0;
    };

    onNativeScroll();
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    return () => window.removeEventListener('scroll', onNativeScroll);
  }, [reduced]);

  return <>{children}</>;
}
