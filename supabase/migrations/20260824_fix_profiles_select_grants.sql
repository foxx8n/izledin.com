-- Migration: Fix profiles column SELECT & UPDATE grants for authenticated & anon roles
GRANT SELECT (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  location,
  birth_date,
  favorite_genres,
  top_4_favorites,
  streaming_services,
  is_premium,
  match_enabled,
  match_intent,
  intent_last_changed_at,
  intent_integrity_score,
  intent_strikes_count,
  intent_agreed_at,
  total_watched_count,
  total_watch_hours,
  created_at,
  updated_at,
  is_verified
) ON public.profiles TO authenticated, anon;

GRANT UPDATE (
  username,
  full_name,
  avatar_url,
  bio,
  location,
  birth_date,
  favorite_genres,
  top_4_favorites,
  streaming_services,
  match_enabled,
  match_intent,
  intent_last_changed_at,
  intent_agreed_at,
  updated_at
) ON public.profiles TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
