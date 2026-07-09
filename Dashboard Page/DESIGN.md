---
name: Aether Monolith
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c9c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-hero:
    fontFamily: Sora
    fontSize: 96px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 32px
  margin-desktop: 80px
  margin-mobile: 24px
  section-gap: 160px
---

## Brand & Style
The design system embodies a "Stunning Morphism" aesthetic—a sophisticated synthesis of **Glassmorphism**, **Neumorphism**, and **Watermorphism**. The brand personality is AI-native, futuristic, and relentlessly premium. By stripping away all color in favor of a strict monochromatic palette, the focus shifts entirely to light, shadow, and texture.

The interface should feel like a physical object made of liquid light and polished obsidian. It targets a high-end tech audience that values "invisible" complexity and tactile digital experiences. The emotional response is one of calm, crystalline clarity and cutting-edge precision.

## Colors
The palette is strictly achromatic to emphasize depth through luminosity rather than hue. 

- **Primary White (#FFFFFF):** Used for typography, high-intensity glows, and the "light" side of Neumorphic extrusions.
- **Surface Tiers:** Backgrounds are pure black (#000000). Secondary and tertiary surfaces use deep grays to create the illusion of physical depth and "watery" volume.
- **Translucency:** All surfaces use varying levels of alpha transparency (8% to 24%) combined with high-intensity backdrop blurs (20px to 60px) to achieve the glass and water effects.

## Typography
The typographic hierarchy is designed for maximum impact and "Premium Tech" readability. 

- **Sora** handles all headlines with its wide, geometric stance, providing a futuristic and structural foundation.
- **Hanken Grotesk** is used for body copy to maintain a clean, high-end sans-serif feel that remains legible even against blurred backgrounds.
- **JetBrains Mono** is reserved for technical metadata, labels, and AI-status indicators, reinforcing the "AI-Native" developer-centric heritage.
- **Styling:** Headlines should utilize subtle text-shadows (0 4px 12px rgba(255,255,255,0.1)) to "lift" them off the glass surfaces.

## Layout & Spacing
The layout follows a "Generous Negative Space" philosophy. Elements are given room to breathe to prevent the complex morphism effects from feeling cluttered.

- **Grid:** A 12-column fluid grid for desktop with 32px gutters. 
- **Sectioning:** Vertical rhythm is aggressive, using 160px gaps between major landing page sections to signal premium quality.
- **Micro-spacing:** Built on an 8px base unit. Component internal padding should favor larger values (e.g., 24px or 32px) to support the "soft" tactile nature of the shapes.

## Elevation & Depth
This is the core of the design system. Hierarchy is achieved through a three-layer stack:

1.  **The Void (Base):** Pure #000000 background with a faint, non-intrusive geometric grid pattern in 5% opacity white.
2.  **Water Layers (Mid):** Organic, fluid shapes with `backdrop-filter: blur(80px)` and 10% opacity white fills. These use "Watermorphism"—rounded, irregular paths that appear to flow behind the content.
3.  **Glass Containers (Top):** UI cards use `backdrop-filter: blur(24px)`, a 1px solid border (top/left: 20% white, bottom/right: 5% white), and a dual-shadow Neumorphic effect.

**Shadow Specs:**
- *Outer Shadow:* 12px 12px 24px rgba(0,0,0,0.5).
- *Inner Highlight:* -2px -2px 10px rgba(255,255,255,0.05) to create the "extruded" edge.

## Shapes
Shapes are defined by "Soft Precision." While primary containers use a standard 1rem (16px) radius to maintain a professional SaaS feel, larger background elements and "Watermorphic" blobs should use erratic, high-radius curves (100px+) to simulate liquid.

- **Buttons:** 0.5rem (Rounded) for high-action components.
- **Cards/Modules:** 1rem (Rounded-LG) for primary content containers.
- **Outer Shells:** 1.5rem (Rounded-XL) for the largest layout blocks.

## Components
### Buttons
- **Primary:** Pure white background, black text. No shadow, but a 10px white outer glow on hover.
- **Secondary (Glass):** Transparent background, 1px white border (15% opacity), white text. `backdrop-filter: blur(10px)`.

### Cards
- Cards must not have a solid background. Use a linear gradient (top-left to bottom-right) of `rgba(255,255,255,0.08)` to `rgba(255,255,255,0.02)`.
- Apply a 1px "inner-stroke" border to simulate the edge of a glass pane.

### Inputs
- Neumorphic "inset" style. The field should look carved into the surface using inner shadows: `inset 4px 4px 8px rgba(0,0,0,0.8), inset -4px -4px 8px rgba(255,255,255,0.05)`.

### Chips & Badges
- Use JetBrains Mono for text. Backgrounds should be 10% white with a high 40px blur, creating a "vapor" effect around the text.

### AI Indicators
- Small, pulsating circular rings with a Gaussian blur "halo" to represent active processing.