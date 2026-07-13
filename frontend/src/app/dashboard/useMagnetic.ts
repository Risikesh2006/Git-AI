'use client';

import { useEffect, useRef } from 'react';

export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const max = 120;
      const pull = Math.max(0, 1 - dist / max);
      el.style.transform = `translate(${dx * pull * 0.15}px, ${dy * pull * 0.15}px)`;
    };

    const onLeave = () => {
      el.style.transform = 'translate(0px, 0px)';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.style.transform = '';
    };
  }, [strength]);

  return ref;
}
