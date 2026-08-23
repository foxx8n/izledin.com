---
target: src/app/auth/page.tsx
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-18T00-27-58Z
slug: src-app-auth-page-tsx
---
Method: dual-agent (A: c334c2fc-ad6d-46cb-b2d1-1fa107aa221d · B: 35ecdcf9-7fd4-452b-965b-eacce25efd16)

# Design Critique: Giriş & Zevk Onboarding (`src/app/auth/page.tsx`, `src/components/auth/AuthModal.tsx`)

## Design Health Score

| # | Heuristic | Score (0–4) | Key Finding |
|---|---|:---:|---|
| 1 | **Visibility of System Status** | **3 / 4** | Clear loading spinner & live regex validation; needs alert live region. |
| 2 | **Match System & Real World** | **3 / 4** | Great generation badges in BirthDateSelector; can lean deeper into 35mm passport artifact. |
| 3 | **User Control and Freedom** | **3 / 4** | Good Escape handler; backdrop click needs dirty-form protection. |
| 4 | **Consistency and Standards** | **3 / 4** | Neobrutalist borders & shadows; headings should use Geist Sans display weight. |
| 5 | **Error Prevention** | **3 / 4** | Good password strength meter & leap-day checks. |
| 6 | **Recognition Over Recall** | **3 / 4** | Inline validation checkmarks; add standard autocomplete tags. |
| 7 | **Flexibility and Efficiency** | **2 / 4** | Needs standalone `/auth` route and 2-step onboarding link to TasteProfiler. |
| 8 | **Aesthetic and Minimalist Design** | **3 / 4** | Zero-blur physical shadows; registration mode needs clean scroll container. |
| 9 | **Error Recovery** | **3 / 4** | Clear Turkish error feedback with role="alert". |
| 10 | **Help and Documentation** | **2 / 4** | Micro-help on why birth date is collected (18+ & İzdaş generation sinerjisi). |
| **Total** | | **28 / 40** | **Good (70.0%)** |

## Design Specificity Verdict
- **LLM Assessment:** Strong 35mm brutalist identity. Main opportunities are adding standalone `/auth` page route, focus trap & ARIA accessibility, `autoComplete` attributes, and 2-step onboarding connection.
- **Deterministic Scan:** 0 automated regex slop flags. Mechanical audit caught missing standalone route, sub-44px touch targets on close button, and missing `htmlFor`/`id` bindings.

## Priority Issues
- **[P0] Standalone `/auth` Route & SSR Health**
  - *Why it matters:* Navigating to `/auth` returns 404. Needs dedicated standalone authentication page.
  - *Suggested command:* `/impeccable layout`
- **[P1] Form Accessibility & Autocomplete**
  - *Why it matters:* Missing `htmlFor`/`id` bindings, `autoComplete` tokens, and `role="dialog"` breaks screen readers and password managers.
  - *Suggested command:* `/impeccable adapt`
- **[P1] Mobile Viewport Overflow & Touch Targets**
  - *Why it matters:* Register form height clips on mobile screens without `max-h-[90vh] overflow-y-auto`. Close button is under 44px.
  - *Suggested command:* `/impeccable harden`
- **[P2] Post-Auth Onboarding Link to Taste Profiler**
  - *Why it matters:* Connecting newly registered members immediately to pick their Top 4 Masterpieces unlocks full platform value.
  - *Suggested command:* `/impeccable delight`
