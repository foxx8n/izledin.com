-- ============================================================================
-- S1 SECURITY HOTFIX: calculate_cinephile_matches lockdown
-- Date: 2026-08-25 · Plan: MATCHING-PIVOT-PLAN.md §S1
--
-- Defects fixed (each verified against the LIVE database on 2026-08-25):
--   1. EXECUTE was granted to PUBLIC and anon -> any anonymous caller could
--      enumerate every profile's data. Now authenticated-only.
--   2. No ownership guard on p_user_id -> IDOR: any caller could compute any
--      user's radar. Now requires auth.uid() = p_user_id.
--   3. Returned raw birth_date for every candidate. Privacy rule is ages-only:
--      output column birth_date -> computed age integer. Client already maps
--      row.age (matches.service.ts), so this also repairs the intended contract.
--   4. Paid ranking removed: is_premium dropped from ORDER BY; deterministic
--      tiebreak on candidate id keeps pagination stable.
--   5. 'both'-intent scoring asymmetry: candidates whose match_intent = 'both'
--      are already included by the pool filter but scored 5 instead of 15.
--      Now 15 when intents match OR either side is 'both'. Mirrored
--      identically in src/lib/matching-algorithm.ts (same commit).
--
-- GRANT PATTERN mirrors upsert_match_request (verified live):
--   postgres / authenticated / service_role only.
--
-- ROLLBACK: re-run CREATE OR REPLACE with the prior live body below, then
--   GRANT EXECUTE ... TO PUBLIC, anon (only if you accept the leak again).
--
-- ===== PRIOR LIVE BODY (pg_get_functiondef captured 2026-08-25) =====
-- CREATE OR REPLACE FUNCTION public.calculate_cinephile_matches(p_user_id uuid, p_intent_filter text DEFAULT NULL::text, p_limit integer DEFAULT 25)
--  RETURNS TABLE(match_id text, partner_id uuid, username text, full_name text, avatar_url text, bio text, location text, birth_date date, favorite_genres text[], top_4_favorites jsonb, streaming_services text[], is_premium boolean, match_intent text, intent_integrity_score integer, intent_strikes_count integer, compatibility_score integer, shared_genres text[], shared_titles jsonb, match_reasons text[], status text)
--  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
-- AS $function$ ... (identical to the new body EXCEPT:)
--   - no ownership guard
--   - RETURNS birth_date date (raw value selected through)
--   - intent_score: WHEN s.c_intent = v_user_intent THEN 15 ELSE 5 END
--   - match_reasons CASE keyed on c_intent = v_user_intent only
--   - ORDER BY compatibility_score DESC, f.is_premium DESC
-- $function$
-- ============================================================================

-- NOTE: the output column rename birth_date -> age changes the OUT-parameter
-- row type, so Postgres requires an explicit DROP before CREATE. The window
-- without the function is milliseconds and fails CLOSED (permission error,
-- not a leak); the client's local-fallback handles transient RPC errors.
DROP FUNCTION IF EXISTS public.calculate_cinephile_matches(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.calculate_cinephile_matches(
    p_user_id uuid,
    p_intent_filter text DEFAULT NULL::text,
    p_limit integer DEFAULT 25
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
    -- S1: ownership guard — a caller may only compute their own radar
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
    END IF;

    -- 1. Fetch Target User's Cinema DNA
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
        -- If profile not found, return empty set
        RETURN;
    END IF;

    -- 2. Query Candidate Profiles with Weighted Vector Scoring in SQL
    -- Exclude candidates with ANY existing match row (pending, matched, passed, blocked)
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
          AND (p_intent_filter IS NULL OR p_intent_filter = 'all' OR p.match_intent = p_intent_filter OR p.match_intent = 'both' OR v_user_intent = 'both')
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
            -- Jaccard Genre Similarity Score (0-35 points)
            CASE
                WHEN CARDINALITY(s.union_genres) = 0 THEN 15
                ELSE ROUND((CARDINALITY(s.overlap_genres)::NUMERIC / CARDINALITY(s.union_genres)::NUMERIC) * 35)::INT
            END AS genre_score,
            -- Streaming Match Score (0-15 points)
            CASE
                WHEN CARDINALITY(s.overlap_services) > 0 THEN 15
                ELSE 5
            END AS service_score,
            -- Intent Alignment Score (0-15 points)
            -- S1: 'both' means open-to-everything and is already admitted by the
            -- pool filter; it now scores as aligned instead of being penalized.
            CASE
                WHEN s.c_intent = v_user_intent OR s.c_intent = 'both' OR v_user_intent = 'both' THEN 15
                ELSE 5
            END AS intent_score,
            -- Baseline Cinephile Affinity (30-35 points)
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
        -- S1: ages only — raw birth_date never leaves the database
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
    -- S1: paid ranking removed; deterministic tiebreak for stable pagination
    ORDER BY compatibility_score DESC, f.candidate_id ASC
    LIMIT p_limit;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.calculate_cinephile_matches(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_cinephile_matches(uuid, text, integer) TO authenticated, service_role;
