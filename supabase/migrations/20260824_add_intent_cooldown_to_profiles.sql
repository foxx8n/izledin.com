-- Migration: Add intent_last_changed_at and 24-hour cooldown trigger to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS intent_last_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Update column grants for authenticated users
GRANT UPDATE (
  username, full_name, avatar_url, bio, location, birth_date,
  favorite_genres, top_4_favorites, streaming_services,
  match_enabled, match_intent, intent_last_changed_at,
  intent_integrity_score, intent_strikes_count, intent_agreed_at,
  total_watched_count, total_watch_hours, updated_at
) ON public.profiles TO authenticated;

-- Function & Trigger to enforce 24-hour cooldown on match_intent changes
CREATE OR REPLACE FUNCTION public.enforce_intent_cooldown()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.match_intent IS DISTINCT FROM OLD.match_intent AND OLD.match_intent IS NOT NULL THEN
    IF OLD.intent_last_changed_at IS NOT NULL AND OLD.intent_last_changed_at > NOW() - INTERVAL '24 hours' THEN
      IF NOT (auth.uid() IS NULL OR auth.role() = 'service_role' OR public.is_admin()) THEN
        RAISE EXCEPTION 'İzdaş niyetinizi 24 saatte yalnızca bir kez değiştirebilirsiniz.';
      END IF;
    END IF;
    NEW.intent_last_changed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_intent_cooldown ON public.profiles;
CREATE TRIGGER trg_enforce_intent_cooldown
BEFORE UPDATE OF match_intent ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_intent_cooldown();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
