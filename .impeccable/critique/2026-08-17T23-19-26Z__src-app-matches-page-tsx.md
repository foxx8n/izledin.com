---
target: Matches page (UI/UX, icons, button placement, mobile friendliness)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-17T23-19-26Z
slug: src-app-matches-page-tsx
---
# Critique: Matches Discovery (`src/app/matches/page.tsx`)

Method: dual-agent (A: 25868dbe-2760-428a-ae34-36aaae52dfb0 · B: f02584ba-d275-4cf9-a38d-da8d378b13c4)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 3 | Strong radar spinner and deck progress bar, but Grid mode card dismissals lack feedback |
| 2 | Match System / Real World | 4 | Exemplary cinephile fanzine vocabulary ("İzdaş", "Sinema DNA", "35mm Fanzin Seçkisi") |
| 3 | User Control and Freedom | 3 | Deck mode offers Undo and Reset; Grid mode lacks undo and mobile modal swipe-to-dismiss |
| 4 | Consistency and Standards | 2 | Duplicate positive CTAs in card footer ("Sohbet Başlat" vs "İzdaş İsteği"); Grid mode renders Swipe card |
| 5 | Error Prevention | 3 | Asynchronous message request gates unsolicited chat; guest state preserves typed message on auth |
| 6 | Recognition Rather Than Recall | 3 | Helpful cinema icebreakers, but 4-poster strip titles are hidden behind hover on mobile |
| 7 | Flexibility and Efficiency | 3 | Deck and Grid modes cater to different styles; lacks desktop keyboard shortcuts (Arrow keys/Space) |
| 8 | Aesthetic and Minimalist Design | 2 | Card density is high (7 nested sub-boxes); top filter bar packs 10 simultaneous controls |
| 9 | Error Recovery | 3 | Graceful avatar fallbacks and distinct empty states for filter miss vs daily quota |
| 10 | Help and Documentation | 3 | Clear explanatory banners for friendship vs romance intent and swipe direction guide |
| **Total** | | **29/40** | **Good (72.5%)** |

## Design Specificity Verdict

**LLM Assessment**: The Matches experience has exceptionally high design character (8.5/10), firmly rooted in `izledin.com`'s "Gece Gösterimi — Cinema Red & Pure Black" identity. The 35mm film perforations, stamped compatibility badges, and Turkish cinephile terminology create a tactile fanzine atmosphere that avoids generic dating app clones. The primary friction lies in module overload (7 nested containers per card) and an ambiguous dual-positive CTA footer.

**Deterministic Scan**: Passed cleanly (0 anti-patterns). No AI gradient slop, purple halos, or arbitrary border radii were found. The codebase strictly adheres to neobrutalist borders (`border-2 sm:border-4`), solid shadows (`shadow-[5px_5px_0px_#0A0A0A]`), and tokenized color palettes.

**Code-Level UX & Accessibility Findings**:
- Missing `aria-label` on mobile icon-only controls (Grid mode switcher, Refresh button, Safety Report modal close, filter dropdowns).
- Sub-44px touch targets on Intent navigation tabs (~32px), Undo button (~24px), and Chat request buttons (~30px).
- Missing `dark:text-[#EF4444]` on `SwipeMatchCard.tsx` film icon.

## Overall Impression
The Matches Discovery page is one of the most distinctive social cinephile features built, balancing analog film charm with a safe asynchronous messaging flow. However, button hierarchy ambiguity in the card footer, desktop grid rendering bugs, and mobile touch ergonomics need immediate refinement to make it feel frictionless.

## What's Working
1. **Authentic Cinephile Fanzine Identity:** Neobrutalist marquee layout, 35mm ticket badges, and Turkish cinema terminology create an intellectual, warm community vibe.
2. **Safe Asynchronous Messaging Engine:** Gated message requests with real-time trust verification and intent violation reporting protect users from unwanted harassment.
3. **Tactile Deck & Undo Dynamics:** Smooth swipe gesture physics, rotational stamp overlays, haptic vibration, and a dedicated undo buffer deliver a satisfying single-card curation experience.

## Priority Issues

