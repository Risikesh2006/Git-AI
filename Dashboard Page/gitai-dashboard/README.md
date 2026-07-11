# Git AI — Engineering Dashboard (Next.js)

Converted from the original static HTML/Tailwind CDN mockup into a Next.js 14 (App Router) + Tailwind CSS project, matching the original glassmorphic dark theme design pixel-for-pixel.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes

- Fonts (Sora, Hanken Grotesk, JetBrains Mono) are loaded via `next/font/google` in `app/layout.js`.
- Material Symbols Outlined icon font is loaded via a `<link>` tag in the layout head (same as the original).
- All custom design tokens (colors, spacing, font sizes, border radii) from the original `tailwind.config` block are ported into `tailwind.config.js`.
- Custom CSS (glass-card, nav-pill-active, ai-pulse, liquid-fill, etc.) lives in `app/globals.css`.
- The mouse-tilt "spring" effect on `.glass-card` elements is reimplemented as a small React component (`GlassCard`) using refs instead of a global `querySelectorAll` script.
- Toast notifications are dismissible via React state, matching the original close-button behavior.
