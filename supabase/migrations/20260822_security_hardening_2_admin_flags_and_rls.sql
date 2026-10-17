-- ==============================================================================
-- SECURITY HARDENING ROUND 2 (audit 2026-08-22)
-- Applied to production via MCP apply_migration on 2026-08-22.
--
-- C1: privileged profile columns locked (working trigger + column grants + admin RPC)
-- H1: is_admin() no longer trusts user-editable user_metadata claims
-- M1: messages INSERT requires match participation + FK to movie_mate_matches
-- M2/M3: WITH CHECK added to movie_mate_matches / custom_lists UPDATE policies
-- ==============================================================================

-- ── C1a: make the privileged-fields trigger actually evaluate caller context ──
-- NOTE: inside a SECURITY DEFINER function current_user is ALWAYS the owner
-- ('postgres'), so the old `current_user <> 'postgres'` guard never fired.
-- Authorization must come from JWT claims (auth.uid()/auth.role()) instead.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.is_premium IS DISTINCT FROM NEW.is_premium
    OR OLD.is_banned IS DISTINCT FROM NEW.is_banned
    OR OLD.is_verified IS DISTINCT FROM NEW.is_verified
  ) THEN
    -- Allowed only when:
    --  * auth.uid() IS NULL        -> server-side context (migrations, service jobs)
    --  * auth.role() service_role  -> backend using the service key (webhooks)
    --  * public.is_admin()         -> signed-in platform admin
    IF NOT (auth.uid() IS NULL OR auth.role() = 'service_role' OR public.is_admin()) THEN
      NEW.is_premium := OLD.is_premium;
      NEW.is_banned := OLD.is_banned;
      NEW.is_verified := OLD.is_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── C1b: column-level grants — clients can never even attempt flag writes ──
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  username, full_name, avatar_url, bio, location, birth_date,
  favorite_genres, top_4_favorites, streaming_services,
  match_enabled, match_intent,
  intent_integrity_score, intent_strikes_count, intent_agreed_at,
  total_watched_count, total_watch_hours, updated_at
) ON public.profiles TO authenticated;

-- ── C1c: audited RPC for admins (admin panel now calls this) ──
CREATE OR REPLACE FUNCTION public.admin_set_user_flags(
  p_user_id UUID,
  p_is_premium BOOLEAN DEFAULT NULL,
  p_is_verified BOOLEAN DEFAULT NULL,
  p_is_banned BOOLEAN DEFAULT NULL,
  p_ban_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin privileges required';
  END IF;

  UPDATE public.profiles SET
    is_premium  = COALESCE(p_is_premium, is_premium),
    is_verified = COALESCE(p_is_verified, is_verified),
    is_banned   = COALESCE(p_is_banned, is_banned),
    ban_reason  = CASE WHEN p_is_banned = false THEN NULL
                       ELSE COALESCE(p_ban_reason, ban_reason) END,
    banned_at   = CASE WHEN p_is_banned = true THEN NOW()
                       WHEN p_is_banned = false THEN NULL
                       ELSE banned_at END,
    updated_at  = NOW()
  WHERE id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_flags(UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_flags(UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- ── H1: is_admin() — drop the user-editable user_metadata.email branch ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  curr_uid uuid;
  user_email text;
BEGIN
  curr_uid := auth.uid();
  IF curr_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Primary admin by immutable UUID (configure with your admin user UUID)
  -- IF curr_uid = '00000000-0000-0000-0000-000000000000'::uuid THEN
  --   RETURN true;
  -- END IF;

  -- Trusted JWT email claim (set by GoTrue from the verified account email).
  -- raw_user_meta_data is client-writable and must NEVER be used here.
  IF LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'admin@izledin.com'
     OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- Server-side lookup of the account email (SECURITY DEFINER grants access)
  SELECT LOWER(email) INTO user_email FROM auth.users WHERE id = curr_uid;
  IF user_email = 'admin@izledin.com' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ── M1: messages — participation check on INSERT + real foreign key ──
ALTER TABLE public.messages
  ADD CONSTRAINT messages_match_id_fkey
  FOREIGN KEY (match_id) REFERENCES public.movie_mate_matches(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_banned = true
  )
  AND EXISTS (
    SELECT 1 FROM public.movie_mate_matches m
    WHERE m.id = messages.match_id
      AND (m.user_id_1 = auth.uid() OR m.user_id_2 = auth.uid())
  )
);

-- ── M2: match rows cannot be reassigned or tampered beyond participant edits ──
DROP POLICY IF EXISTS "Users can update their match status" ON public.movie_mate_matches;
CREATE POLICY "Users can update their match status"
ON public.movie_mate_matches FOR UPDATE
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ── M3: list ownership cannot be reassigned via UPDATE ──
DROP POLICY IF EXISTS "Users can update their own lists" ON public.custom_lists;
CREATE POLICY "Users can update their own lists"
ON public.custom_lists FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
