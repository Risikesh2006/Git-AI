'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { WORKFLOW_STAGES } from '@/lib/constants';
import { useSectionProgress } from '@/hooks/useScrollProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GlassCard, SectionHeading } from './primitives';

/**
 * Section 7 — the workflow, as a scroll-driven path.
 *
 * The section's own scroll progress selects the active stage, so scrubbing
 * through the section walks the pipeline one step at a time. The connector is a
 * single SVG path whose stroke draws in with progress, and a pulse rides along
 * it via `offset-path` so the motion follows the exact curve rather than
 * approximating it with keyframed translations.
 */
export function WorkflowSection() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(progress, 'change', (value) => {
    // The section enters at 0 and leaves at 1; the middle 60% maps to the six
    // stages so the first and last are not skipped past instantly.
    const windowed = (value - 0.2) / 0.6;
    const index = Math.floor(windowed * WORKFLOW_STAGES.length);
    setActiveIndex(Math.max(0, Math.min(WORKFLOW_STAGES.length - 1, index)));
  });

  // Users who opted out of motion see the full pipeline as reached, rather than
  // a rail that never fills because there is no scrub to drive it.
  const allActive = useReducedMotion();

  return (
    <section id="workflow" ref={ref} className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Workflow"
          title="From repository signals to meaningful contributions."
          body="Six stages, and you hold the gate on the last one."
          className="max-w-xl"
        />

        {/* Desktop connector rail */}
        <div className="relative mt-16 hidden lg:block">
          <svg
            className="pointer-events-none absolute inset-x-0 -top-2 h-24 w-full"
            viewBox="0 0 1200 96"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Static rail */}
            <path
              d="M40 68 C 220 68, 200 20, 380 20 S 560 68, 740 68 S 920 20, 1160 20"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            {/* Progress trace */}
            <motion.path
              d="M40 68 C 220 68, 200 20, 380 20 S 560 68, 740 68 S 920 20, 1160 20"
              stroke="var(--lp-sage)"
              strokeWidth="1.4"
              strokeLinecap="round"
              style={{ pathLength: allActive ? 1 : progress, opacity: 0.65 }}
            />
          </svg>

          {/* Travelling data pulse — follows the same curve via offset-path. */}
          {!allActive && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-24 w-full"
              style={{ containerType: 'inline-size' }}
            >
              <motion.span
                className="absolute h-1.5 w-1.5 rounded-full bg-[var(--lp-glow)]"
                style={{
                  offsetPath:
                    'path("M40 68 C 220 68, 200 20, 380 20 S 560 68, 740 68 S 920 20, 1160 20")',
                  boxShadow: '0 0 10px rgba(216,232,184,0.9)',
                }}
                animate={{ offsetDistance: ['0%', '100%'] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
              />
            </span>
          )}
        </div>

        <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {WORKFLOW_STAGES.map((stage, i) => {
            const reached = allActive || i <= activeIndex;
            const isCurrent = !allActive && i === activeIndex;

            return (
              <motion.li
                key={stage.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                // Stagger the vertical rhythm so the row is not a flat strip.
                className={i % 2 === 1 ? 'lg:-translate-y-5' : ''}
              >
                <GlassCard
                  className={`flex h-full flex-col rounded-[18px] p-5 transition-colors duration-500 ${
                    isCurrent ? '!border-[var(--lp-sage)]/35' : ''
                  }`}
                  tilt={false}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`lp-num flex h-7 w-7 items-center justify-center rounded-full border text-[10px] transition-colors duration-500 ${
                        reached
                          ? 'border-[var(--lp-sage)]/45 text-[var(--lp-sage)]'
                          : 'border-white/10 text-[var(--lp-text-muted)]'
                      }`}
                    >
                      {stage.index}
                    </span>
                    {/* Active marker */}
                    <span
                      aria-hidden="true"
                      className={`h-1 w-1 rounded-full transition-all duration-500 ${
                        isCurrent ? 'scale-150 bg-[var(--lp-glow)]' : reached ? 'bg-[var(--lp-sage)]/50' : 'bg-white/10'
                      }`}
                    />
                  </div>

                  <h3
                    className={`lp-display mt-4 text-[14.5px] font-semibold transition-colors duration-500 ${
                      reached ? 'text-[var(--lp-text)]' : 'text-[var(--lp-text-muted)]'
                    }`}
                  >
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--lp-text-muted)]">{stage.description}</p>
                </GlassCard>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
