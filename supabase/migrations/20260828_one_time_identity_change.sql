-- ==============================================================================
-- ONE-TIME IDENTITY CHANGE (ad & rumuz değiştirme hakkı)
-- Applied to production via MCP apply_migration on 2026-08-28.
--
-- Every profile is provisioned with a system-generated full_name + username
-- (Google metadata / email fallback in AuthContext). Users get exactly ONE
-- chance to change both — either during onboarding (TasteProfilerModal step 1)
-- or later from the profile page. The allowance is shared and permanent:
--
--   * profiles.identity_changed_at timestamptz — NULL = allowance available.
--   * username/full_name leave authenticated's column UPDATE grants — the only
--     client write path is update_my_identity() (SECURITY DEFINER), which
--     enforces validation, reserved handles, case-insensitive uniqueness and
--     the one-time rule. Same lockdown pattern as C1 (2026-08-22).
--   * A no-op save (both values identical to current) returns the row WITHOUT
--     stamping the allowance — visiting the editor must never burn the right.
-- ==============================================================================

-- ── 1. Allowance stamp (NULL = still available) ──────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_changed_at timestamptz;

-- Readable (a bare timestamp — nothing sensitive), never directly writable.
GRANT SELECT (identity_changed_at) ON public.profiles TO anon, authenticated, postgres, service_role;

-- ── 2. Column grants — username/full_name leave the client UPDATE surface ────
-- Re-grants the full effective list (union of 20260822 + 20260824_fix +
-- intent-cooldown + radar_visible + digest opt-in) minus username/full_name.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  avatar_url, bio, location, birth_date,
  favorite_genres, top_4_favorites, streaming_services,
  match_enabled, match_intent, radar_visible,
  digest_opt_in, last_digest_sent_at,
  intent_last_changed_at, intent_integrity_score, intent_strikes_count,
  intent_agreed_at,
  total_watched_count, total_watch_hours, updated_at
) ON public.profiles TO authenticated;

-- ── 3. The one identity-change RPC ───────────────────────────────────────────
-- Error messages are machine codes; the client maps them to Turkish copy.
CREATE OR REPLACE FUNCTION public.update_my_identity(
  p_full_name TEXT,
  p_username TEXT
)
RETURNS TABLE (
  out_username TEXT,
  out_full_name TEXT,
  out_identity_changed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID := auth.uid();
  v_cur_name     TEXT;
  v_cur_handle   TEXT;
  v_clean_name   TEXT;
  v_clean_handle TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  SELECT p.full_name, p.username, p.identity_changed_at
  INTO v_cur_name, v_cur_handle, out_identity_changed_at
  FROM public.profiles p
  WHERE p.id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PROFILE_NOT_FOUND';
  END IF;

  -- The single, permanent allowance.
  IF out_identity_changed_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDENTITY_CHANGE_USED';
  END IF;

  -- full_name: trimmed, 2..40 visible characters.
  v_clean_name := btrim(COALESCE(p_full_name, ''));
  IF char_length(v_clean_name) < 2 OR char_length(v_clean_name) > 40 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NAME_INVALID';
  END IF;

  -- username: same rule as chk_username_format (^[a-z0-9_]{3,24}$).
  v_clean_handle := LOWER(btrim(COALESCE(p_username, '')));
  IF v_clean_handle !~ '^[a-z0-9_]{3,24}$' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USERNAME_INVALID';
  END IF;

  -- Squat-proof handles — but only when the handle actually changes, so a
  -- user who already holds a reserved handle can still rename their name.
  IF v_clean_handle <> v_cur_handle AND v_clean_handle IN (
    'admin', 'administrator', 'izledin', 'mod', 'moderator', 'support',
    'root', 'system', 'sistem', 'destek'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USERNAME_RESERVED';
  END IF;

  -- No-op: preserve the allowance, return current values untouched.
  IF v_clean_name = v_cur_name AND v_clean_handle = v_cur_handle THEN
    RETURN QUERY
    SELECT p.username, p.full_name, p.identity_changed_at
    FROM public.profiles p
    WHERE p.id = v_uid;
    RETURN;
  END IF;

  -- Uniqueness (case-insensitive; DB's lower(username) unique index is the
  -- final arbiter — this check exists to raise a friendly message).
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = v_clean_handle AND id <> v_uid
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USERNAME_TAKEN';
  END IF;

  UPDATE public.profiles
  SET full_name           = v_clean_name,
      username            = v_clean_handle,
      identity_changed_at = NOW(),
      updated_at          = NOW()
  WHERE id = v_uid;

  -- Return the in-memory values: a re-read via RETURN QUERY would use the
  -- statement's snapshot and show the pre-update stamp (NULL) to the caller.
  -- NOW() here equals the stamped value — same transaction timestamp.
  RETURN QUERY
  SELECT v_clean_handle, v_clean_name, NOW()::timestamptz;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_identity(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_identity(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
