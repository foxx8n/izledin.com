# izledin.com — Full Security & Bug Audit (2026-08-23)

> ⚠️ **DO NOT COMMIT to any public repo.** Contains vulnerability details about the live app.
> Sources: 7 parallel audit agents (DB/RLS, API routes, client XSS/auth, business-logic abuse,
> core-pages bugs, components/modals/chat bugs, config/secrets) + live dev-server log monitoring
> + operator manual testing pass. Findings deduplicated; convergent findings from independent
> auditors marked ⚡.

## Fixed BEFORE this report (discovered live during testing)

| # | Issue | Status |
|---|---|---|
| F0 | Admin page gate was client-side email check | ✅ `is_admin()` RPC gate (`admin/page.tsx`), tri-state no-flash |
| F1 | **Column-grant regression**: M4 hardening made 5 profile columns unSELECTable; every `select('*')`/`profiles (*)` failed 42501 → profile loads, community feed, matches, inbox, onboarding ALL broken since Aug 22 | ✅ `PROFILE_SELECT_COLUMNS` at all 17 call sites + `admin_list_profiles` RPC (SECURITY DEFINER, is_admin-gated, returns ban triad) |
| F2 | Radar RPC `calculate_cinephile_matches`: invoker-rights read of unSELECTable birth_date (42501) **and** PL/pgSQL variable shadowing (42702 — OUT params collide with column names; function had likely NEVER worked) **and** anon-skippable ownership gate **and** banned users not excluded **and** uncapped limit | ✅ SECURITY DEFINER + unconditional `auth.uid()` gate + ban filter + limit clamp ≤100 + fully qualified refs. Verified live: executes under authenticated role, returns scored rows |

## Wave-0 hardening (applied with this report)

- `TRUNCATE` revoked from anon/authenticated on all public tables (was default-granted)
- `EXECUTE ON is_admin()` granted to anon (policies calling it were failing noisy instead of clean-false)
- `protect_profile_privileged_fields` trigger now also guards `ban_reason`/`banned_at` (owner forgeries); `intent_agreed_at` deliberately left owner-writable (onboarding)
- `get_user_ages` capped at first 100 ids/call (bulk age-harvest oracle)

---

# REMAINING FINDINGS

## 🔴 CRITICAL

### C1. Block/report does NOT sever messaging ⚡
messages INSERT RLS policy checks sender identity + pair participation but never `movie_mate_matches.status`. A reported/blocked user keeps full DM access into the "blocked" pair; messages also flow into `passed` matches. Harassment cannot be terminated.
**Fix:** INSERT policy gains status-aware logic. Product rule (matches current UI): `pending` → only initiator may send exactly the one intro message; `matched` → both free; `passed`/`blocked` → nobody.

### C2. Message history forgery ⚡
messages UPDATE policy ("mark read") has no column restriction → participants can rewrite `content`, `sender_id`, `created_at` of ANY message in the pair incl. partner's.
**Fix:** column-level grants: revoke table UPDATE, grant UPDATE(is_read) only (+ policy pins non-owner rows).

### C3. Trust metrics & stats are self-writable ⚡
`intent_strikes_count`, `intent_integrity_score`, `total_watched_count`, `total_watch_hours` are client-UPDATEable AND forwarded by `mapProfileToDb` (profile.service.ts:107-111). One REST PATCH resets strikes after a report; vanity stats inflatable. **Related:** NOTHING consumes strikes — the "auto-block at 3 strikes" in earlier docs never existed (verified: zero functions/triggers read them).
**Fix:** revoke those column UPDATEs + slim `mapProfileToDb`; implement the missing enforcement (strikes ≥ 3 → is_banned via admin path w/ audit row) inside/after `submit_user_report`.

### C4. Match consent model bypassable end-to-end ⚡ (3 auditors converged)
Broad table policies let either participant write ANY column: force `status:'matched'` without consent, revert a rejection, un-do a report-block, forge `initiator_id`/`compatibility_score`. Client `acceptMatchRequest/rejectMatchRequest` (inbox.service.ts:152-170) are bare unconditional updates; 0-row updates count success; concurrent accept/pass races corrupt state and strand users in invisible chats.
**Fix:** new `match_respond(p_match_id, p_action)` SECURITY DEFINER RPC owning ALL transitions (accept: receiver-only+pending; reject/withdraw; unblock rules). Revoke client UPDATE entirely; rewrite inbox.service onto the RPC; treat empty result as failure + refetch.

