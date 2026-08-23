-- Migration: Add intent & integrity columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS match_intent TEXT DEFAULT 'friend',
  ADD COLUMN IF NOT EXISTS intent_integrity_score INTEGER DEFAULT 98,
  ADD COLUMN IF NOT EXISTS intent_strikes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intent_agreed_at TIMESTAMPTZ;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
