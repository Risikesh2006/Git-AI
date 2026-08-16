'use client';

import { useCallback, useRef } from 'react';

/**
 * Writes the cursor position onto the element as `--mx` / `--my` custom
 * properties, which the `.lp-spot` class consumes to render a radial
 * highlight that follows the pointer.
 *
 * Values are written straight to the style attribute rather than through
 * React state — this runs on every pointermove and must not re-render.
 */
export function useMouseGlow<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  return { ref, handlers: { onPointerMove } };
}
