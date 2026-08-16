'use client';

import { useCallback, useRef } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { TILT_SPRING } from '@/lib/animations';
import { useReducedMotion } from './useReducedMotion';

interface UseCardTiltOptions {
  /** Max rotation about X, in degrees. */
  maxX?: number;
  /** Max rotation about Y, in degrees. */
  maxY?: number;
}

/**
 * Cursor-driven 3D tilt for glass cards.
 *
 * Rotation is deliberately capped low (4°/5°) and spring-damped so the effect
 * reads as a subtle parallax of a physical surface rather than a novelty.
 * Returns to rest smoothly on pointer leave. Disabled entirely under
 * prefers-reduced-motion, where the motion values simply stay at zero.
 */
export function useCardTilt({ maxX = 4, maxY = 5 }: UseCardTiltOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Normalised pointer position within the card, 0 → 1 on each axis.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [maxX, -maxX]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxY, maxY]), TILT_SPRING);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    },
    [px, py, reduced]
  );

  const onPointerLeave = useCallback(() => {
    px.set(0.5);
    py.set(0.5);
  }, [px, py]);

  return {
    ref,
    handlers: { onPointerMove, onPointerLeave },
    /** Spread onto a motion element alongside `perspective`. */
    style: reduced ? {} : { rotateX, rotateY, transformStyle: 'preserve-3d' as const },
    reduced,
  };
}
