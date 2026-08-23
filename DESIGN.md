---
name: izledin.com
description: "Gece Gösterimi — 35mm Analog Fanzin & Velvet Cinema Red (EST. '26)"
colors:
  primary: "#0A0A0A"
  accent-red: "#EF4444"
  accent-red-hover: "#DC2626"
  accent-red-bg: "rgba(239, 68, 68, 0.16)"
  rating-gold: "#FBBF24"
  canvas: "#0A0A0A"
  surface: "#171717"
  surface-secondary: "#262626"
  border-strong: "#404040"
  border-subtle: "#262626"
  ink-primary: "#FAFAFA"
  ink-secondary: "#D4D4D4"
  ink-muted: "#737373"
  hard-shadow: "#000000"
typography:
  display:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  label:
    fontFamily: "var(--font-geist-mono), monospace"
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.06em"
  note-subtle:
    fontFamily: "var(--font-geist-mono), monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
  stamp-micro:
    fontFamily: "var(--font-geist-mono), monospace"
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.2
  typewriter:
    fontFamily: "var(--font-geist-mono), 'Courier New', monospace"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accent-red}"
    rounded: "{rounded.none}"
    padding: "10px 20px"
  button-accent:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.canvas-light}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
  card-media:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.none}"
---

# Gece Gösterimi Design System

## Overview
A tactile, unapologetically cinematic design world inspired by 35mm film negatives, dark movie theater auditoriums, velvet crimson marquees, and typewriter fanzines. High-contrast typography and solid physical offset shadows replace generic modern UI tropes.

## Colors

The site ships a single permanent theme: **Gece Gösterimi** (the night projection). There is no light mode and no theme toggle — these token values are the only values.

| Role | Token | Value | Purpose |
|---|---|---|---|
| Canvas | `--bg-canvas` | `#0A0A0A` | Pitch black cinema auditorium canvas |
| Surface | `--bg-surface` | `#171717` | Dark textured card and modal surfaces |
| Surface Secondary | `--bg-surface-secondary` | `#262626` | Input fields, active toggles, hover backgrounds |
| Ink Primary | `--ink-primary` | `#FAFAFA` | High-contrast white typography |
| Ink Secondary | `--ink-secondary` | `#D4D4D4` | Readable body copy on dark surfaces |
| Ink Muted | `--ink-muted` | `#737373` | Subordinate labels and timestamps |
| Accent Red | `--accent-red` | `#EF4444` | High-visibility cinema red |
| Accent Red Hover | `--accent-red-dark` | `#DC2626` | Hover state on CTAs |
| Rating Gold | `--accent-gold` | `#FBBF24` | Vivid amber gold stars on dark backdrops |
| Border Strong | `--border-ink` | `#404040` | Structural borders on obsidian containers |
| Border Subtle | `--border-subtle` | `#262626` | Quiet separation lines |
| Hard Shadow | `--hard-shadow` | `#000000` | Pure black physical offset shadows |

## Typography
- **Display & Mastheads:** Geist Sans, uppercase, weight 900, tight tracking (`-0.04em`), leading `0.95`.
- **Headlines & Section Headers:** Geist Sans, weight 900, letter-spacing `-0.02em`, leading `1.1`.
- **Titles (Films, Modals):** Geist Sans, weight 800, letter-spacing `-0.01em`.
- **Body & Reviews:** Geist Sans, weight 600, measure 65–75ch for optimum reading comfort.
- **Labels, Stamps & Data:** Geist Mono, weight 800, uppercase, letter-spacing `0.06em`.
- **Typewriter Diary Entries:** Geist Mono / Courier New, weight 700 for authentic analog log notes.

## Layout
- **Desktop Sidebar:** Fixed 240px left rail (`--sidebar-width: 240px`), with page containers using `.with-sidebar`.
- **Mobile Bottom Navigation:** Fixed 64px bar (`--bottom-bar-height: 64px`) elevated above content, with `env(safe-area-inset-bottom)` safe area offsets (`.pb-safe`).
- **Touch Ergonomics:** Minimum 44px–48px interactive touch targets across mobile controls.
- **Catalog Grids:** Responsive 12-column grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`) with "+12 Daha Fazla Göster" progressive expansion.

## Elevation & Depth
- **Physical Neobrutalism:** Solid zero-blur ink drop shadows instead of soft ambient glows.
  - `--shadow-xs`: `1px 1px 0px var(--hard-shadow)` (Micro badges, indicators)
  - `--shadow-sm`: `2px 2px 0px var(--hard-shadow)` (Small buttons, stamps, secondary cards)
  - `--shadow-md`: `4px 4px 0px var(--hard-shadow)` (Standard cards, primary CTAs)
  - `--shadow-lg`: `6px 6px 0px var(--hard-shadow)` (Hover states, elevated panels)
  - `--shadow-xl`: `8px 8px 0px var(--hard-shadow)` (Dialogs, modal overlays, hero stages)
  - `--shadow-red`: `8px 8px 0px var(--accent-red)` (Signature featured item highlight)
- **Borders:** Crisp 2px solid structural ink lines (`var(--border-ink)`).

## Shapes
- **Corner Radii:** Strict `0px` (`rounded-none`) and `2px` (`rounded-sm`) for a sharp print-press feel. `rounded-full` is reserved exclusively for user avatar circles and marker highlight overlays.
- **Textural Motifs:**
  - `.film-strip`: Perforated 35mm cinema strip with dashed edge holes.
  - `.stamp-badge`: Inked fanzine stamp with dashed border and uppercase monospaced text.
  - `.marker-highlight`: Rotated semi-transparent red highlighter underlay.

## Components
- **Buttons (`button-primary`, `button-accent`):** Uppercase, bold, 2px border with `--shadow-md`. On active click, buttons compress `translate(1px, 1px)` with `--shadow-sm`.
- **Poster Cards (`card-media`):** Neobrutalist poster frames with crisp hover lift (`translate(-2px, -2px)` expanding to `--shadow-lg`).
- **Rating Stars:** Amber gold interactive star selectors with half-star granularity and instant hover preview.
- **Swipe Decks (`.swipe-card`):** Hardware-accelerated gesture cards with spring physics (`--ease-spring`) and directional red/amber overlay badges.
- **Modal Dialogs:** Centered high-contrast frames with solid `--shadow-xl`, backdrop dimming, and quick keyboard `Esc` dismissal.

## Do's and Don'ts
- ✅ **DO** use drawn SVG/Lucide icons with 1.5px consistent stroke weight.
- ✅ **DO** theme browser surfaces (`::selection`, scrollbars, focus-visible rings).
- ✅ **DO** use authentic Turkish sinefil terminology (İzdaş, Fanzin, Günlük, Yönetmen, 35mm).
- ❌ **DON'T** use purple or violet glowing accents on dark backgrounds (Forbidden AI Trope).
- ❌ **DON'T** use gradient text fills across headline keywords.
- ❌ **DON'T** use emojis as functional UI icons.
- ❌ **DON'T** use nested cards inside cards.
- ❌ **DON'T** use soft blurred Gaussian drop shadows or decorative glassmorphism.
