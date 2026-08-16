'use client';

import { motion } from 'framer-motion';
import { EASE, VIEWPORT } from '@/lib/animations';
import { TECHNOLOGIES } from '@/lib/constants';
import { Hairline } from './primitives';

/**
 * Section 10 — the stack, set as monochrome text marks.
 *
 * Deliberately typographic rather than a logo wall: brand-coloured logos would
 * be the only saturated colour on the page and would break the achromatic
 * palette instantly.
 */
export function TechnologyStrip() {
  return (
    <section className="relative px-3 py-16 sm:px-5 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Hairline />

        <div className="flex flex-col items-center gap-8 py-12">
          <span className="lp-eyebrow">Built with</span>

          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            variants={{ show: { transition: { staggerChildren: 0.045 } } }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12"
          >
            {TECHNOLOGIES.map((tech) => (
              <motion.li
                key={tech}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-[14px] font-medium tracking-tight text-[var(--lp-text-muted)] transition-colors duration-300 hover:text-[var(--lp-text)]"
              >
                {tech}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <Hairline />
      </div>
    </section>
  );
}
