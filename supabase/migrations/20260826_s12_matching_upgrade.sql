-- ============================================================================
-- S12 MATCHING UPGRADE: taste-vector overlap + self-resurface window
-- Date: 2026-08-26 · Plan: MATCHING-PIVOT-PLAN.md §S12
--
-- WHAT CHANGES:
--   1. calculate_cinephile_moves gains a taste-vector overlap term:
--      per-user liked set = title_swipes(direction IN ('like','super'))
--      UNION watch_logs(status IN ('watched','watching')) on media_id.
--      title_score = LEAST(10, ROUND((30*shared_n)/GREATEST(my_taste_n,10)))
--      -> max +10 pts; genre×35 stays dominant. With empty tables the output
--      is byte-identical to the prior function (safe rollout).
--   2. shared_titles output (was hardcoded '[]') fills with up to 6
--      {id,title,type} objects resolved through media_catalog, post-LIMIT.
--   3. Trailing param p_resurface_days INTEGER DEFAULT NULL. When >0, pairs
--      whose ONLY movie_mate_matches row is status='passed' AND
--      passed_by=caller AND passed_at < now()-interval re-enter the radar
--      with their REAL match id. Sticky rejection (other side passed) stays
--      impossible BY CONSTRUCTION. NULL/<=0 => byte-identical legacy behavior.
--
-- ROLLBACK: run the prior body (verbatim below), then:
--   DROP FUNCTION IF EXISTS public.calculate_cinephile_matches(uuid, text, integer, integer);
--   REVOKE/GRANT block re-targeted at the 3-arg signature.
--   Indexes/backfill are inert leftovers and need no reversal.
--
-- OVERLOAD WARNING: CREATE OR REPLACE with a changed arg list does NOT replace
--   anything - it silently creates a second overload and every existing caller
--   keeps resolving to the stale shadow. The explicit DROP of the old signature
--   below is load-bearing; do not remove it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PRIOR LIVE BODY (pg_get_functiondef captured 2026-08-26) — verbatim, for rollback
-- ----------------------------------------------------------------------------
/*
CREATE OR REPLACE FUNCTION public.calculate_cinephile_matches(p_user_id uuid, p_intent_filter text DEFAULT NULL::text, p_limit integer DEFAULT 25)
 RETURNS TABLE(match_id text, partner_id uuid, username text, full_name text, avatar_url text, bio text, location text, age integer, favorite_genres text[], top_4_favorites jsonb, streaming_services text[], is_premium boolean, match_intent text, intent_integrity_score integer, intent_strikes_count integer, compatibility_score integer, shared_genres text[], shared_titles jsonb, match_reasons text[], status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_genres TEXT[];
    v_user_services TEXT[];
    v_user_intent TEXT;
    v_user_favorites JSONB;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
    END IF;

    SELECT
        COALESCE(p.favorite_genres, '{}'),
        COALESCE(p.streaming_services, '{}'),
        COALESCE(p.match_intent, 'friend'),
        COALESCE(p.top_4_favorites, '[]'::jsonb)
    INTO
        v_user_genres,
        v_user_services,
        v_user_intent,
        v_user_favorites
    FROM public.profiles p
    WHERE p.id = p_user_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH candidate_pool AS (
        SELECT
            p.id AS candidate_id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.bio,
            p.location,
            p.birth_date,
            p.favorite_genres AS c_genres,
            p.top_4_favorites AS c_favorites,
            p.streaming_services AS c_services,
            p.is_premium,
            COALESCE(p.match_intent, 'friend') AS c_intent,
            COALESCE(p.intent_integrity_score, 88) AS c_integrity,
            COALESCE(p.intent_strikes_count, 0) AS c_strikes
        FROM public.profiles p
        LEFT JOIN public.movie_mate_matches m
            ON (m.user_id_1 = LEAST(p_user_id, p.id) AND m.user_id_2 = GREATEST(p_user_id, p.id))
        WHERE p.id <> p_user_id
          AND p.match_enabled = TRUE
          AND COALESCE(p.radar_visible, TRUE) = TRUE
          AND (
            COALESCE(p.match_intent, 'friend') = 'both'
            OR v_user_intent = 'both'
            OR COALESCE(p.match_intent, 'friend') = v_user_intent
          )
          AND (p_intent_filter IS NULL OR p_intent_filter = 'all' OR COALESCE(p.match_intent, 'friend') = p_intent_filter)
          AND m.id IS NULL
    ),
    scored_candidates AS (
        SELECT
            c.*,
            ARRAY(
                SELECT UNNEST(c.c_genres)
                INTERSECT
                SELECT UNNEST(v_user_genres)
            ) AS overlap_genres,
            ARRAY(
                SELECT UNNEST(c.c_genres)
                UNION
                SELECT UNNEST(v_user_genres)
            ) AS union_genres,
            ARRAY(
                SELECT UNNEST(c.c_services)
                INTERSECT
                SELECT UNNEST(v_user_services)
            ) AS overlap_services
        FROM candidate_pool c
    ),
    final_calculations AS (
        SELECT
            s.candidate_id,
            s.username,
            s.full_name,
            s.avatar_url,
            s.bio,
            s.location,
            s.birth_date,
            s.c_genres,
            s.c_favorites,
            s.c_services,
            s.is_premium,
            s.c_intent,
            s.c_integrity,
            s.c_strikes,
            'pending'::text AS match_status,
            s.overlap_genres,
            CASE
                WHEN CARDINALITY(s.union_genres) = 0 THEN 15
                ELSE ROUND((CARDINALITY(s.overlap_genres)::NUMERIC / CARDINALITY(s.union_genres)::NUMERIC) * 35)::INT
            END AS genre_score,
            CASE
                WHEN CARDINALITY(s.overlap_services) > 0 THEN 15
                ELSE 5
            END AS service_score,
            CASE
                WHEN s.c_intent = v_user_intent OR s.c_intent = 'both' OR v_user_intent = 'both' THEN 15
                ELSE 5
            END AS intent_score,
            32 AS baseline_score
        FROM scored_candidates s
    )
    SELECT
        ('prospective_' || f.candidate_id::TEXT) AS match_id,
        f.candidate_id AS partner_id,
        f.username,
        f.full_name,
        f.avatar_url,
        f.bio,
        f.location,
        DATE_PART('year', AGE(f.birth_date))::INT AS age,
        f.c_genres AS favorite_genres,
        f.c_favorites AS top_4_favorites,
        f.c_services AS streaming_services,
        f.is_premium,
        f.c_intent AS match_intent,
        f.c_integrity AS intent_integrity_score,
        f.c_strikes AS intent_strikes_count,
        LEAST(99, GREATEST(50, f.genre_score + f.service_score + f.intent_score + f.baseline_score))::INT AS compatibility_score,
        f.overlap_genres AS shared_genres,
        '[]'::jsonb AS shared_titles,
        ARRAY[
            'Ortak türler: ' || COALESCE(ARRAY_TO_STRING(f.overlap_genres[1:3], ', '), 'Sinema Tutkusu'),
            CASE
                WHEN f.c_intent = v_user_intent OR f.c_intent = 'both' OR v_user_intent = 'both' THEN 'Ortak kulüp niyeti ve vizyon anlayışı'
                ELSE 'Yüksek 35mm frekans uyumu'
            END
        ] AS match_reasons,
        f.match_status AS status
    FROM final_calculations f
    ORDER BY compatibility_score DESC, f.candidate_id ASC
    LIMIT p_limit;
END;
$function$
*/
-- ----------------------------------------------------------------------------

