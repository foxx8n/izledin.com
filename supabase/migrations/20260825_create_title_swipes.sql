-- ============================================================================
-- S9: TITLE_SWIPES data plane (MATCHING-PIVOT-PLAN.md §S9 / §3-Persistence)
-- Date: 2026-08-25
--
-- Private per-user swipe ledger behind the PERDE title deck. Feeds (later
-- sessions): taste-vector matcher upgrade (S12), guest queue replay (S10).
--
-- Privacy posture:
--   - RLS: insert/read/update OWN rows only; never exposed via realtime
--     publication (verified below); direction data stays private forever.
--   - Public signal ONLY through get_title_taste_stats(): aggregate LIKE
--     counts with a K-anonymity floor — counts below 5 return as
--     low_confidence=true with count zeroed so the UI says "birkaç izdaş"
--     instead of a de-anonymizing numeral (Red-Team C3).
--
-- Rollback: DROP TABLE public.title_swipes; drop the stats function.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.title_swipes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id text NOT NULL,
    media_type text NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie','tv','anime','series')),
    direction text NOT NULL CHECK (direction IN ('like','pass','super')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_title_swipes_media_id ON public.title_swipes (media_id);
CREATE INDEX IF NOT EXISTS idx_title_swipes_user_recent ON public.title_swipes (user_id, created_at DESC);

ALTER TABLE public.title_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own title swipes"
  ON public.title_swipes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id AND NOT is_currently_banned());

CREATE POLICY "Users can read their own title swipes"
  ON public.title_swipes FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own title swipes"
  ON public.title_swipes FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Aggregate-only stats: SECURITY DEFINER (must read across users past RLS),
-- pinned search_path, authenticated-only EXECUTE, counts never usernames.
CREATE OR REPLACE FUNCTION public.get_title_taste_stats(p_media_ids text[])
RETURNS TABLE(media_id text, like_count integer, low_confidence boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ts.media_id,
        CASE
            WHEN COUNT(*) FILTER (WHERE ts.direction = 'like') >= 5
                THEN COUNT(*) FILTER (WHERE ts.direction = 'like')::int
            ELSE 0
        END AS like_count,
        (COUNT(*) FILTER (WHERE ts.direction = 'like') > 0
         AND COUNT(*) FILTER (WHERE ts.direction = 'like') < 5) AS low_confidence
    FROM public.title_swipes ts
    WHERE ts.media_id = ANY(p_media_ids)
    GROUP BY ts.media_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_title_taste_stats(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_title_taste_stats(text[]) TO authenticated, service_role;

-- S9 acceptance (§A10): title_swipes must NEVER join the realtime publication
-- (per-user swipe rows would leak past the K-anonymity floor). New tables
-- default out; this assertion fails the migration if that ever changes.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'title_swipes'
    ) THEN
        RAISE EXCEPTION 'title_swipes must not be in the supabase_realtime publication';
    END IF;
END $$;
