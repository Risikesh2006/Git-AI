'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { ARCHITECTURE_FLOW, SECURITY_POINTS } from '@/lib/constants';
import { GlassCard, Reveal, SectionHeading } from './primitives';

/**
 * Sections 9 — local-first intelligence and the security posture.
 *
 * The architecture is drawn as a real pipeline: each stage is a node on a
 * vertical rail with a connector that draws in on scroll, and the human-review
 * stage is marked as the gate rather than being one node among equals. That
 * emphasis is the whole argument of the section.
 */
export function LocalAISection() {
  // The human-review stage is the gate; call it out visually.
  const gateIndex = ARCHITECTURE_FLOW.indexOf('Human review');

  return (
    <section id="architecture" className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Local-first intelligence"
          title="Powerful reasoning without surrendering your code."
          body="Git AI can use a local LM Studio model for planning and commit assistance, while repository analysis, authentication and action history stay under the application's control."
          className="max-w-2xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Architecture pipeline */}
          <Reveal className="lg:col-span-5">
            <GlassCard tilt={false} className="h-full rounded-[24px] p-7">
              <span className="lp-eyebrow">Data path</span>

              <ol className="relative mt-7">
                {/* Vertical rail */}
                <motion.span
                  aria-hidden="true"
                  className="absolute left-[11px] top-2 w-px origin-top bg-gradient-to-b from-[var(--lp-sage)]/50 via-white/[0.12] to-transparent"
                  style={{ bottom: '1.5rem' }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={VIEWPORT}
                  transition={{ duration: 1.5, ease: EASE }}
                />

                {ARCHITECTURE_FLOW.map((stage, i) => {
                  const isGate = i === gateIndex;
                  return (
                    <motion.li
                      key={stage}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.5, delay: i * 0.09, ease: EASE }}
                      className="relative flex items-center gap-4 pb-6 last:pb-0"
                    >
                      <span
                        className={`relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border ${
                          isGate
                            ? 'border-[var(--lp-sage)] bg-[var(--lp-sage)]/15'
                            : 'border-white/[0.14] bg-[var(--lp-near-black)]'
                        }`}
                      >
                        {isGate ? (
                          <svg viewBox="0 0 24 24" className="h-3 w-3 text-[var(--lp-sage)]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-[var(--lp-text-muted)]" />
                        )}
                      </span>

                      <div className="min-w-0">
                        <span className={`text-[13.5px] ${isGate ? 'font-medium text-[var(--lp-text)]' : 'text-[var(--lp-text-muted)]'}`}>
                          {stage}
                        </span>
                        {isGate && <span className="lp-label ml-2 !text-[9px] !text-[var(--lp-sage)]">Approval gate</span>}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </GlassCard>
          </Reveal>

          {/* Security guarantees */}
          <div id="security" className="lg:col-span-7">
            <Reveal delay={0.12}>
              <GlassCard tilt={false} className="h-full rounded-[24px] p-7">
                <div className="flex items-center justify-between">
                  <span className="lp-eyebrow">Security posture</span>
                  <span className="lp-label">Enforced server-side</span>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  {SECURITY_POINTS.map((point, i) => (
                    <motion.div
                      key={point.title}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                      className="border-b border-white/[0.05] py-4"
                    >
                      <div className="flex items-baseline gap-2.5">
                        <span className="lp-num text-[10px] text-[var(--lp-sage)]">{String(i + 1).padStart(2, '0')}</span>
                        <h3 className="text-[13.5px] font-medium text-[var(--lp-text)]">{point.title}</h3>
                      </div>
                      <p className="mt-1.5 pl-[26px] text-[12.5px] leading-relaxed text-[var(--lp-text-muted)]">
                        {point.detail}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
