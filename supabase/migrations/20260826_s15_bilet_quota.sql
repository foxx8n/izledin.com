-- ============================================================================
-- S15 BİLET QUOTA: people-super-like, free 1/day · premium unlimited · DB-side
-- Date: 2026-08-26 · Plan: MATCHING-PIVOT-PLAN.md §S15 (KÜLT DAMGA → BİLET)
--
-- WHAT CHANGES:
--   1. movie_mate_matches.is_bilet BOOLEAN NOT NULL DEFAULT false — provenance
--      flag set ONLY on the original INSERT; every state transition (mutual
--      matched, passer revive, pass-on-pending) leaves it untouched, so a
--      BİLET stays visible to the receiver forever ("BİLETLE geldi").
--   2. upsert_match_request gains trailing p_is_bilet BOOLEAN DEFAULT false:
--      - quota counts ALL of today's BİLET inserts by the initiator regardless
--        of current status — counting only 'pending' (like the 25/day cap)
--        would let a free user chain BİLETs through fast acceptances;
--      - premium (profiles.is_premium) is exempt, read inside SECURITY DEFINER;
--      - p_is_bilet=true with p_status<>'pending' is rejected as nonsense;
--      - pg_advisory_xact_lock serializes per-user, closing the TOCTOU race on
--        BOTH daily caps (the S8 cap had lived with the same race);
--      - search_path fixed to 'public','pg_temp' (live body had 'public' only).
--
-- GRANT HAZARD: this table uses fully enumerated per-column grants. A new
--   column without a SELECT grant does NOT hide from .select('*') — it makes
--   EVERY PostgREST select fail 42501 for every user. Grants below are
--   load-bearing, not hygiene.
--
-- ROLLBACK:
--   DROP FUNCTION IF EXISTS public.upsert_match_request(uuid,text,integer,text[],jsonb,boolean);
--   <re-run prior body verbatim from header> + its REVOKE/GRANT block
--   ALTER TABLE public.movie_mate_matches DROP COLUMN is_bilet;
-- ============================================================================
-- PRIOR LIVE BODY (pg_get_functiondef captured 2026-08-26) — verbatim:
-- ----------------------------------------------------------------------------
/*
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
        null;
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

    update public.movie_mate_matches m set
        compatibility_score = coalesce(p_compatibility_score, m.compatibility_score),
        shared_genres       = coalesce(p_shared_genres, m.shared_genres),
        shared_titles       = coalesce(p_shared_titles, m.shared_titles),
        updated_at          = now()
    where m.user_id_1 = least(v_me, p_partner_id)
      and m.user_id_2 = greatest(v_me, p_partner_id);

    if v_cur_status in ('blocked', 'matched') then
        null;
    elsif v_cur_status = 'pending' then
        if p_status = 'pending' then
            if v_cur_initiator is distinct from v_me then
                update public.movie_mate_matches
                set status = 'matched', updated_at = now()
                where user_id_1 = least(v_me, p_partner_id)
                  and user_id_2 = greatest(v_me, p_partner_id);
            end if;
        else
            update public.movie_mate_matches
            set status = 'passed', passed_by = v_me, passed_at = now(), updated_at = now()
            where user_id_1 = least(v_me, p_partner_id)
              and user_id_2 = greatest(v_me, p_partner_id);
        end if;
    elsif v_cur_status = 'passed' then
        if p_status = 'passed' then
            null;
        elsif v_cur_passed_by is distinct from v_me then
            raise exception 'Bu eşleşme talebi daha önce reddedildi.' using errcode = 'P0001';
        else
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
$function$
*/
-- ----------------------------------------------------------------------------

ALTER TABLE public.movie_mate_matches
    ADD COLUMN IF NOT EXISTS is_bilet boolean NOT NULL DEFAULT false;

