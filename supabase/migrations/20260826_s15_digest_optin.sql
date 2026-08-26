-- ============================================================================
-- S15 E-POSTA ÖZETİ: opt-in columns for the weekly İZDAŞ radar digest
-- Date: 2026-08-26 · Plan: MATCHING-PIVOT-PLAN.md §S15
--
-- digest_opt_in: explicit KVKK opt-in (default OFF — nobody is ever emailed
--   without consent; /acik-riza carries the consent copy).
-- last_digest_sent_at: idempotency guard so the cron route can never
--   double-send within a week even if it retries or overlaps.
--
-- GRANTS ARE LOAD-BEARING: profiles uses enumerated column grants. Without the
-- SELECT grant the client profile read keeps working only because services
-- select explicit column lists — but any future .select('*') would 42501, and
-- without UPDATE grant the opt-in toggle silently fails. Mirror the 'bio'
-- regime: SELECT/INSERT/REFERENCES → anon+authenticated+postgres+service_role,
-- UPDATE → authenticated+postgres+service_role.
--
-- ROLLBACK:
--   ALTER TABLE public.profiles DROP COLUMN digest_opt_in;
--   ALTER TABLE public.profiles DROP COLUMN last_digest_sent_at;
-- ============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS digest_opt_in boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_digest_sent_at timestamptz;

GRANT SELECT (digest_opt_in, last_digest_sent_at) ON public.profiles TO anon, authenticated, postgres, service_role;
GRANT INSERT (digest_opt_in, last_digest_sent_at) ON public.profiles TO anon, authenticated, postgres, service_role;
GRANT REFERENCES (digest_opt_in, last_digest_sent_at) ON public.profiles TO anon, authenticated, postgres, service_role;
GRANT UPDATE (digest_opt_in, last_digest_sent_at) ON public.profiles TO authenticated, postgres, service_role;
