-- ============================================================================
-- S8 İZDAŞ GÜVENCESİ — women-first trust bundle (MATCHING-PIVOT-PLAN.md §5/S8)
-- Date: 2026-08-25
--
-- 1. profiles.radar_visible: "RADARDA GÖRÜNME" opt-out. TRUE default (nobody
--    silently hidden); the matcher pool admits visible candidates only.
--    Column grants extend the enumerated patterns (20260824_*).
-- 2. Strict intent pairing in the matcher pool: friend<->dating mismatched
--    pairs never enter decks. 'both' pairs with everyone; equal intents pair.
--    (Red-Team E1: flört layer must be opt-in, invisible otherwise.)
-- 3. Daily like cap enforced INSIDE upsert_match_request (DB-side — client
--    limits are bypassable): 25 pending-initiated partners per day.
-- 4. Message blocklist trigger: static abusive-term list rejected server-side
--    on EVERY messages insert (superset of first-message-only; stronger).
--
-- ROLLBACK: calculate_cinephile_matches prior body = 20260825_hotfix_
-- cinephile_matches_lockdown.sql; upsert_match_request prior body = the same
-- body as below MINUS the "S8 daily like cap" block; drop trg_message_blocklist.
-- ============================================================================

-- ── 1. Visibility toggle ────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS radar_visible boolean NOT NULL DEFAULT true;

GRANT SELECT (radar_visible) ON public.profiles TO anon, authenticated;
GRANT UPDATE (radar_visible) ON public.profiles TO authenticated;

-- ── 2+3. Matcher pool tightening ────────────────────────────────────────────
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
          -- S8: hidden profiles never enter anyone's deck
          AND COALESCE(p.radar_visible, TRUE) = TRUE
          -- S8: strict intent pairing ('both' universal; else intents equal).
          -- Replaces the S1 OR-chain that served friend-seekers dating-intent
          -- candidates under the 'all' filter.
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
$function$;

