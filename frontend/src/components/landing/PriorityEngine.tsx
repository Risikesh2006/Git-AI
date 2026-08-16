'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { RANKING_RATIONALE, REPOSITORIES } from '@/lib/constants';
import { Counter, GlassCard, Reveal, SectionHeading } from './primitives';

/**
 * Section 4 — the ML priority engine.
 *
 * Repositories animate from a scattered arrangement into their final ranked
 * order, mirroring what the 3D nodes are doing behind this section. The
 * explainability panel is the important half: a score nobody can interrogate is
 * a score nobody will act on.
 */
export function PriorityEngine() {
  return (
    <section className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="ML priority engine"
          title="AI intelligence across your entire development workflow."
          body="A custom machine-learning model ranks repositories using activity, technical debt, documentation quality, tests, open issues and the project importance you set yourself."
          className="max-w-2xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Ranked nodes settling into position */}
          <Reveal className="lg:col-span-7">
            <GlassCard tilt={false} className="h-full rounded-[24px] p-7">
              <div className="flex items-center justify-between">
                <span className="lp-eyebrow">Ranked output</span>
                <span className="lp-label">Weighted score · 0–100</span>
              </div>

              <div className="mt-7 flex flex-col gap-2.5">
                {REPOSITORIES.map((repo, i) => (
                  <motion.div
                    key={repo.id}
                    // Rows arrive from alternating offsets, then settle — reads as
                    // reordering rather than a plain list fade-in.
                    initial={{ opacity: 0, y: i % 2 === 0 ? 26 : -18, x: i % 3 === 0 ? -14 : 12 }}
                    whileInView={{ opacity: 1, y: 0, x: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.85, delay: i * 0.11, ease: EASE }}
                    className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 ${
                      i === 0
                        ? 'border-[var(--lp-sage)]/25 bg-[var(--lp-sage)]/[0.05]'
                        : 'border-white/[0.06] bg-white/[0.015]'
                    }`}
                  >
                    <span
                      className={`lp-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                        i === 0
                          ? 'border-[var(--lp-sage)]/40 text-[var(--lp-sage)]'
                          : 'border-white/10 text-[var(--lp-text-muted)]'
                      }`}
                    >
                      {i + 1}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--lp-text)]">
                      {repo.name}
                    </span>

                    <span className="lp-label hidden shrink-0 sm:block">{repo.status}</span>

                    <Counter
                      value={repo.priority}
                      duration={1.3}
                      className={`w-9 shrink-0 text-right text-[18px] font-semibold ${
                        i === 0 ? 'text-[var(--lp-sage)]' : 'text-[var(--lp-text)]'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          {/* Explainability */}
          <Reveal delay={0.14} className="lg:col-span-5">
            <GlassCard className="h-full rounded-[24px] p-7" floatPeriod={9.1} floatDelay={0.4}>
              <span className="lp-eyebrow">Model explainability</span>
              <h3 className="lp-display mt-4 text-[19px] font-semibold text-[var(--lp-text)]">
                Why Memory OS ranks first
              </h3>

              <ul className="mt-6 flex flex-col gap-0">
                {RANKING_RATIONALE.map((reason, i) => (
                  <motion.li
                    key={reason}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: EASE }}
                    className="flex items-start gap-3 border-b border-white/[0.05] py-3 last:border-b-0"
                  >
                    <span className="lp-num mt-0.5 shrink-0 text-[10px] text-[var(--lp-sage)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13px] leading-relaxed text-[var(--lp-text-muted)]">{reason}</span>
                  </motion.li>
                ))}
              </ul>

              <p className="mt-6 border-t border-white/[0.07] pt-5 text-[12px] leading-relaxed text-[var(--lp-text-muted)]">
                Scores are a ranking aid, not a verdict. You can override project importance at any time and the model
                re-weights around it.
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