## 🟠 HIGH

### H1. Reporting system lacks enforcement + banned users can report
No threshold consumer (see C3); `submit_user_report` (definer) bypasses the reports INSERT ban-check. Also leaks reporter identity via block side-effect + echoes target counters to reporter (M).
**Fix:** reporter-ban guard inside RPC; auto-block per C3; return `{accepted}` only; make block indistinguishable from plain unmatch.

### H2. Birth date permanently rewritable; 18+ enforced nowhere
Owner can change `birth_date` unlimited times (future dates → undefined ages); ToS claims enforcement that doesn't exist.
**Fix:** write-once trigger (admin-RPC override) + CHECK sane range; enforce 18+ for dating intent in radar/match RPCs if product wants it.

### H3. Chat stale-fetch race shows wrong thread
ChatModal open-effect lacks cancellation; slow old fetch overwrites fast new conversation's messages under the wrong header.
**Fix:** cancelled-flag pattern in effect cleanup.

### H4. AuthContext double-load + create race → stuck null profile
getSession + INITIAL_SESSION both run loadUserProfile; parallel INSERTs race PK conflict → loser setProfile(null) overwrites winner; new user stays profile-less until refresh.
**Fix:** single subscription source or in-flight dedupe ref; upsert instead of insert.

### H5. First-contact chat is not live
After prospective→real match conversion, realtime never resubscribes (effect deps don't change) — icebreaker replies invisible until reopen. Flagship flow appears dead.
**Fix:** resubscribe in send-success path or drive effect off activeMatchId.

### H6. ~~Paddle amount-blind premium grant / RevenueCat sandbox leak~~ → DISSOLVED
Payment stack confirmed dead code by owner; full removal queued (Task #5).

## 🟡 MEDIUM

| # | Finding | Fix sketch |
|---|---|---|
| M1 | OMDB quota burn: `/api/catalog?id=` unvalidated proxy → free-tier exhaustion minutes | regex `^tt\d{7,8}$` gate, 400 otherwise |
| M2 | Contact form: name/email/subject uncapped/unvalidated; `'re_dummy'` silent-loss fallback; guessable 4-digit ticket IDs | caps + email regex + explicit 503 + UUID ticket |
| M3 | Stored arbitrary-URL images: poster/backdrop/avatar_url → `<img src>` site-wide (IP-leak pixels, shock content) | host allowlist CHECK/trigger mirroring next.config remotePatterns + service-layer sanitize |
| M4 | Realtime fan-out: Navbar+InboxModal subscribe to ALL platform messages/matches unfiltered; mark-read storms → N×full-inbox recomputes per open inbox | debounce InboxModal handler; narrow filters; long-term private-channel broadcast |
| M5 | Optimistic-send vs realtime echo → duplicate bubble + key collision on jittery networks | filter both tempId and sent.id on replace |
| M6 | MediaDetailModal İZLEDİM/LİSTEYE EKLE persist nothing + state bleeds across movies ⚡(2 auditors) | decide: wire to persistence or remove; add both flags to reset effect regardless (zero-mock-data rule) |
| M7 | SearchModal stale/out-of-order results (clear-X race, slow-old-overwrites-fast-new) | stale-flag pattern both effects |
| M8 | QuickLogModal discard-confirm flag survives reopen → safety prompt dead; Değiştir leaves stacked modals sharing ESC | reset flag in effect; unconditional close on handoff |
| M9 | No CSP/HSTS headers | HSTS one-liner now; pragmatic CSP phase-1 (unsafe-inline styles/scripts, pinned img/connect/frame hosts), nonce later |
| M10 | Public buckets unbounded: avatars+diary-media listable/downloadable by anyone, no size/MIME limits; avatars bucket vestigial | size/MIME caps; diary-media private+signed URLs decision; drop avatars if unused |
| M11 | Ban coverage gaps: watch_logs UPDATE, toggle_watch_log_like, profiles UPDATE, watch_together_items, messages SELECT all usable while banned | central assert_not_banned in remaining paths; consider revoking message reads for banned |
| M12 | Rejection not sticky: passed→pending re-like loop re-pins abuser in inbox forever | persist passed_by/ts; require passee reset or escalating cooldown |
| M13 | Owner-forged social signals: watch_logs likes_count/created_at client-writable | convert watch_logs UPDATE to explicit safe-column grants |
| M14 | Premium perk enforced nowhere server-side; sync_subscription_status is one GRANT away from self-service premium (auth.uid() NULL escape) | keep EXECUTE revoked; add internal-role RAISE guard; mostly moot post payment-removal |

## ⚪ LOW (batch)

Config/secrets: live Paddle keys on disk (dies w/ Task #5 — still scrub + backup-folder copy exists) · OMDB key hardcoded in scripts/expand_catalog_batch{1-4}.js (M5 remnant outside src/) · `.gitignore` excludes `.env.example` (add `!.env.example`) · `Feedback_DO NOT UPLOAD/` folder must leave tree before git init · RESEND_API_KEY documented nowhere · NEXT_PUBLIC_SITE_URL dead var · stray home-dir package-lock.json (turbopack.root pin) · 5 dead create-next-app SVGs in public/ · OG routes deprecated edge runtime · OG param lengths uncapped · RC bearer timing-compare (dies w/ removal)
DB: protect-trigger gap fixed in Wave-0 ✓ · FK indexes missing (custom_lists.user_id, messages.sender_id, matches.initiator_id, user_reports×2, watch_together_items×2) · ~20 auth_rls_initplan wraps · profiles DELETE policy absent (KVKK/GDPR erasure) · read receipts writable both directions · messages.content unbounded · watch-hours ±2h/log farmable · username case-sensitive UNIQUE vs ilike lookups (Admin/admin coexist; .single() throws on collision → 404) + no format constraints + rename squatting · get_user_age(s) anon bulk (capped ✓ W0)
UI: client-side ban gates are dead code (isBanned always false — banner/pre-send warnings can never fire; needs honest redesign via status RPC) · localStorage display-trust (bounded, OK) · fake year fallback '2024'/'2026' rendered AND saved · inbox failures render as innocent empty states · HH:mm-forever timestamps (no date distinction) · cleared review resurrects from sessionStorage draft · compatibility_score `|| 80` fabricates data · AnnouncementBanners remount (re-measured: LOW, no state loss) · premium feed sort contradicts spec · bare Navbar CTAs no-op on 7 pages · profile künye inputs re-seed mid-edit on background refresh · announcement link scheme validation (defense-in-depth) · webhook logs emit uuids (negligible)

## Cleared / verified sound

JSON-LD escaping complete (3/3 sinks) · React kills javascript: schemes framework-wide · OAuth callback not open-redirectable · Paddle signature validation solid (HMAC+replay window) · webhooks fail-closed sans secrets · service-role confined to 2 webhook routes · no secrets in NEXT_PUBLIC_* · robots/sitemap hide admin · Realtime publication excludes profiles (would leak birth_date!) · upsert_match_request actor derivation/self-match/duplicate-report/self-report protections · toggle_watch_log_like drift-free recount · admin_set_user_flags gating · pre-accept messaging UI cap largely working · QuickLog double-submit guarded · hydration clean

---

# IMPLEMENTATION WAVES

**Wave 1 — DB trust & messaging hardening** (C1-C4, H1, H2, M11-M13): messages policy redesign w/ intro-message rule; messages column grants; strikes/stats grant revokes + mapProfileToDb slimming + auto-block implementation; match_respond RPC + inbox.service rewrite; submit_user_report hardening; birth_date write-once; watch_logs column-grant conversion.
**Wave 2 — Frontend correctness** (H3-H5, M4-M8): chat races/resubscribe; AuthContext single-load+upsert; modal/search fixes; MediaDetailModal decision (wire vs remove — ASK USER).
**Wave 3 — Payment removal + config** (Task #5, M1, M2, M9, M14): delete paddle/rc libs+routes+deps+AuthContext hook+PremiumModal checkout (keep /premium showcase), scrub env vars & keys from disk, sync_subscription_status disposal, catalog id regex, contact validation, HSTS+CSP phase-1.
**Wave 4 — Polish batch**: LOW items + FK indexes + advisors sweep + git-init pre-flight checklist execution.

## Operator actions (only you can do)
1. Rotate/close the Paddle account keys (live-format keys sat in .env.local; backup folder copy exists)
2. Move `Feedback_DO NOT UPLOAD/` out of the project tree before git init
3. Check Vercel env vars: RevenueCat placeholder/pdl_-prefix values, RESEND_API_KEY presence
4. Decide: MediaDetailModal buttons — wire to persistence or remove? Pre-accept intro message rule OK as described?
