'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { MagneticButton, Reveal } from './primitives';

/** GitHub mark, drawn inline so no icon font or remote asset is needed. */
function GitHubMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1-.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.99-.4 3-.4 1.02 0 2.05.13 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.7.8.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/**
 * Section 11 — final CTA.
 *
 * Sits inside its own rounded frame, echoing the hero, so the page closes on the
 * same visual note it opened with. The bloom behind the GitHub mark is the one
 * moment the sage accent is allowed to be the brightest thing on screen.
 */
export function FinalCTA({ onConnect }: { onConnect: () => void }) {
  return (
    <section className="relative px-3 py-20 sm:px-5 sm:py-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-[var(--lp-border-soft)] px-6 py-20 text-center sm:rounded-[36px] sm:px-12 sm:py-28">
          <div className="lp-grain rounded-[inherit]" aria-hidden="true" />

          {/* Cinematic bloom behind the mark */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[14%] h-[380px] w-[380px] -translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(184,199,156,0.16), transparent 66%)' }}
            animate={{ opacity: [0.55, 0.95, 0.55], scale: [1, 1.07, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Data lines converging on the mark */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full opacity-40"
            viewBox="0 0 600 160"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {[
              'M20 20 C 160 20, 220 110, 300 118',
              'M580 20 C 440 20, 380 110, 300 118',
              'M120 150 C 200 150, 250 130, 300 118',
              'M480 150 C 400 150, 350 130, 300 118',
            ].map((d, i) => (
              <motion.path
                key={d}
                d={d}
                stroke="var(--lp-sage)"
                strokeWidth="0.8"
                strokeDasharray="3 7"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                viewport={VIEWPORT}
                transition={{ duration: 1.8, delay: 0.25 + i * 0.16, ease: EASE }}
              />
            ))}
          </svg>

          <div className="relative z-10">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-[var(--lp-text)]">
              <GitHubMark className="h-5 w-5" />
            </span>

            <h2 className="lp-display mx-auto mt-9 max-w-2xl text-[clamp(28px,5vw,50px)] font-semibold text-[var(--lp-text)]">
              Stop guessing what to work on next.
            </h2>

            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[var(--lp-text-muted)]">
              Connect GitHub and turn repository signals into focused development progress that actually ships.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton onClick={onConnect} className="!px-8 !py-4 !text-[14px]">
                <GitHubMark className="h-4 w-4" />
                Connect GitHub
              </MagneticButton>
              <MagneticButton href="#architecture" variant="ghost" className="!px-8 !py-4 !text-[14px]">
                View Documentation
              </MagneticButton>
            </div>

            <p className="lp-label mt-9">Every push requires your approval.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
