'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/animations';
import { NAV_LINKS } from '@/lib/constants';
import { MagneticButton } from './primitives';

/** Wordmark — a git node glyph, drawn rather than imported as an icon font. */
function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 8.4v7.2M8.4 6.9 15.6 11M8.4 17.1 15.6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar({ onConnect }: { onConnect: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Opacity step once the user has left the very top of the page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
    Active-section indicator. An IntersectionObserver on the section targets is
    cheaper and steadier than measuring offsets on every scroll event, and it
    tracks correctly while Lenis is easing.
  */
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-5"
      >
        <nav
          aria-label="Main"
          className={`flex w-full max-w-6xl items-center justify-between rounded-full border px-3 py-2 transition-all duration-500 sm:px-4 ${
            scrolled
              ? 'border-white/[0.12] bg-[rgba(8,11,9,0.82)] backdrop-blur-2xl'
              : 'border-white/[0.05] bg-[rgba(8,11,9,0.32)] backdrop-blur-lg'
          }`}
        >
          <a href="#top" className="lp-focus flex shrink-0 items-center gap-2.5 pl-1.5 text-[var(--lp-text)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-[var(--lp-sage)]">
              <Logo />
            </span>
            <span className="lp-display text-[15px] font-semibold">Git AI</span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const id = link.href.slice(1);
              const isActive = active === id;
              return (
                <li key={link.href} className="relative">
                  <a
                    href={link.href}
                    className={`lp-focus relative block rounded-full px-3.5 py-2 text-[13px] transition-colors ${
                      isActive ? 'text-[var(--lp-text)]' : 'text-[var(--lp-text-muted)] hover:text-[var(--lp-text)]'
                    }`}
                  >
                    {link.label}
                    {/* Shared layout ID makes the pill glide between items. */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]"
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5 pr-0.5">
            <button
              onClick={onConnect}
              className="lp-focus hidden rounded-full px-3.5 py-2 text-[13px] text-[var(--lp-text-muted)] transition-colors hover:text-[var(--lp-text)] sm:block"
            >
              Sign In
            </button>
            <MagneticButton onClick={onConnect} className="!px-5 !py-2.5 !text-[13px]">
              Connect GitHub
            </MagneticButton>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className="lp-focus ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[var(--lp-text)] lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-[60] bg-[rgba(5,7,6,0.86)] backdrop-blur-2xl lg:hidden"
          >
            <div className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="lp-display text-[15px] font-semibold text-[var(--lp-text)]">Git AI</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="lp-focus flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[var(--lp-text)]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } } }}
                className="mt-14 flex flex-col gap-1"
              >
                {NAV_LINKS.map((link) => (
                  <motion.li
                    key={link.href}
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="lp-focus flex min-h-12 items-center border-b border-white/[0.06] py-3 text-[19px] text-[var(--lp-text)]"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-auto flex flex-col gap-3">
                <MagneticButton
                  onClick={() => {
                    setMenuOpen(false);
                    onConnect();
                  }}
                  className="w-full !py-4"
                >
                  Connect GitHub
                </MagneticButton>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onConnect();
                  }}
                  className="lp-focus min-h-12 rounded-full border border-white/10 text-[14px] text-[var(--lp-text-muted)]"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
