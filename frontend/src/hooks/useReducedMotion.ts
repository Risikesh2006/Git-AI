'use client';

import { useMediaQuery } from './useMediaQuery';

/**
 * `prefers-reduced-motion` listener.
 *
 * Consumers use it to skip camera scrubbing and continuous float loops while
 * keeping all content and functionality intact.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
