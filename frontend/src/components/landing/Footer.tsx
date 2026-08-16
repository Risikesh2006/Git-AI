'use client';

const COLUMNS = [
  {
    title: 'Product',
    links: ['Repository Intelligence', 'AI Planner', 'Commit Assistant', 'Repository Scanner', 'Security'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'Architecture', 'API', 'GitHub', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Contact', 'Privacy', 'Terms'],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] px-3 pb-10 pt-16 sm:px-5">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-8">
          <div className="col-span-2 sm:col-span-1 lg:pr-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-[var(--lp-sage)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="18" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6 8.4v7.2M8.4 6.9 15.6 11M8.4 17.1 15.6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lp-display text-[15px] font-semibold text-[var(--lp-text)]">Git AI</span>
            </div>
            <p className="mt-4 max-w-[220px] text-[12.5px] leading-relaxed text-[var(--lp-text-muted)]">
              Local-first intelligence for focused GitHub development.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="lp-label">{col.title}</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="lp-focus text-[12.5px] text-[var(--lp-text-muted)] transition-colors hover:text-[var(--lp-text)]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col-reverse items-start gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="lp-label">© 2026 Git AI</span>
          <span className="lp-label">Built for meaningful contributions.</span>
        </div>
      </div>
    </footer>
  );
}