- **[P0] CTA Ambiguity & Redundant Positive Buttons**:
  - *Why it matters*: Card footers present both "Sohbet Başlat" (primary red) and "İzdaş İsteği Gönder" (gold heart), both opening `ChatModal`. Having two distinct positive buttons creates decision paralysis.
  - *Fix*: Unify into a binary system: `[ X Pas ]` (48px secondary button) on the left, and `[ 🎬 İzdaş Ol & Sohbet Başlat ]` (full-width primary red CTA) on the right.
  - *Suggested command*: `/impeccable clarify`

- **[P1] Grid Mode Ghost Cards & Dead `MatchCard.tsx` Component**:
  - *Why it matters*: In Grid mode (`displayLayout === 'grid'`), `page.tsx` renders `SwipeMatchCard` with `nextMatch` stacked behind every single card in the 3-column layout, leaving `MatchCard.tsx` unused.
  - *Fix*: Render `<MatchCard>` exclusively for Grid mode and `<SwipeMatchCard>` for Deck mode.
  - *Suggested command*: `/impeccable layout`

- **[P2] Mobile Card Height Overflow (CTAs Below the Fold)**:
  - *Why it matters*: The vertical card height (~600px) exceeds short mobile viewports (< 768px), forcing users to scroll vertically on each card to reach the like/pass buttons.
  - *Fix*: Condense mobile card density: reduce 4-poster height to 48px, clamp bio to 1 line, and ensure entire card + action buttons fit within `100dvh`.
  - *Suggested command*: `/impeccable adapt`

- **[P3] Touch Target Ergonomics & Missing ARIA Labels**:
  - *Why it matters*: Intent tabs (32px) and Undo button (24px) are difficult to tap accurately on phones. Mobile icon buttons lack accessible names for screen readers.
  - *Fix*: Upgrade interactive touch targets to minimum `44px` height and add explicit `aria-label` attributes to mobile icon buttons and `<select>` dropdowns.
  - *Suggested command*: `/impeccable audit`

- **[P4] Hidden Poster Titles on Touchscreens**:
  - *Why it matters*: Film titles on the 4-favorite poster strip use `opacity-0 hover:opacity-100`, making them invisible on touch devices.
  - *Fix*: Add high-contrast title badges or a tap-to-inspect popover on mobile.
  - *Suggested command*: `/impeccable clarify`

## Persona Red Flags

- **Alex (Power User / Cinephile)**:
  - 🚩 Cannot navigate the deck with desktop keyboard shortcuts (`←` / `→` / `Space` / `Z`).
  - 🚩 Shared match reasons are hard-truncated to 1 line, cutting off deep cinema connection details.
- **Jordan (First-Timer)**:
  - 🚩 Top filter bar presents 10 simultaneous controls on initial load, causing cognitive overwhelm.
  - 🚩 Unclear whether "Sohbet Başlat" commits them to a live chat or sends a pending request.
- **Casey (Distracted Mobile User)**:
  - 🚩 Action buttons are pushed below the fold on mobile screens, requiring scrolling on every card.
  - 🚩 Mobile virtual keyboard compresses the desktop-style centered chat modal.
- **Sam (Accessibility-Dependent User)**:
  - 🚩 Mobile icon-only buttons (Grid switch, Refresh, Report modal close) lack `aria-label`.
  - 🚩 Micro font sizes (`text-[10px]`, `text-[11px]`) fall below minimum standard legibility on small screens.

## Minor Observations
1. Asymmetric active tab styling: Deck button uses red accent (`bg-[#DC2626]`), while Grid button uses black (`bg-[#0A0A0A]`).
2. Chat input in `ChatModal.tsx` lacks character counter or auto-expanding height for long messages.
3. Fallback avatar in `page.tsx` directly calls external DiceBear API without offline styling.

## Questions to Consider
- Should layout mode automatically adapt to viewport breakpoint (Mobile = Deck, Desktop = Grid) rather than requiring manual toggles?
- Can the 4-favorite poster strip become physical 35mm film ticket stubs with permanently readable titles?
- Would desktop keyboard shortcuts (Arrow keys + Space) transform this into the fastest cinephile curation flow on the web?
