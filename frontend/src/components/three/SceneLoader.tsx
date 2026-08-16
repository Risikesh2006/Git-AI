'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { EASE } from '@/lib/animations';

/**
 * Premium loading curtain shown while the WebGL context and scene textures
 * come up.
 *
 * `useProgress` reports Three's DefaultLoadingManager, which only advances for
 * managed loaders. This scene generates its textures on the CPU rather than
 * fetching them, so that figure can jump straight to 100 — we therefore gate
 * dismissal on the *scene* reporting ready as well, and ease the displayed
 * number toward its target so it never snaps from 0 to 100 in one frame.
 */
export function SceneLoader({ ready }: { ready: boolean }) {
  const { progress, active } = useProgress();
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(true);

  // Ease the number upward; treat scene-ready as the real completion signal.
  useEffect(() => {
    const target = ready && !active ? 100 : Math.min(progress, 92);
    let frame = 0;

    const tick = () => {
      setShown((current) => {
        const next = current + (target - current) * 0.12;
        return Math.abs(target - next) < 0.4 ? target : next;
      });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress, active, ready]);

  // Hold briefly at 100 so the transition reads as deliberate, not a flicker.
  useEffect(() => {
    if (shown < 99.5) return;
    const id = setTimeout(() => setVisible(false), 420);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--lp-void)]"
          // Decorative: the page content behind it is the real document.
          aria-hidden="true"
        >
          {/* Soft bloom behind the wordmark */}
          <motion.div
            className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(184,199,156,0.10), transparent 68%)' }}
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.06, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Three repository nodes converging on a core — the product in miniature */}
          <div className="relative mb-12 h-14 w-40">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 h-1.5 w-1.5 rounded-full bg-[var(--lp-sage)]"
                style={{ left: `${i * 34}%` }}
                animate={{ x: [0, 62 - i * 21, 62 - i * 21], opacity: [0, 1, 0] }}
                transition={{ duration: 2.2, delay: i * 0.35, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-[var(--lp-sage)]/60" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h1 className="lp-display text-[28px] font-semibold text-[var(--lp-text)]">Git AI</h1>
            <p className="mt-3 text-[13px] text-[var(--lp-text-muted)]">Analyzing your development universe...</p>

            {/* Progress rule */}
            <div className="relative mt-9 h-px w-[240px] overflow-hidden bg-white/[0.09]">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[var(--lp-sage)]"
                style={{ width: `${shown}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
            <span className="lp-num mt-4 text-[11px] text-[var(--lp-text-muted)]">
              {Math.round(shown).toString().padStart(3, '0')}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
