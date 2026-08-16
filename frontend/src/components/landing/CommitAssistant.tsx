'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { COMMIT_DIFF, COMMIT_REVIEW } from '@/lib/constants';
import { Counter, GlassCard, Reveal, SectionHeading } from './primitives';

const DIFF_STYLES: Record<string, string> = {
  meta: 'text-[var(--lp-text-muted)]',
  hunk: 'text-[var(--lp-sage)]/70',
  add: 'text-[var(--lp-sage)] bg-[var(--lp-sage)]/[0.06]',
  del: 'text-red-300/70 bg-red-400/[0.05]',
  ctx: 'text-[var(--lp-text-muted)]/70',
};

/**
 * Section 8 — the review gate.
 *
 * This section carries a product guarantee, so the interaction is built to
 * reinforce it: "Approve and Push" never performs anything, it opens an explicit
 * confirmation that names the branch and the file count. The preview is clearly
 * labelled so nothing here reads as a live control.
 */
export function CommitAssistant() {
  const [confirming, setConfirming] = useState(false);

  return (
    <section id="documentation" className="relative px-3 py-24 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Commit assistant"
          title="Review everything before it ships."
          body="Git AI drafts the message and stages the change. The decision to push is always a separate, deliberate action taken by you."
          className="max-w-2xl"
        />

        <Reveal className="mt-14">
          <GlassCard tilt={false} className="overflow-hidden rounded-[26px]">
            {/* Header: repository + branch + change counts */}
            <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/[0.07] p-6 sm:p-7">
              <div className="min-w-0">
                <span className="lp-label">Repository</span>
                <p className="mt-1.5 text-[15px] font-medium text-[var(--lp-text)]">{COMMIT_REVIEW.repository}</p>
                <p className="lp-num mt-1 truncate text-[11.5px] text-[var(--lp-sage)]">{COMMIT_REVIEW.branch}</p>
              </div>

              <dl className="flex items-center gap-6 sm:gap-8">
                <div>
                  <dd className="lp-num text-[19px] font-semibold text-[var(--lp-text)]">
                    <Counter value={COMMIT_REVIEW.filesChanged} duration={0.9} />
                  </dd>
                  <dt className="lp-label mt-0.5">Files</dt>
                </div>
                <div>
                  <dd className="lp-num text-[19px] font-semibold text-[var(--lp-sage)]">
                    +<Counter value={COMMIT_REVIEW.additions} duration={1.2} />
                  </dd>
                  <dt className="lp-label mt-0.5">Additions</dt>
                </div>
                <div>
                  <dd className="lp-num text-[19px] font-semibold text-red-300/80">
                    −<Counter value={COMMIT_REVIEW.deletions} duration={1.2} />
                  </dd>
                  <dt className="lp-label mt-0.5">Deletions</dt>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Diff */}
              <div className="border-b border-white/[0.07] p-6 sm:p-7 lg:col-span-7 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between">
                  <span className="lp-eyebrow">Diff</span>
                  <span className="lp-label">Unified · 1 of 4 files</span>
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/35">
                  <pre className="min-w-max p-4 font-[family-name:var(--font-tech)] text-[11.5px] leading-[1.75]">
                    {COMMIT_DIFF.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={VIEWPORT}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                        className={`-mx-4 px-4 ${DIFF_STYLES[line.type]}`}
                      >
                        {line.text || ' '}
                      </motion.div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Message + controls */}
              <div className="p-6 sm:p-7 lg:col-span-5">
                <span className="lp-eyebrow">Generated commit message</span>

                <div className="mt-5 rounded-xl border border-white/[0.09] bg-white/[0.02] p-4">
                  <p className="font-[family-name:var(--font-tech)] text-[12px] leading-relaxed text-[var(--lp-text)]">
                    {COMMIT_REVIEW.message}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {['Edit Message', 'Review Files', 'Run Tests'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="lp-focus rounded-full border border-white/[0.1] px-3 py-2.5 text-[12px] text-[var(--lp-text-muted)] transition-colors hover:border-white/20 hover:text-[var(--lp-text)]"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Approval gate */}
                <div className="mt-6 border-t border-white/[0.07] pt-6">
                  <AnimatePresence mode="wait" initial={false}>
                    {!confirming ? (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <button
                          type="button"
                          onClick={() => setConfirming(true)}
                          className="lp-focus w-full rounded-full bg-[var(--lp-text)] px-5 py-3.5 text-[13px] font-medium text-[#080b09] transition-colors hover:bg-white"
                        >
                          Approve and Push
                        </button>
                        <p className="mt-3.5 flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--lp-text-muted)]">
                          <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--lp-sage)]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8.5 11V8a3.5 3.5 0 017 0v3" />
                          </svg>
                          Every commit and push requires explicit user approval.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="rounded-xl border border-[var(--lp-sage)]/25 bg-[var(--lp-sage)]/[0.05] p-4"
                        role="alertdialog"
                        aria-live="polite"
                        aria-label="Confirm push"
                      >
                        <p className="text-[12.5px] leading-relaxed text-[var(--lp-text)]">
                          You are about to push {COMMIT_REVIEW.filesChanged} changed files to{' '}
                          <span className="lp-num text-[var(--lp-sage)]">{COMMIT_REVIEW.branch}</span>.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="lp-focus flex-1 rounded-full border border-white/[0.14] px-4 py-2.5 text-[12.5px] text-[var(--lp-text-muted)] transition-colors hover:text-[var(--lp-text)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="lp-focus flex-1 rounded-full bg-[var(--lp-text)] px-4 py-2.5 text-[12.5px] font-medium text-[#080b09]"
                          >
                            Approve and Push
                          </button>
                        </div>
                        <p className="lp-label mt-3 !text-[9px]">Preview only — no repository is modified here.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
