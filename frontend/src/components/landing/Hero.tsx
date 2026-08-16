'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { EASE } from '@/lib/animations';
import { PORTFOLIO } from '@/lib/constants';
import { usePageProgress } from '@/hooks/useScrollProgress';
import { GlassCard, MagneticButton } from './primitives';

const STATUS_ROWS = [
  { value: `${PORTFOLIO.activeRepositories}`, label: 'repositories connected' },
  { value: `${PORTFOLIO.needAttention}`, label: 'require attention' },
  { value: '1', label: 'high-impact plan ready' },
];

/**
 * Hero — the product's control surface, presented inside a large rounded frame.
 *
 * The frame itself is transparent: the fixed WebGL network renders behind the
 * whole page and shows through here, so the 3D scene *is* the hero visual
 * rather than a decorative layer stacked under one.
 *
 * Content sits in the lower two corners (large block left, status panel right)
 * rather than centred, which keeps the middle of the frame clear for the
 * intelligence core and gives the composition an intentional asymmetry.
 */
export function Hero({ onConnect }: { onConnect: () => void }) {
  const progress = usePageProgress();
  // Hero-local progress: full bar by the time the first viewport is passed.
  const scaled = useTransform(progress, [0, 0.12], [0, 1], { clamp: true });
  const indicator = useSpring(scaled, { stiffness: 110, damping: 30 });
  const indicatorWidth = useTransform(indicator, (v) => `${Math.max(4, v * 100)}%`);

  return (
    <section id="top" className="relative px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-[var(--lp-border-soft)] sm:min-h-[calc(100vh-40px)] sm:rounded-[38px]">
        {/* Internal frame lighting — a faint vignette that seats the 3D scene
            inside the frame instead of letting it bleed to the edges. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 8%, rgba(184,199,156,0.05), transparent 55%), radial-gradient(100% 100% at 50% 100%, rgba(5,7,6,0.72), transparent 62%)',
          }}
        />
        <div className="lp-grain rounded-[inherit]" aria-hidden="true" />

        {/* Corner registration marks — technical detail, purely visual. */}
        {(
          [
            'left-5 top-5 border-l border-t',
            'right-5 top-5 border-r border-t',
            'left-5 bottom-5 border-b border-l',
            'right-5 bottom-5 border-b border-r',
          ] as const
        ).map((pos) => (
          <span key={pos} aria-hidden="true" className={`pointer-events-none absolute h-4 w-4 border-white/[0.14] ${pos}`} />
        ))}

        <div className="relative z-10 flex min-h-[calc(100vh-24px)] flex-col justify-end p-5 pt-28 sm:min-h-[calc(100vh-40px)] sm:p-8 sm:pt-32 lg:p-10">
          {/* Live analysis status, pinned top-left inside the frame */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            className="absolute left-5 top-24 flex items-center gap-2.5 sm:left-8 sm:top-28 lg:left-10"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lp-sage)] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--lp-sage)]" />
            </span>
            <span className="lp-label">Live analysis · 6 repositories</span>
          </motion.div>

          <div className="grid grid-cols-1 items-end gap-5 lg:grid-cols-12">
            {/* Bottom-left: the pitch */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
              className="lg:col-span-7"
            >
              <GlassCard tilt={false} className="rounded-[24px] p-6 sm:p-9">
                <span className="lp-eyebrow">Local AI · GitHub engineering manager</span>
                <h1 className="lp-display mt-5 max-w-xl text-[clamp(32px,5.4vw,56px)] font-semibold text-[var(--lp-text)]">
                  Know what to build next.
                </h1>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--lp-text-muted)]">
                  Git AI scans your repositories, detects what needs attention, ranks projects by impact and creates a
                  focused development plan you can review and ship.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <MagneticButton onClick={onConnect}>Connect GitHub</MagneticButton>
                  <MagneticButton href="#workflow" variant="ghost">
                    See How It Works
                  </MagneticButton>
                </div>

                <p className="mt-7 flex items-start gap-2 border-t border-white/[0.06] pt-5 text-[12.5px] leading-relaxed text-[var(--lp-text-muted)]">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--lp-sage)]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M12 3l7 3.5v5c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9v-5L12 3z" strokeLinejoin="round" />
                  </svg>
                  Your code stays under your control. Every push requires your approval.
                </p>
              </GlassCard>
            </motion.div>

            {/* Bottom-right: live repository status */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.32, ease: EASE }}
              className="lg:col-span-5"
            >
              <GlassCard className="rounded-[24px] p-6 sm:p-7" floatPeriod={7.5} floatDrift={4}>
                <div className="flex items-center justify-between">
                  <span className="lp-eyebrow">Live repository analysis</span>
                  <span className="lp-num text-[10px] text-[var(--lp-text-muted)]">
                    {PORTFOLIO.healthScore}/100
                  </span>
                </div>

                <ul className="mt-6 flex flex-col gap-4">
                  {STATUS_ROWS.map((row) => (
                    <li key={row.label} className="flex items-baseline gap-3">
                      <span className="lp-num text-[24px] font-semibold text-[var(--lp-text)]">{row.value}</span>
                      <span className="text-[13px] text-[var(--lp-text-muted)]">{row.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-2 border-t border-white/[0.06] pt-5">
                  <span className="h-1 w-1 rounded-full bg-[var(--lp-sage)]" aria-hidden="true" />
                  <span className="lp-label !text-[var(--lp-sage)]">Approval required before push</span>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Scroll cue + progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-7 flex items-center gap-4"
          >
            <div className="flex items-center gap-2.5">
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.14]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-[var(--lp-text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
              <span className="lp-label">Scroll to analyze</span>
            </div>

            <div className="relative h-px flex-1 overflow-hidden bg-white/[0.08]">
              <motion.div className="absolute inset-y-0 left-0 bg-[var(--lp-sage)]" style={{ width: indicatorWidth }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
