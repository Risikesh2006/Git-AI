'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { GlassCard, Reveal, SectionHeading } from './primitives';

/**
 * Section 6 — capabilities.
 *
 * Deliberately asymmetric: a 12-column grid where every card takes a different
 * span, and the three largest carry their own internal visual. Uniform card
 * grids are the clearest tell of a generated page, so no two rows here share a
 * column rhythm.
 */

/** Miniature language/coverage bars for the scanner card. */
function ScannerVisual() {
  const bars = [
    { label: 'TypeScript', value: 62 },
    { label: 'Python', value: 24 },
    { label: 'CSS', value: 9 },
  ];

  return (
    <div className="mt-7 flex flex-col gap-3">
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex items-center gap-3">
          <span className="lp-label w-[74px] shrink-0 leading-none">{bar.label}</span>
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-[var(--lp-sage)]/70"
              initial={{ width: 0 }}
              whileInView={{ width: `${bar.value}%` }}
              viewport={VIEWPORT}
              transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: EASE }}
            />
          </div>
          <span className="lp-num w-8 shrink-0 text-right text-[10.5px] text-[var(--lp-text-muted)]">{bar.value}%</span>
        </div>
      ))}
    </div>
  );
}

/** Compact diff preview for the review card. */
function ReviewVisual() {
  const lines = [
    { t: 'del', text: '- return self.store.scan(q)' },
    { t: 'add', text: '+ return self.store.similarity(vector, top_k=k)' },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 p-4 font-[family-name:var(--font-tech)] text-[11.5px] leading-relaxed">
      {lines.map((line, i) => (
        <motion.div
          key={line.text}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: EASE }}
          className={line.t === 'del' ? 'text-red-300/60' : 'text-[var(--lp-sage)]'}
        >
          {line.text}
        </motion.div>
      ))}
    </div>
  );
}

interface Capability {
  title: string;
  body: string;
  span: string;
  visual?: React.ReactNode;
  float?: number;
  emphasis?: boolean;
}

const CAPABILITIES: Capability[] = [
  {
    title: 'Repository Scanner',
    body: 'Maps commits, languages, files, issues, tests, documentation, TODO items, branches and recent activity into one structured picture.',
    span: 'lg:col-span-6',
    visual: <ScannerVisual />,
    emphasis: true,
  },
  {
    title: 'ML Priority Engine',
    body: 'Ranks projects using repository signals weighted against the personal importance you assign.',
    span: 'lg:col-span-3',
    float: 8.4,
  },
  {
    title: 'Daily AI Planner',
    body: 'Uses LM Studio to turn findings into a focused, sized development task.',
    span: 'lg:col-span-3',
    float: 7.1,
  },
  {
    title: 'Review Before Shipping',
    body: 'Inspect changed files, read the diff, edit the generated commit message — then push only after you approve.',
    span: 'lg:col-span-12',
    visual: <ReviewVisual />,
    emphasis: true,
  },
  {
    title: 'Commit Message Generator',
    body: 'Conventional-commit messages drafted from the actual diff.',
    span: 'lg:col-span-4',
  },
  {
    title: 'Local LLM Support',
    body: 'Point Git AI at your own LM Studio model and keep reasoning on-device.',
    span: 'lg:col-span-4',
    float: 9.2,
  },
  {
    title: 'Developer Habit Learning',
    body: 'Feedback on completed work shapes which tasks surface next.',
    span: 'lg:col-span-4',
  },
  {
    title: 'Repository Health Tracking',
    body: 'Documentation, coverage and activity tracked over time, not just at a single snapshot.',
    span: 'lg:col-span-5',
  },
  {
    title: 'Feedback-Based Recommendations',
    body: 'Mark a plan completed, ignored or modified to tune future output.',
    span: 'lg:col-span-4',
    float: 8.0,
  },
  {
    title: 'GitHub Activity Analytics',
    body: 'Commit velocity and contribution patterns per repository.',
    span: 'lg:col-span-3',
  },
];

export function CapabilityGrid() {
  return (
    <section className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything between a repository and a shipped commit."
          className="max-w-xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {CAPABILITIES.map((cap, i) => (
            <Reveal key={cap.title} delay={Math.min(i * 0.05, 0.3)} className={cap.span}>
              <GlassCard
                as="article"
                className={`flex h-full flex-col rounded-[20px] ${cap.emphasis ? 'p-7 sm:p-8' : 'p-6'}`}
                floatPeriod={cap.float}
                floatDelay={i * 0.3}
              >
                <h3
                  className={`lp-display font-semibold text-[var(--lp-text)] ${
                    cap.emphasis ? 'text-[21px]' : 'text-[16px]'
                  }`}
                >
                  {cap.title}
                </h3>
                <p
                  className={`mt-3 leading-relaxed text-[var(--lp-text-muted)] ${
                    cap.emphasis ? 'max-w-md text-[14px]' : 'text-[13px]'
                  }`}
                >
                  {cap.body}
                </p>
                {cap.visual}
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
