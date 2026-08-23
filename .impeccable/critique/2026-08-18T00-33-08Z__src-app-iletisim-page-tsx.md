---
target: src/app/iletisim/page.tsx
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-18T00-33-08Z
slug: src-app-iletisim-page-tsx
---
Method: dual-agent (A: dea2a4fc-10cc-4ad3-86a1-afd5ef7fea59 · B: d62b4811-a710-4d3d-aec7-6978127c0f87)

# Design Critique: Yasal & İletişim Sayfaları (`src/app/iletisim/page.tsx`, `src/app/gizlilik/page.tsx`, `src/app/kullanim/page.tsx`)

## Design Health Score

| # | Heuristic | Score (0–4) | Key Finding |
|---|---|:---:|---|
| 1 | **Visibility of System Status** | **2 / 4** | Contact form lacked async dispatch feedback; legal pages lacked reading progress. |
| 2 | **Match System & Real World** | **4 / 4** | Exceptional cinephile domain terms ("Sinefil Destek Kabini", "Daktilo Günlüğü", "Unutulma Hakkı"). |
| 3 | **User Control and Freedom** | **2 / 4** | Missing Table of Contents anchor links and back-to-top buttons on long legal pages. |
| 4 | **Consistency and Standards** | **3 / 4** | Consistent neobrutalist aesthetic; `/contact` lacked static metadata export. |
| 5 | **Error Prevention** | **3 / 4** | Form validation present; inputs needed `id`/`htmlFor` bindings. |
| 6 | **Recognition Over Recall** | **2 / 4** | Long legal agreements need a sticky outline and TL;DR capsule summaries. |
| 7 | **Flexibility and Efficiency** | **2 / 4** | Add quick action shortcuts ("Verilerimi İndir", "Hesap Ayarlarından Sil"). |
| 8 | **Aesthetic and Minimalist Design** | **3 / 4** | Strong neobrutalist physical borders; needs official fanzine seal. |
| 9 | **Error Recovery** | **2 / 4** | Custom inline error and status announcements needed. |
| 10 | **Help and Documentation** | **3 / 4** | Integrated FAQ accordion on contact page. |
| **Total** | | **26 / 40** | **Acceptable (65.0%)** |

## Design Specificity Verdict
- **LLM Assessment:** High thematic grounding in 35mm analog fanzine aesthetics. Enhancing with anchor TOC jump bars, typewriter TL;DR capsules, and official fanzine seals elevates the legal pages into true editorial artifacts.
- **Deterministic Scan:** 0 automated regex slop flags. Mechanical audit caught missing form labels bindings, missing `aria-expanded` on FAQ accordion, and missing static metadata on `/contact`.

## Priority Issues
- **[P1] Table of Contents & Anchor Jump Links on Legal Pages**
  - *Why it matters:* Reading long terms without section anchors creates scanning friction and prevents deep linking.
  - *Suggested command:* `/impeccable layout`
- **[P1] Contact View Separation & Server Metadata**
  - *Why it matters:* Client component in `/contact` stripped SEO metadata. Extracting `ContactView` restores metadata on `/contact` and `/iletisim`.
  - *Suggested command:* `/impeccable harden`
- **[P1] Form Accessibility & Semantic HTML**
  - *Why it matters:* Missing `id`/`htmlFor` pairings and missing `aria-expanded` attributes on FAQ accordion fail WCAG standards.
  - *Suggested command:* `/impeccable adapt`
- **[P2] Fanzine Seal & Typewriter TL;DR Capsules**
  - *Why it matters:* Adds authentic cinephile print-press craftsmanship to legal policies.
  - *Suggested command:* `/impeccable delight`