-- Load-bearing grants (see header). Mirrors the existing per-column regime.
GRANT SELECT (is_bilet)     ON public.movie_mate_matches TO anon, authenticated, postgres, service_role;
GRANT INSERT (is_bilet)     ON public.movie_mate_matches TO anon, authenticated, postgres, service_role;
GRANT REFERENCES (is_bilet) ON public.movie_mate_matches TO anon, authenticated, postgres, service_role;
GRANT UPDATE (is_bilet)     ON public.movie_mate_matches TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.upsert_match_request(
    p_partner_id uuid,
    p_status text,
    p_compatibility_score integer DEFAULT NULL::integer,
    p_shared_genres text[] DEFAULT NULL::text[],
    p_shared_titles jsonb DEFAULT NULL::jsonb,
    p_is_bilet boolean DEFAULT false::boolean
)
 RETURNS TABLE(match_id uuid, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_me            uuid := auth.uid();
    v_cur_status    text;
    v_cur_initiator uuid;
    v_cur_passed_by uuid;
    v_inserted      boolean := false;
    v_today_likes   int;
    v_today_bilets  int;
    v_is_premium    boolean;
begin
    -- Serialize per-user so two concurrent requests cannot both slip past a
    -- daily cap between COUNT and INSERT (TOCTOU). Single-lock, no cycle risk;
    -- also fixes the identical latent race in the S8 25/day cap.
    perform pg_advisory_xact_lock(hashtextextended(v_me::text, 0));

    if v_me is null then
        raise exception 'Unauthorized' using errcode = '42501';
    end if;
    if v_me = p_partner_id then
        raise exception 'You cannot match with yourself';
    end if;
    if p_status not in ('pending', 'passed')
       or (p_is_bilet and p_status <> 'pending') then
        -- BİLET is a positive signal only; never attach it to a pass.
        raise exception 'Invalid match status';
    end if;
    if public.is_currently_banned() then
        raise exception 'Account suspended' using errcode = '42501';
    end if;

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

        if p_is_bilet then
            select p.is_premium into v_is_premium
            from public.profiles p
            where p.id = v_me;
            if v_is_premium is distinct from true then
                -- Count ALL of today's BİLET inserts regardless of current
                -- status: accept-chains must not refill the quota.
                select count(*) into v_today_bilets
                from public.movie_mate_matches
                where initiator_id = v_me
                  and is_bilet
                  and created_at >= date_trunc('day', now());
                if v_today_bilets >= 1 then
                    raise exception 'Günlük BİLET sınırına ulaştın (1). Kulüp üyeliği ile sınırsız.'
                      using errcode = 'P0001';
                end if;
            end if;
        end if;
    end if;

    begin
        insert into public.movie_mate_matches
            (user_id_1, user_id_2, compatibility_score, shared_genres, shared_titles,
             status, initiator_id, updated_at, is_bilet)
        values
            (least(v_me, p_partner_id), greatest(v_me, p_partner_id),
             coalesce(p_compatibility_score, 80),
             coalesce(p_shared_genres, '{}'),
             coalesce(p_shared_titles, '[]'::jsonb),
             p_status,
             case when p_status = 'pending' then v_me end,
             now(),
             p_is_bilet);
        v_inserted := true;
    exception when unique_violation then
        null;
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

    update public.movie_mate_matches m set
        compatibility_score = coalesce(p_compatibility_score, m.compatibility_score),
        shared_genres       = coalesce(p_shared_genres, m.shared_genres),
        shared_titles       = coalesce(p_shared_titles, m.shared_titles),
        updated_at          = now()
    where m.user_id_1 = least(v_me, p_partner_id)
      and m.user_id_2 = greatest(v_me, p_partner_id);

    if v_cur_status in ('blocked', 'matched') then
        null;
    elsif v_cur_status = 'pending' then
        if p_status = 'pending' then
            if v_cur_initiator is distinct from v_me then
                update public.movie_mate_matches
                set status = 'matched', updated_at = now()
                where user_id_1 = least(v_me, p_partner_id)
                  and user_id_2 = greatest(v_me, p_partner_id);
            end if;
        else
            update public.movie_mate_matches
            set status = 'passed', passed_by = v_me, passed_at = now(), updated_at = now()
            where user_id_1 = least(v_me, p_partner_id)
              and user_id_2 = greatest(v_me, p_partner_id);
        end if;
    elsif v_cur_status = 'passed' then
        if p_status = 'passed' then
            null;
        elsif v_cur_passed_by is distinct from v_me then
            raise exception 'Bu eşleşme talebi daha önce reddedildi.' using errcode = 'P0001';
        else
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
$function$
;

DROP FUNCTION IF EXISTS public.upsert_match_request(uuid, text, integer, text[], jsonb);

REVOKE EXECUTE ON FUNCTION public.upsert_match_request(uuid, text, integer, text[], jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_match_request(uuid, text, integer, text[], jsonb, boolean) TO postgres, authenticated, service_role;
