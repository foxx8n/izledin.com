-- ==============================================================================
-- izledin.com — LIVE DATABASE SCHEMA SNAPSHOT
-- Snapshot date: 2026-08-22
--
-- ⚠️  THIS FILE IS DOCUMENTATION, NOT A RUNNABLE MIGRATION.
-- The live Supabase project is the source of truth:
--   Project ref: hipavaiaumdkpqqwvlzp  (Postgres 17)
-- Some historical migrations were applied directly via the dashboard / MCP and
-- never lived in this repo. Re-running old repo files against a fresh project
-- WILL produce a different (and insecure) schema — always re-apply from this
-- snapshot or `supabase db pull` instead.
--
-- Security posture summary (post-audit 2026-08-22):
--   * RLS enabled on every public table
--   * profiles.is_premium / is_verified / is_banned / ban_reason / banned_at
--     are NOT writable by clients (column grants + protection trigger);
--     admins go through the admin_set_user_flags RPC
--   * birth_date is not SELECTable by any role; only computed ages leave the DB
--   * messages INSERT requires match participation; FK to movie_mate_matches
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- User profiles (1:1 with auth.users)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    favorite_genres TEXT[] DEFAULT '{}',
    top_4_favorites JSONB DEFAULT '[]'::jsonb,
    streaming_services TEXT[] DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,          -- 🔒 privileged: RPC/trigger-guarded
    match_enabled BOOLEAN DEFAULT TRUE,
    total_watched_count INTEGER DEFAULT 0,
    total_watch_hours INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT TRUE,          -- 🔒 privileged
    birth_date DATE,                           -- 🔒 private: never SELECTable, ages only
    is_banned BOOLEAN DEFAULT FALSE,           -- 🔒 privileged
    ban_reason TEXT,                           -- 🔒 privileged
    banned_at TIMESTAMPTZ,                     -- 🔒 privileged
    match_intent TEXT DEFAULT 'friend',
    intent_integrity_score INTEGER DEFAULT 98,
    intent_strikes_count INTEGER DEFAULT 0,
    intent_agreed_at TIMESTAMPTZ
);

CREATE TABLE public.watch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'anime')),
    title TEXT NOT NULL,
    year INTEGER,
    poster_url TEXT,
    backdrop_url TEXT,
    genres TEXT[] DEFAULT '{}',
    rating NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10),
    review TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_rewatch BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'watched' CHECK (status IN ('watched','watching','plan_to_watch','dropped')),
    watched_date DATE DEFAULT CURRENT_DATE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.movie_mate_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    compatibility_score INTEGER DEFAULT 0 CHECK (compatibility_score BETWEEN 0 AND 100),
    shared_genres TEXT[] DEFAULT '{}',
    shared_titles JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','matched','passed','blocked')),
    initiator_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_pair UNIQUE (user_id_1, user_id_2),
    CONSTRAINT different_users CHECK (user_id_1 <> user_id_2)
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.movie_mate_matches(id) ON DELETE CASCADE, -- FK added 2026-08-22
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.watch_together_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.movie_mate_matches(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie','tv','anime')),
    title TEXT NOT NULL,
    poster_url TEXT,
    added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','watching','watched_together')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.custom_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    likes_count INTEGER DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.watch_log_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_id UUID NOT NULL REFERENCES public.watch_logs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_log_like UNIQUE (user_id, log_id)
);

CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (performance-critical ones)
-- ─────────────────────────────────────────────────────────────────────────────
-- idx_watch_logs_user_id (user_id), idx_watch_logs_media_id, idx_watch_logs_status,
-- idx_watch_logs_rating, idx_matches_users (user_id_1,user_id_2),
-- idx_messages_match_id, idx_matches_pair_status (user_id_1,user_id_2,status),
-- idx_profiles_match_enabled partial WHERE match_enabled,
-- GIN: profiles.favorite_genres, streaming_services, top_4_favorites,
-- idx_watch_logs_user_high_rating partial WHERE rating >= 7.0

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS & SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
-- handle_new_user()                 SECURITY DEFINER (trigger on auth.users insert)
--                                   → auto-creates profile row. EXECUTE: postgres, service_role only.
-- protect_profile_privileged_fields() SECURITY DEFINER BEFORE UPDATE trigger on profiles.
--                                   Blocks client writes to is_premium/is_banned/is_verified
--                                   unless service_role or admin. (Fixed 2026-08-22 — the old
--                                   current_user guard was dead code inside its own definer.)
-- sync_subscription_status(uuid,boolean) SECURITY DEFINER. Webhook-only premium sync.
--                                   EXECUTE revoked from PUBLIC/anon/authenticated —
--                                   callable by postgres/service_role ONLY.
-- admin_set_user_flags(uuid,[premium],[verified],[banned],[reason]) SECURITY DEFINER.
--                                   Admin panel RPC; raises unless is_admin(). EXECUTE: authenticated.
-- is_admin()                        SECURITY DEFINER. Admin check by immutable UUID +
--                                   trusted JWT email claim + auth.users lookup.
--                                   NEVER reads user_metadata (client-editable).
--                                   EXECUTE: authenticated, service_role (needed by RLS policies).
-- calculate_cinephile_matches(uuid,text,int) SECURITY INVOKER. Returns computed AGE,
--                                   never birth_date. Ownership-checked for authenticated callers.
-- get_my_birth_date()               SECURITY DEFINER. Owner-only birthday readback.
-- get_user_age(uuid), get_user_ages(uuid[]) SECURITY DEFINER. Public computed-age lookups.
-- rls_auto_enable()                 SECURITY DEFINER (infra helper).

-- Column grants on profiles (2026-08-22):
--   UPDATE granted to authenticated ONLY on: username, full_name, avatar_url, bio,
--     location, birth_date, favorite_genres, top_4_favorites, streaming_services,
--     match_enabled, match_intent, intent_integrity_score, intent_strikes_count,
--     intent_agreed_at, total_watched_count, total_watch_hours, updated_at
--   SELECT granted to anon+authenticated on everything EXCEPT birth_date.

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES (live state)
-- ─────────────────────────────────────────────────────────────────────────────
-- profiles:
--   SELECT  USING (true)                                    -- public read (minus birth_date)
--   INSERT  WITH CHECK (auth.uid() = id)
--   UPDATE  USING/WITH CHECK (auth.uid() = id OR is_admin())
-- watch_logs:
--   SELECT  USING (true)                                    -- community feed
--   INSERT  TO authenticated WITH CHECK (own AND not banned)
--   UPDATE  USING/WITH CHECK (auth.uid() = user_id)         -- fixed 2026-08-18 (was "OR true")
--   DELETE  TO authenticated USING (own OR is_admin())
-- movie_mate_matches:
--   SELECT  USING (participant)
--   INSERT  WITH CHECK (auth.uid() IN (user_id_1, user_id_2))
--   UPDATE  USING/WITH CHECK (participant)                  -- WITH CHECK added 2026-08-22
-- messages:
--   SELECT  TO public USING (match participant)
--   INSERT  TO authenticated WITH CHECK (sender = self AND not banned AND match participant)
-- watch_together_items: all four ops require match participation
-- custom_lists:
--   SELECT  USING (is_public OR owner)
--   INSERT  WITH CHECK (owner); UPDATE USING/WITH CHECK (owner); DELETE USING (owner)
-- watch_log_likes:
--   SELECT public; INSERT own; DELETE own-or-admin
-- site_settings:
--   SELECT public (broadcast banners); INSERT/UPDATE admin only

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE (buckets)
-- ─────────────────────────────────────────────────────────────────────────────
-- avatars:      public read; INSERT/UPDATE own-folder only (<uid>/…); 2 MB file cap
-- diary-media:  public read; NO write policies yet (writes intentionally locked)

-- ─────────────────────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movie_mate_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_logs;
