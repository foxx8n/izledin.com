---
target: the main page (keşif)
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-17T23-35-33Z
slug: src-app-page-tsx
---
Method: dual-agent (A: 84854cdf-fb05-4634-b192-7c82481a4d91 · B: 31c40e75-4f8e-4920-82dd-ef6d02087dd5)

# Design Critique: Keşfet & Ana Sayfa (`src/app/page.tsx`)

## Design Health Score

| # | Heuristic | Score (0–4) | Key Finding |
|---|---|:---:|---|
| 1 | **Visibility of System Status** | **4 / 4** | Realtime unread inbox count, optimistic review likes, crisp spinner loading states. |
| 2 | **Match System & Real World** | **4 / 4** | Flawless 35mm film metaphors, typewriter diary notes, authentic Turkish sinefil vocabulary. |
| 3 | **User Control and Freedom** | **3 / 4** | ESC modal close & deck undo work well; lacks quick undo toast on instant watchlist toggle. |
| 4 | **Consistency and Standards** | **4 / 4** | Strict 2px/4px borders, uniform hard offset shadow scale, standardized uppercase labels. |
| 5 | **Error Prevention** | **3 / 4** | Protected auth gates and rate limits; lacks confirmation if closing QuickLog with typed draft text. |
| 6 | **Recognition Over Recall** | **4 / 4** | Active genre/tab pill highlights, visible Top 4 posters in match cards, persistent IMDb scores. |
| 7 | **Flexibility and Efficiency** | **3 / 4** | Mobile swipe gestures & 2-click log; missing prominent `Cmd+K` global keyboard shortcut. |
| 8 | **Aesthetic and Minimalist Design** | **4 / 4** | High-craft neobrutalism, zero forbidden clichés, disciplined spacing, and razor-sharp typographic hierarchy. |
| 9 | **Error Recovery** | **3 / 4** | Empty search state offers 1-click filter reset; inline error notices without clearing form state. |
| 10 | **Help and Documentation** | **3 / 4** | Clear section subheadings & footer guides; lacks tooltip breakdown on complex synergy scores. |
| **Total** | | **35 / 40** | **Good / High Polish (87.5%)** |

## Design Specificity Verdict
- **LLM Assessment:** Deeply authored (9.2/10). The page rejects generic SaaS components and dark-mode purple glows in favor of a tactile, print-press 35mm fanzine aesthetic with bespoke cinephile nomenclature and custom vector iconography.
- **Deterministic Scan:** 0 critical slop violations. 150 advisory alerts for `text-[10px]` / `text-[11px]` micro-typography in badges and stamps.
- **Visual Overlays:** Not active this session; deterministic findings verified via CLI.

## Overall Impression
A bold, cohesive, and deeply atmospheric cinema club homepage that balances cinematic celebration with high-density discovery. The primary opportunities lie in keyboard-driven power navigation, modal draft preservation, and mobile touch target refinement.

## What's Working
1. **Radical Visual Identity & 35mm Physicality:** Neobrutalist ink borders, solid offset shadows, 2:3 uncropped vertical poster frames, and custom vector icons establish an unmistakable aesthetic.
2. **Social-First Cinephile Radar ("Sana Özel İzdaşlar"):** Multi-vector compatibility cards with dual layouts (3-column desktop grid + gesture swipe deck on mobile with undo & haptics).
3. **Frictionless 2-Click Quick Logging:** Floating "+ İzledim" action and rating modal with half-star granularity and typewriter review logger.

## Priority Issues
- **[P1] Duplicate Search Affordances & Missing Global `Cmd+K` Accelerator**
  - *Why it matters:* Power users expect instant keyboard navigation; catalog search box and global search trigger feel disconnected.
  - *Fix:* Add a global `useEffect` keyboard listener for `Cmd+K` / `Ctrl+K` to open `SearchModal`, display a subtle `⌘K` badge in header, and clarify catalog filter placeholder.
  - *Suggested command:* `/impeccable clarify`
- **[P2] Dirty Form State Loss on Accidental QuickLog Modal Dismissal**
  - *Why it matters:* Users who type detailed typewriter reviews risk losing their draft if they accidentally click outside or hit `ESC`.
  - *Fix:* Guard modal closing with an unsaved changes confirmation when review text is present, or cache draft to `sessionStorage`.
  - *Suggested command:* `/impeccable harden`
- **[P3] Mobile Card Action Touch Target Crowding**
  - *Why it matters:* On 2-column mobile viewports, the 3 miniature action buttons (`w-7 h-7` / ~28px) on `MediaCard` are prone to misclicks.
  - *Fix:* Expand touch hit areas to 44px or let tapping the card on mobile open the detail sheet with full-width action bars.
  - *Suggested command:* `/impeccable adapt`
- **[P4] Top 4 Poster Interactive Affordance in Match Cards**
  - *Why it matters:* Clicking a match's favorite film posters does not open a comparison preview or show if you have also logged that title.
  - *Fix:* Allow tapping any of the 4 favorite posters in `SwipeMatchCard` to open `MediaDetailModal` with a stamped *"Ortak Favori Başyapıtınız!"* badge.
  - *Suggested command:* `/impeccable delight`

## Persona Red Flags
- **Deniz (Cinephile Power User):** Presses `Cmd+K` to quickly search and log an auteur film; shortcut does not trigger.
- **Zeynep (First-Time Casual Viewer):** Swipes right on a 92% match, gets an Auth modal, and needs seamless preservation of the deck state upon return.
- **Can (List Curator):** Wants to click the "Ortak Frekans Noktaları" tags to see the full list of shared films with an İzdaş.

## Minor Observations
1. `src/app/layout.tsx` contains an injected `localhost:8400` script tag from a previous session that should be cleaned up.
2. `page.tsx` poster wrappers have `onClick` handlers but lack `role="button"` and `tabIndex={0}` for keyboard screen-reader accessibility.
3. Footer's "Replik Çek" button could feature a tactile optical click vibration on mobile.

## Questions to Consider
1. *What if the hero marquee dynamically switched between a "Gündüz Matinesi" Cannes restoration by day and a "Gece Seansı" neo-noir thriller at night?*
2. *What if clicking an İzdaş card's Top 4 poster opened a comparison preview showing your score vs their score side-by-side with a "Sohbette Tartış" CTA?*
3. *What if the catalog filter bar featured curated "Sinefil Ruh Hali" categories (e.g. Varoluşsal Bunalım, 70'ler İtalyan Giallo, Yağmurlu Pazar Melankolisi) alongside conventional genres?*
