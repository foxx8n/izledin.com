-- ============================================================================
-- S14 ORTAK SEANS: wake up watch_together_items
-- Date: 2026-08-26 · Plan: MATCHING-PIVOT-PLAN.md §S14
--
-- The table itself (columns + participant-scoped RLS) shipped production-
-- correct and dormant. Two gaps blocked the UI:
--   1. postgres_changes on this table silently delivers NOTHING while the
--      table is outside the supabase_realtime publication -> add it.
--   2. media_type CHECK excluded 'series' while watch_logs, the client
--      MediaType union AND title_swipes all accept it -> widen additively
--      (drop + re-add with the extra value; existing rows unaffected).
--
-- ROLLBACK:
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.watch_together_items;
--   ALTER TABLE public.watch_together_items DROP CONSTRAINT watch_together_items_media_type_check;
--   ALTER TABLE public.watch_together_items ADD CONSTRAINT watch_together_items_media_type_check
--     CHECK (media_type = ANY(ARRAY['movie'::text,'tv'::text,'anime'::text]));
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_together_items;

ALTER TABLE public.watch_together_items
    DROP CONSTRAINT watch_together_items_media_type_check;

ALTER TABLE public.watch_together_items
    ADD CONSTRAINT watch_together_items_media_type_check
    CHECK (media_type = ANY(ARRAY['movie'::text, 'tv'::text, 'anime'::text, 'series'::text]));