-- Partial indexes: cover the co-like fan-out scans and skip pass rows.
-- Plain CREATE INDEX (not CONCURRENTLY): tables hold 0 and ~10 rows today.
CREATE INDEX IF NOT EXISTS idx_title_swipes_like_media
    ON public.title_swipes (media_id, user_id)
    WHERE direction IN ('like', 'super');

CREATE INDEX IF NOT EXISTS idx_watch_logs_active_media
    ON public.watch_logs (media_id, user_id)
    WHERE status IN ('watched', 'watching');

-- Backfill defensive: any 'passed' row whose passer is known but timestamp was
-- never stamped gets updated_at as best estimate. Rows with NULL passed_by are
-- deliberately untouched (never resurface per plan rule).
UPDATE public.movie_mate_matches
SET passed_at = updated_at
WHERE status = 'passed'
  AND passed_at IS NULL
  AND passed_by IS NOT NULL;

-- NEW 4-ARG FUNCTION ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_cinephile_matches(
    p_user_id uuid,
    p_intent_filter text DEFAULT NULL::text,
    p_limit integer DEFAULT 25,
    p_resurface_days integer DEFAULT NULL::integer
)
 RETURNS TABLE(match_id text, partner_id uuid, username text, full_name text, avatar_url text, bio text, location text, age integer, favorite_genres text[], top_4_favorites jsonb, streaming_services text[], is_premium boolean, match_intent text, intent_integrity_score integer, intent_strikes_count integer, compatibility_score integer, shared_genres text[], shared_titles jsonb, match_reasons text[], status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_genres TEXT[];
    v_user_services TEXT[];
    v_user_intent TEXT;
    v_user_favorites JSONB;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
    END IF;

    SELECT
        COALESCE(p.favorite_genres, '{}'),
        COALESCE(p.streaming_services, '{}'),
        COALESCE(p.match_intent, 'friend'),
        COALESCE(p.top_4_favorites, '[]'::jsonb)
    INTO
        v_user_genres,
        v_user_services,
        v_user_intent,
        v_user_favorites
    FROM public.profiles p
    WHERE p.id = p_user_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH my_taste AS (
        -- ONE vector serves legacy + new users: swipe likes and positive watch
        -- logs share the media_catalog id space, UNION dedupes double-hits.
        SELECT ts.media_id
        FROM public.title_swipes ts
        WHERE ts.user_id = p_user_id AND ts.direction IN ('like', 'super')
        UNION
        SELECT wl.media_id
        FROM public.watch_logs wl
        WHERE wl.user_id = p_user_id AND wl.status IN ('watched', 'watching')
    ),
    taste_stats AS (
        SELECT COUNT(*)::INT AS n FROM my_taste
    ),
    taste_counts AS (
        SELECT h.uid AS candidate_id, COUNT(*)::INT AS shared_n
        FROM (
            SELECT ts.user_id AS uid, ts.media_id
            FROM public.title_swipes ts
            JOIN my_taste t ON t.media_id = ts.media_id
            WHERE ts.direction IN ('like', 'super') AND ts.user_id <> p_user_id
            UNION
            SELECT wl.user_id AS uid, wl.media_id
            FROM public.watch_logs wl
            JOIN my_taste t ON t.media_id = wl.media_id
            WHERE wl.status IN ('watched', 'watching') AND wl.user_id <> p_user_id
        ) h
        GROUP BY h.uid
    ),
    candidate_pool AS (
        SELECT
            p.id AS candidate_id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.bio,
            p.location,
            p.birth_date,
            p.favorite_genres AS c_genres,
            p.top_4_favorites AS c_favorites,
            p.streaming_services AS c_services,
            p.is_premium,
            COALESCE(p.match_intent, 'friend') AS c_intent,
            COALESCE(p.intent_integrity_score, 88) AS c_integrity,
            COALESCE(p.intent_strikes_count, 0) AS c_strikes,
            m.id AS prior_id,
            m.status AS prior_status,
            m.passed_by AS prior_passed_by,
            m.passed_at AS prior_passed_at
        FROM public.profiles p
        LEFT JOIN public.movie_mate_matches m
            ON (m.user_id_1 = LEAST(p_user_id, p.id) AND m.user_id_2 = GREATEST(p_user_id, p.id))
        WHERE p.id <> p_user_id
          AND p.match_enabled = TRUE
          AND COALESCE(p.radar_visible, TRUE) = TRUE
          AND (
            COALESCE(p.match_intent, 'friend') = 'both'
            OR v_user_intent = 'both'
            OR COALESCE(p.match_intent, 'friend') = v_user_intent
          )
          AND (p_intent_filter IS NULL OR p_intent_filter = 'all' OR COALESCE(p.match_intent, 'friend') = p_intent_filter)
          AND (
                m.id IS NULL
                OR (
                    p_resurface_days IS NOT NULL
                    AND p_resurface_days > 0
                    AND m.status = 'passed'
                    AND m.passed_by = p_user_id
                    AND m.passed_at < now() - make_interval(days => p_resurface_days)
                )
          )
    ),
    scored_candidates AS (
        SELECT
            c.*,
            ARRAY(
                SELECT UNNEST(c.c_genres)
                INTERSECT
                SELECT UNNEST(v_user_genres)
            ) AS overlap_genres,
            ARRAY(
                SELECT UNNEST(c.c_genres)
                UNION
                SELECT UNNEST(v_user_genres)
            ) AS union_genres,
            ARRAY(
                SELECT UNNEST(c.c_services)
                INTERSECT
                SELECT UNNEST(v_user_services)
            ) AS overlap_services
        FROM candidate_pool c
    ),
    final_calculations AS (
        SELECT
            s.candidate_id,
            s.username,
            s.full_name,
            s.avatar_url,
            s.bio,
            s.location,
            s.birth_date,
            s.c_genres,
            s.c_favorites,
            s.c_services,
            s.is_premium,
            s.c_intent,
            s.c_integrity,
            s.c_strikes,
            s.overlap_genres,
            CASE
                WHEN CARDINALITY(s.union_genres) = 0 THEN 15
                ELSE ROUND((CARDINALITY(s.overlap_genres)::NUMERIC / CARDINALITY(s.union_genres)::NUMERIC) * 35)::INT
            END AS genre_score,
            CASE
                WHEN CARDINALITY(s.overlap_services) > 0 THEN 15
                ELSE 5
            END AS service_score,
            CASE
                WHEN s.c_intent = v_user_intent OR s.c_intent = 'both' OR v_user_intent = 'both' THEN 15
                ELSE 5
            END AS intent_score,
            32 AS baseline_score,
            (s.prior_id IS NOT NULL) AS is_resurfaced,
            s.prior_id,
            s.prior_status,
            (SELECT n FROM taste_stats) AS my_taste_n,
            tc.shared_n
        FROM scored_candidates s
        LEFT JOIN taste_counts tc ON tc.candidate_id = s.candidate_id
    )
    SELECT
        CASE WHEN f.is_resurfaced THEN f.prior_id::TEXT
             ELSE ('prospective_' || f.candidate_id::TEXT) END AS match_id,
        f.candidate_id AS partner_id,
        f.username,
        f.full_name,
        f.avatar_url,
        f.bio,
        f.location,
        DATE_PART('year', AGE(f.birth_date))::INT AS age,
        f.c_genres AS favorite_genres,
        f.c_favorites AS top_4_favorites,
        f.c_services AS streaming_services,
        f.is_premium,
        f.c_intent AS match_intent,
        f.c_integrity AS intent_integrity_score,
        f.c_strikes AS intent_strikes_count,
        LEAST(99, GREATEST(50, f.genre_score + f.service_score + f.intent_score + f.baseline_score
            + CASE WHEN f.shared_n IS NULL THEN 0
                   ELSE LEAST(10, ROUND((30 * f.shared_n)::NUMERIC / GREATEST(f.my_taste_n, 10)))::INT
              END))::INT AS compatibility_score,
        f.overlap_genres AS shared_genres,
        COALESCE(tt.payload, '[]'::jsonb) AS shared_titles,
        array_remove(
            ARRAY[
                'Ortak türler: ' || COALESCE(ARRAY_TO_STRING(f.overlap_genres[1:3], ', '), 'Sinema Tutkusu'),
                CASE
                    WHEN f.c_intent = v_user_intent OR f.c_intent = 'both' OR v_user_intent = 'both' THEN 'Ortak kulüp niyeti ve vizyon anlayışı'
                    ELSE 'Yüksek 35mm frekans uyumu'
                END,
                CASE WHEN f.shared_n > 0 THEN
                    'Ortak beğeni: ' || COALESCE(ARRAY_TO_STRING(tt.names[1:2], ', '), f.shared_n::TEXT || ' ortak yapım')
                END
            ], NULL
        ) AS match_reasons,
        CASE WHEN f.is_resurfaced THEN f.prior_status ELSE 'pending'::text END AS status
    FROM final_calculations f
    LEFT JOIN LATERAL (
        -- Display-only enrichment for returned rows only (post-LIMIT cost).
        SELECT
            JSONB_AGG(JSONB_BUILD_OBJECT('id', u.media_id, 'title', c.title, 'type', c.type)
                      ORDER BY u.media_id) AS payload,
            ARRAY_AGG(c.title ORDER BY u.media_id) AS names
        FROM (
            SELECT x.media_id FROM (
                SELECT ts.media_id
                FROM public.title_swipes ts
                JOIN my_taste t ON t.media_id = ts.media_id
                WHERE ts.user_id = f.candidate_id AND ts.direction IN ('like', 'super')
                UNION
                SELECT wl.media_id
                FROM public.watch_logs wl
                JOIN my_taste t ON t.media_id = wl.media_id
                WHERE wl.user_id = f.candidate_id AND wl.status IN ('watched', 'watching')
            ) x
            ORDER BY x.media_id
            LIMIT 6
        ) u
        JOIN public.media_catalog c ON c.id = u.media_id
    ) tt ON f.shared_n > 0
    ORDER BY compatibility_score DESC, f.is_resurfaced ASC, f.candidate_id ASC
    LIMIT p_limit;
END;
$function$
;

-- Drop the STALE 3-arg overload BEFORE clients resolve to it. Order inside the
-- migration transaction guarantees no window without any function.
DROP FUNCTION IF EXISTS public.calculate_cinephile_matches(uuid, text, integer);

REVOKE EXECUTE ON FUNCTION public.calculate_cinephile_matches(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_cinephile_matches(uuid, text, integer, integer) TO postgres, authenticated, service_role;
