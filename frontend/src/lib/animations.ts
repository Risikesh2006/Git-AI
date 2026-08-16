import type { Variants } from 'framer-motion';

/**
 * Shared motion language for the landing page.
 *
 * A single easing curve is reused everywhere so section reveals, card hovers
 * and the 3D camera all decelerate identically. No bounce, no overshoot.
 */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** Section-level reveal: subtle rise + opacity, never a zoom or bounce. */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

/** Parent wrapper that staggers its children's reveals. */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Word-by-word reveal used for the planner's implementation steps. */
export const wordStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

export const wordChild: Variants = {
  hidden: { opacity: 0, y: '0.4em' },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** Standard viewport config — fire once, slightly before fully in view. */
export const VIEWPORT = { once: true, margin: '-90px' } as const;

/** Spring used for card tilt and magnetic buttons. */
export const TILT_SPRING = { stiffness: 160, damping: 20, mass: 0.5 } as const;

/**
 * Module-level scroll state, written once per frame by LenisProvider's
 * ScrollTrigger and read inside the 3D scene's useFrame loop.
 *
 * Deliberately NOT React state: the camera needs per-frame scroll progress,
 * and storing it in state would re-render the whole tree at 60fps.
 */
export const scrollState = {
  /** Whole-document progress, 0 → 1. */
  progress: 0,
  /** Current viewport height in document-progress units, for velocity feel. */
  velocity: 0,
};

/** Clamp helper. */
export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Framer-friendly float config with per-card variation to avoid sync. */
export const floatTransition = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  ease: 'easeInOut' as const,
});
