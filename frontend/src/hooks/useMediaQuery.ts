'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * Uses `useSyncExternalStore` rather than useState + useEffect: matchMedia is an
 * external store, and reading it through this API avoids the extra render pass
 * (and the cascading-render lint violation) that setting state inside an effect
 * would cause. It also gives a correct server snapshot for free.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // On the server assume "not matching" so markup is deterministic; the client
  // corrects on hydration without a layout shift because both branches render
  // the same DOM structure.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
