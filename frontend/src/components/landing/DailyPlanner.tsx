'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT, wordChild, wordStagger } from '@/lib/animations';
import { TOP_TASK } from '@/lib/constants';
import { GlassCard, MagneticButton, Reveal, SectionHeading } from './primitives';

/** Splits a step into words so each can be revealed independently. */
function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  return (
    <motion.span
      variants={wordStagger}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={`inline-flex flex-wrap ${className}`}
    >
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="overflow-hidden">
          <motion.span variants={wordChild} className="mr-[0.28em] inline-block">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Section 5 — the planner's output for today.
 *
 * Implementation steps use a word-level stagger, which makes the plan feel like
 * it is being written out by the model rather than simply appearing.
 */
export function DailyPlanner() {
  return (
    <section className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Daily AI planner"
          title="Turn repository signals into a real development plan."
          body="LM Studio runs locally as the reasoning engine, turning the scanner's findings into one concrete task with steps you can start immediately."
          className="max-w-2xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* The task */}
          <Reveal className="lg:col-span-7">
            <GlassCard tilt={false} className="h-full rounded-[24px] p-7 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="lp-eyebrow">Today&rsquo;s priority</span>
                <span className="lp-label flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[var(--lp-sage)]" aria-hidden="true" />
                  LM Studio · local model
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-[15px] font-medium text-[var(--lp-text)]">{TOP_TASK.repository}</span>
                <span className="lp-num text-[12px] text-[var(--lp-sage)]">Priority {TOP_TASK.priority}</span>
              </div>

              <h3 className="lp-display mt-5 text-[clamp(21px,2.6vw,28px)] font-semibold text-[var(--lp-text)]">
                <WordReveal text={TOP_TASK.title} />
              </h3>

              <div className="mt-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--lp-text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 8v4.4l3 1.8" strokeLinecap="round" />
                </svg>
                <span className="text-[13px] text-[var(--lp-text-muted)]">
                  Estimated {TOP_TASK.estimate}
                </span>
              </div>

              {/* Steps */}
              <div className="mt-8 border-t border-white/[0.07] pt-6">
                <span className="lp-label">Implementation steps</span>
                <ol className="mt-4 flex flex-col gap-3">
                  {TOP_TASK.steps.map((step, i) => (
                    <motion.li
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                      className="flex items-start gap-3.5"
                    >
                      <span className="lp-num mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.12] text-[9.5px] text-[var(--lp-text-muted)]">
                        {i + 1}
                      </span>
                      <span className="text-[13.5px] leading-relaxed text-[var(--lp-text)]">
                        <WordReveal text={step} />
                      </span>
                    </motion.li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <MagneticButton href="#workflow" className="!px-6 !py-3 !text-[13px]">
                  Open Repository
                </MagneticButton>
                <MagneticButton href="#workflow" variant="ghost" className="!px-6 !py-3 !text-[13px]">
                  Generate Full Plan
                </MagneticButton>
              </div>
            </GlassCard>
          </Reveal>

          {/* Affected areas + reasoning note */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Reveal delay={0.12}>
              <GlassCard className="rounded-[24px] p-7" floatPeriod={7.8} floatDrift={5}>
                <span className="lp-eyebrow">Affected areas</span>
                <ul className="mt-5 flex flex-col">
                  {TOP_TASK.areas.map((area, i) => (
                    <motion.li
                      key={area}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.45, delay: i * 0.07, ease: EASE }}
                      className="flex items-center justify-between border-b border-white/[0.05] py-3 last:border-b-0"
                    >
                      <span className="text-[13px] text-[var(--lp-text)]">{area}</span>
                      <span className="h-1 w-1 rounded-full bg-[var(--lp-sage)]/60" aria-hidden="true" />
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </Reveal>

            <Reveal delay={0.2}>
              <GlassCard className="rounded-[24px] p-7" floatPeriod={9.4} floatDelay={0.8}>
                <span className="lp-eyebrow">Local reasoning</span>
                <p className="mt-4 text-[13px] leading-relaxed text-[var(--lp-text-muted)]">
                  Planning runs against your own LM Studio instance, so the prompt and the repository context it
                  contains never leave your machine.
                </p>
                <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4">
                  <span className="lp-label !text-[var(--lp-sage)]">localhost:1234</span>
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
