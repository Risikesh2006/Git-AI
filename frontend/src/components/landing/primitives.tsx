'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, type Variants } from 'framer-motion';
import { EASE, VIEWPORT, revealUp, staggerParent, staggerChild } from '@/lib/animations';
import { useCardTilt } from '@/hooks/useCardTilt';
import { useMouseGlow } from '@/hooks/useMouseGlow';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/* ── Reveal ──────────────────────────────────────────────────────────── */

/** Scroll-triggered fade + rise. Fires once. */
export function Reveal({
  children,
  className = '',
  delay = 0,
  variants = revealUp,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers Reveal-less children via `StaggerItem`. */
export function Stagger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={VIEWPORT} variants={staggerParent} className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}

/* ── GlassCard ───────────────────────────────────────────────────────── */

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Enable cursor-driven 3D tilt. */
  tilt?: boolean;
  /** Enable the cursor-following highlight. */
  glow?: boolean;
  /** Continuous float — pass a period in seconds to opt in. */
  floatPeriod?: number;
  floatDelay?: number;
  /** Horizontal drift distance in px, paired with float. */
  floatDrift?: number;
  as?: 'div' | 'article' | 'li';
}

/**
 * The landing page's primary surface: frosted glass with an optional 3D tilt,
 * a cursor-tracking highlight and an independent float cycle.
 *
 * Float parameters are passed per instance rather than derived from a shared
 * clock, so no two cards ever move in lockstep.
 */
export function GlassCard({
  children,
  className = '',
  tilt = true,
  glow = true,
  floatPeriod,
  floatDelay = 0,
  floatDrift = 0,
  as = 'div',
}: GlassCardProps) {
  const { ref: tiltRef, handlers: tiltHandlers, style: tiltStyle } = useCardTilt();
  const { ref: glowRef, handlers: glowHandlers } = useMouseGlow<HTMLDivElement>();
  const reduced = useReducedMotion();

  /*
    `motion[as]` resolves to a union of motion components, and TS then demands
    props satisfying the *intersection* of their handler types (a div handler is
    not assignable to an li handler). The runtime element is chosen correctly by
    the lookup; we pin the prop surface to motion.div's so the polymorphism does
    not leak into every call site.
  */
  const Comp = motion[as] as React.ComponentType<React.ComponentProps<typeof motion.div>>;
  const shouldFloat = Boolean(floatPeriod) && !reduced;

  return (
    <div
      ref={glow ? glowRef : undefined}
      onPointerMove={glow ? glowHandlers.onPointerMove : undefined}
      className={glow ? 'lp-spot relative rounded-[inherit]' : 'relative'}
      style={{ perspective: 1000 }}
    >
      <Comp
        ref={tiltRef}
        onPointerMove={tilt ? tiltHandlers.onPointerMove : undefined}
        onPointerLeave={tilt ? tiltHandlers.onPointerLeave : undefined}
        style={tilt ? tiltStyle : undefined}
        animate={
          shouldFloat
            ? { y: [0, -10, 0], x: floatDrift ? [0, floatDrift, 0] : undefined }
            : undefined
        }
        transition={
          shouldFloat
            ? { duration: floatPeriod, delay: floatDelay, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
        whileHover={reduced ? undefined : { y: -8, scale: 1.012 }}
        className={`lp-glass lp-glass-i ${className}`}
      >
        {children}
      </Comp>
    </div>
  );
}

/* ── MagneticButton ──────────────────────────────────────────────────── */

/**
 * Primary CTA with a restrained magnetic pull toward the cursor and a
 * highlight that shifts as the pointer crosses it.
 */
export function MagneticButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  href,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  className?: string;
  href?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 22 });
  const y = useSpring(my, { stiffness: 260, damping: 22 });

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Pull is capped at ~18% of the offset from centre — noticeable, not silly.
    mx.set((e.clientX - r.left - r.width / 2) * 0.18);
    my.set((e.clientY - r.top - r.height / 2) * 0.18);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  const base =
    'lp-focus relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full text-[13.5px] font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--lp-text)] px-7 py-3.5 text-[#080b09] hover:bg-white'
      : 'border border-[var(--lp-border)] px-7 py-3.5 text-[var(--lp-text)] hover:border-white/25 hover:bg-white/[0.04]';

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {/* Sheen that sweeps on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
    </>
  );

  const motionProps = {
    style: { x, y },
    onPointerMove,
    onPointerLeave: reset,
    whileTap: reduced ? undefined : { scale: 0.975 },
    className: `group ${base} ${styles} ${className}`,
  };

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        aria-label={ariaLabel}
        {...motionProps}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}

/* ── Counter ─────────────────────────────────────────────────────────── */

/**
 * Counts up to `value` when scrolled into view.
 *
 * Uses tabular figures (`.lp-num`) so the element's width does not jitter as
 * digits change — the detail that separates a designed counter from a naive one.
 */
export function Counter({
  value,
  duration = 1.4,
  className = '',
  suffix = '',
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // The reduced-motion case needs no animation at all, so it is derived below
    // rather than pushed through state — keeps this effect purely a subscription
    // to the animation frame clock.
    if (!inView || reduced) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      // Matches the EASE curve used elsewhere: fast out, long settle.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  // Reduced motion, or already scrolled past before JS settled: show the target.
  const shown = reduced ? value : display;

  return (
    <span ref={ref} className={`lp-num ${className}`}>
      {shown}
      {suffix}
    </span>
  );
}

/* ── SectionHeading ──────────────────────────────────────────────────── */

export function SectionHeading({
  eyebrow,
  title,
  body,
  className = '',
  align = 'left',
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <Reveal className={`${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
      <span className="lp-eyebrow">{eyebrow}</span>
      <h2 className="lp-display mt-5 text-[clamp(26px,3.6vw,42px)] font-semibold text-[var(--lp-text)]">{title}</h2>
      {body && (
        <p className={`mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--lp-text-muted)] ${align === 'center' ? 'mx-auto' : ''}`}>
          {body}
        </p>
      )}
    </Reveal>
  );
}

/** Thin animated hairline used as a section divider. */
export function Hairline({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 1.1, ease: EASE }}
      className={`lp-hairline origin-left ${className}`}
    />
  );
}
