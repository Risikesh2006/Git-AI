'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { SCANNER_METRICS, SCANNER_SIGNALS, SCANNER_TREE } from '@/lib/constants';
import { GlassCard, Reveal, SectionHeading } from './primitives';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Section 3 — the scanner reading a real repository.
 *
 * The sweep line is the point of the section: a thin sage rule travelling down
 * the file tree, with each row lighting up as it passes. That single motion
 * communicates "this is being read, file by file" better than any icon could.
 */
export function RepositoryScanner() {
  const reduced = useReducedMotion();

  return (
    <section id="product" className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Repository scanner"
          title="See the real state of every project."
          body="Commits, branches, tests, documentation and unfinished work — read directly from the source, not self-reported."
          className="max-w-2xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* File tree with scan sweep */}
          <Reveal className="lg:col-span-5">
            <GlassCard tilt={false} className="relative h-full overflow-hidden rounded-[24px] p-7">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[var(--lp-text)]">Memory OS</span>
                <span className="lp-label">Scanning</span>
              </div>

              <div className="relative mt-6">
                {/* Sweep line */}
                {!reduced && (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-10 h-px"
                    style={{
                      background: 'linear-gradient(90deg, transparent, var(--lp-sage), transparent)',
                      boxShadow: '0 0 12px rgba(184,199,156,0.6)',
                    }}
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
                  />
                )}

                <ul className="flex flex-col gap-0.5 font-[family-name:var(--font-tech)] text-[12.5px]">
                  {SCANNER_TREE.map((node, i) => (
                    <motion.li
                      key={node.path}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
                      className="flex items-center gap-2 rounded py-1.5 text-[var(--lp-text-muted)]"
                      style={{ paddingLeft: `${node.depth * 18}px` }}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--lp-sage)]/60" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinejoin="round" />
                      </svg>
                      {node.path}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Signals being extracted */}
              <div className="mt-7 border-t border-white/[0.07] pt-6">
                <span className="lp-label">Signals extracted</span>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {SCANNER_SIGNALS.map((signal, i) => (
                    <motion.span
                      key={signal}
                      initial={{ opacity: 0, scale: 0.94 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: EASE }}
                      className="rounded-full border border-white/[0.09] bg-white/[0.025] px-2.5 py-1 text-[10.5px] text-[var(--lp-text-muted)]"
                    >
                      {signal}
                    </motion.span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </Reveal>

          {/* Extracted metrics */}
          <Reveal delay={0.12} className="lg:col-span-7">
            <GlassCard tilt={false} className="h-full rounded-[24px] p-7">
              <div className="flex items-center justify-between">
                <span className="lp-eyebrow">Extracted metrics</span>
                <span className="lp-label">Last scan · 2m ago</span>
              </div>

              <dl className="mt-7 grid grid-cols-2 gap-x-8 sm:grid-cols-3">
                {SCANNER_METRICS.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                    className="flex flex-col gap-1 border-b border-white/[0.05] py-4"
                  >
                    <dd className="lp-num text-[19px] font-semibold text-[var(--lp-text)]">{metric.value}</dd>
                    <dt className="lp-label leading-tight">{metric.label}</dt>
                  </motion.div>
                ))}
              </dl>

              <p className="mt-6 text-[13px] leading-relaxed text-[var(--lp-text-muted)]">
                These figures are the model&rsquo;s inputs. Nothing is inferred from repository names or descriptions —
                the score reflects what is actually in the codebase.
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
