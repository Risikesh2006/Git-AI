'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { PORTFOLIO, REPOSITORIES } from '@/lib/constants';
import { Counter, GlassCard, Reveal, SectionHeading } from './primitives';

/** Circular health gauge — an SVG arc, drawn to spec rather than charted. */
function HealthDial({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-[150px] w-[150px] items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        {/* Tick marks give the dial an instrument feel. */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * Math.PI * 2;
          const inner = 46;
          const outer = i % 5 === 0 ? 40 : 43;
          return (
            <line
              key={i}
              x1={70 + Math.cos(angle) * inner}
              y1={70 + Math.sin(angle) * inner}
              x2={70 + Math.cos(angle) * outer}
              y2={70 + Math.sin(angle) * outer}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
          );
        })}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--lp-sage)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - score / 100) }}
          viewport={VIEWPORT}
          transition={{ duration: 1.7, ease: EASE }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Counter value={score} className="text-[34px] font-semibold text-[var(--lp-text)]" />
        <span className="lp-label mt-1">Health</span>
      </div>
    </div>
  );
}

/**
 * Section 2 — turns raw repository signal into a single defensible score, then
 * shows the resulting ranking. Bars animate to width on entry, and the ranking
 * rows stagger in ranked order so the eye lands on the top scorer first.
 */
export function RepositoryIntelligence() {
  return (
    <section id="intelligence" className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Repository intelligence"
          title="Every repository tells you what it needs."
          body="Git AI converts commit activity, open issues, tests, documentation, code structure and project importance into a clear priority score."
          className="max-w-2xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Portfolio summary */}
          <Reveal className="lg:col-span-5">
            <GlassCard className="h-full rounded-[24px] p-7" floatPeriod={8.2}>
              <span className="lp-eyebrow">GitHub health score</span>

              <div className="mt-6 flex justify-center">
                <HealthDial score={PORTFOLIO.healthScore} />
              </div>

              <dl className="mt-8 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-6">
                {[
                  { label: 'Active repos', value: PORTFOLIO.activeRepositories },
                  { label: 'Need attention', value: PORTFOLIO.needAttention },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <dd className="lp-num text-[20px] font-semibold text-[var(--lp-text)]">
                      <Counter value={stat.value} duration={1} />
                    </dd>
                    <dt className="lp-label leading-tight">{stat.label}</dt>
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <dd className="lp-num text-[20px] font-semibold text-[var(--lp-sage)]">{PORTFOLIO.recommendedFocus}</dd>
                  <dt className="lp-label leading-tight">Focus today</dt>
                </div>
              </dl>
            </GlassCard>
          </Reveal>

          {/* Ranking */}
          <Reveal delay={0.12} className="lg:col-span-7">
            <GlassCard tilt={false} className="h-full rounded-[24px] p-7">
              <div className="flex items-center justify-between">
                <span className="lp-eyebrow">Priority ranking</span>
                <span className="lp-label">ML priority engine</span>
              </div>

              <ol className="mt-7 flex flex-col">
                {REPOSITORIES.map((repo, i) => (
                  <motion.li
                    key={repo.id}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.6, delay: i * 0.09, ease: EASE }}
                    className="group flex items-center gap-4 border-b border-white/[0.05] py-4 last:border-b-0"
                  >
                    <span className="lp-num w-4 shrink-0 text-[11px] text-[var(--lp-text-muted)]">{i + 1}</span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="truncate text-[14px] font-medium text-[var(--lp-text)]">{repo.name}</span>
                        {repo.priority >= 80 && (
                          <span className="lp-label shrink-0 rounded-full border border-[var(--lp-sage)]/25 px-2 py-0.5 !text-[9px] !text-[var(--lp-sage)]">
                            Attention
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: repo.priority >= 80 ? 'var(--lp-sage)' : 'rgba(215,219,212,0.45)',
                          }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${repo.priority}%` }}
                          viewport={VIEWPORT}
                          transition={{ duration: 1.3, delay: 0.15 + i * 0.09, ease: EASE }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <Counter
                        value={repo.priority}
                        duration={1.2}
                        className={`text-[19px] font-semibold ${
                          repo.priority >= 80 ? 'text-[var(--lp-sage)]' : 'text-[var(--lp-text)]'
                        }`}
                      />
                      <div className="lp-label mt-0.5 !text-[9px]">{repo.language}</div>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
