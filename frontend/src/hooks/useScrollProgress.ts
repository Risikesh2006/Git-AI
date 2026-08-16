'use client';

import { useRef } from 'react';
import { useScroll, useSpring, type MotionValue } from 'framer-motion';

/**
 * Progress of a single section through the viewport, 0 → 1.
 *
 * Built on Framer's `useScroll`, which reads native scroll position — Lenis
 * drives real `scrollTop` (it is not a virtual-scroll transform), so this
 * stays in sync with the smooth-scrolling without extra wiring.
 */
export function useSectionProgress<T extends HTMLElement = HTMLDivElement>(): {
  ref: React.RefObject<T | null>;
  progress: MotionValue<number>;
  smooth: MotionValue<number>;
} {
  const ref = useRef<T>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Damped copy for driving visuals that would otherwise feel twitchy.
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  return { ref, progress: scrollYProgress, smooth };
}

/**
 * Whole-document scroll progress, 0 → 1.
 * Used by the scroll indicator in the hero frame.
 */
export function usePageProgress(): MotionValue<number> {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}
