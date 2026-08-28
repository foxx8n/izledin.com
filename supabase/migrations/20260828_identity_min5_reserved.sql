-- ==============================================================================
-- ONE-TIME IDENTITY CHANGE — HARDENING PASS (user feedback 2026-08-28)
-- Applied to production via MCP apply_migration on 2026-08-28.
--
--   * Minimum handle length 3 → 5. Applies to NEW handles only: members whose
--     system-generated handle is shorter may still change their name while
--     keeping it (chk_username_format stays at 3 — the RPC is the only gate).
--   * Reserved-handle list expanded (impersonation & system/brand names).
--   * Return row carries in-memory values (statement-snapshot safe re-read).
-- ==============================================================================

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

  IF out_identity_changed_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDENTITY_CHANGE_USED';
  END IF;

  v_clean_name := btrim(COALESCE(p_full_name, ''));
  IF char_length(v_clean_name) < 2 OR char_length(v_clean_name) > 40 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NAME_INVALID';
  END IF;

  v_clean_handle := LOWER(btrim(COALESCE(p_username, '')));

  -- Keeping your current handle is always allowed (short handles predate this
  -- rule); NEW handles must be 5..24.
  IF v_clean_handle <> v_cur_handle AND v_clean_handle !~ '^[a-z0-9_]{5,24}$' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'USERNAME_INVALID';
  END IF;

  -- Reserved / impersonation-proof handles — only when the handle changes.
  IF v_clean_handle <> v_cur_handle AND v_clean_handle IN (
    'admin', 'administrator', 'izledin', 'izledincom', 'izledin_com',
    'mod', 'moderator', 'moderatorluk',
    'support', 'destek', 'yardim',
    'root', 'system', 'sistem', 'yonetici', 'kurucu',
    'official', 'resmi', 'ekip'
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
