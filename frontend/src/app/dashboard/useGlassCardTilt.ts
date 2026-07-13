'use client';

import { useEffect, useRef } from 'react';

export function useGlassCardTilt(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const handlers = new Map<HTMLElement, { move: (e: MouseEvent) => void; leave: () => void }>();

    const attach = () => {
      const cards = container.querySelectorAll<HTMLElement>('.glass-card-interactive');

      cards.forEach((card) => {
        if (handlers.has(card)) return;

        const onMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 50;
          const rotateY = (centerX - x) / 50;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const onLeave = () => {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        };

        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);
        handlers.set(card, { move: onMove, leave: onLeave });
      });
    };

    attach();

    const observer = new MutationObserver(attach);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      handlers.forEach(({ move, leave }, card) => {
        card.removeEventListener('mousemove', move);
        card.removeEventListener('mouseleave', leave);
        card.style.transform = '';
      });
    };
  }, [active]);

  return containerRef;
}