REVOKE EXECUTE ON FUNCTION public.calculate_cinephile_matches(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_cinephile_matches(uuid, text, integer) TO authenticated, service_role;

-- ── 3. Daily like cap inside upsert_match_request (full live body + cap) ────
CREATE OR REPLACE FUNCTION public.upsert_match_request(p_partner_id uuid, p_status text, p_compatibility_score integer DEFAULT NULL::integer, p_shared_genres text[] DEFAULT NULL::text[], p_shared_titles jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(match_id uuid, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_me           uuid := auth.uid();
    v_cur_status   text;
    v_cur_initiator uuid;
    v_cur_passed_by uuid;
    v_inserted     boolean := false;
    v_today_likes  int;
begin
    if v_me is null then
        raise exception 'Unauthorized' using errcode = '42501';
    end if;
    if v_me = p_partner_id then
        raise exception 'You cannot match with yourself';
    end if;
    if p_status not in ('pending', 'passed') then
        raise exception 'Invalid match status';
    end if;
    if public.is_currently_banned() then
        raise exception 'Account suspended' using errcode = '42501';
    end if;

    -- S8 İZDAŞ GÜVENCESİ: daily like cap, DB-side (25 partners/day).
    -- Only pending-initiated rows count; passes never consume quota, and
    -- re-pings of older pairs keep their original created_at (no double cost).
    if p_status = 'pending' then
        select count(*) into v_today_likes
        from public.movie_mate_matches
        where initiator_id = v_me
          and status = 'pending'
          and created_at >= date_trunc('day', now());
        if v_today_likes >= 25 then
            raise exception 'Günlük izdaş isteği sınırına ulaştın (25). Yarın tekrar dene.'
              using errcode = 'P0001';
        end if;
    end if;

    -- Fresh pair fast-path (unique-violation-safe against concurrent first likes)
    begin
        insert into public.movie_mate_matches
            (user_id_1, user_id_2, compatibility_score, shared_genres, shared_titles,
             status, initiator_id, updated_at)
        values
            (least(v_me, p_partner_id), greatest(v_me, p_partner_id),
             coalesce(p_compatibility_score, 80),
             coalesce(p_shared_genres, '{}'),
             coalesce(p_shared_titles, '[]'::jsonb),
             p_status,
             case when p_status = 'pending' then v_me end,
             now());
        v_inserted := true;
    exception when unique_violation then
        null; -- fall through to transition logic
    end;

    if v_inserted then
        return query
        select m.id, m.status::text
        from public.movie_mate_matches m
        where m.user_id_1 = least(v_me, p_partner_id)
          and m.user_id_2 = greatest(v_me, p_partner_id);
        return;
    end if;

    select m.status, m.initiator_id, m.passed_by
      into v_cur_status, v_cur_initiator, v_cur_passed_by
    from public.movie_mate_matches m
    where m.user_id_1 = least(v_me, p_partner_id)
      and m.user_id_2 = greatest(v_me, p_partner_id);

    -- Metadata refresh helper applied on every live-state touch
    update public.movie_mate_matches m set
        compatibility_score = coalesce(p_compatibility_score, m.compatibility_score),
        shared_genres       = coalesce(p_shared_genres, m.shared_genres),
        shared_titles       = coalesce(p_shared_titles, m.shared_titles),
        updated_at          = now()
    where m.user_id_1 = least(v_me, p_partner_id)
      and m.user_id_2 = greatest(v_me, p_partner_id);

    if v_cur_status in ('blocked', 'matched') then
        -- report-blocks and live conversations are never touched here
        null;
    elsif v_cur_status = 'pending' then
        if p_status = 'pending' then
            if v_cur_initiator is distinct from v_me then
                -- MUTUAL LIKE: receiver liked back; original initiator preserved
                update public.movie_mate_matches
                set status = 'matched', updated_at = now()
                where user_id_1 = least(v_me, p_partner_id)
                  and user_id_2 = greatest(v_me, p_partner_id);
            end if;
            -- initiator re-ping: metadata refresh only
        else
            -- withdraw (initiator) or reject (receiver) -> recorded pass
            update public.movie_mate_matches
            set status = 'passed', passed_by = v_me, passed_at = now(), updated_at = now()
            where user_id_1 = least(v_me, p_partner_id)
              and user_id_2 = greatest(v_me, p_partner_id);
        end if;
    elsif v_cur_status = 'passed' then
        if p_status = 'passed' then
            null; -- already passed; noop
        elsif v_cur_passed_by is distinct from v_me then
            -- Rejection stickiness: only the passer may revive the pair
            raise exception 'Bu eşleşme talebi daha önce reddedildi.' using errcode = 'P0001';
        else
            -- The passer reconsidered: revives as THEIR OWN pending request
            update public.movie_mate_matches
            set status = 'pending',
                initiator_id = v_me,
                passed_by = null,
                passed_at = null,
                updated_at = now()
            where user_id_1 = least(v_me, p_partner_id)
              and user_id_2 = greatest(v_me, p_partner_id);
        end if;
    end if;

    return query
    select m.id, m.status::text
    from public.movie_mate_matches m
    where m.user_id_1 = least(v_me, p_partner_id)
      and m.user_id_2 = greatest(v_me, p_partner_id);
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.upsert_match_request(uuid, text, integer, text[], jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_match_request(uuid, text, integer, text[], jsonb) TO authenticated, service_role;

-- ── 4. Message blocklist trigger ────────────────────────────────────────────
-- Static hard-abuse list (substring match on lowercased content). Deliberately
-- narrow to avoid false-positive moderation of film banter ("aptalca" etc.);
-- report/block remains the escalation path for everything subtler.
CREATE OR REPLACE FUNCTION public.enforce_message_blocklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_bad boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM unnest(ARRAY[
            'orospu', 'pic ', 'piç', 'sikim', 'sikic', 'sikiy', 'amina', 'amına',
            'gotveren', 'götveren', 'ananı', 'anani', 'ocağını', 'ocagina',
            'pezevenk', 'ibne', 'yavşak', 'hassiktir', 'haşşık', 'siktir'
        ]) AS w
        WHERE position(lower(w) in lower(NEW.content)) > 0
    ) INTO v_bad;
    IF v_bad THEN
        RAISE EXCEPTION 'Mesajında uygunsuz bir ifade algılandı. Lütfen cümleyi düzenle.'
          USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_message_blocklist ON public.messages;
CREATE TRIGGER trg_message_blocklist
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_blocklist();
