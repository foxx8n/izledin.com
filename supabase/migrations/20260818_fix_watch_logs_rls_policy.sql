-- ==============================================================================
-- SECURITY FIX: Correct watch_logs UPDATE RLS policy
-- The previous policy had "OR true" which allowed any authenticated user to
-- update ANY other user's watch logs. This migration corrects it.
-- ==============================================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can update their own watch logs" ON public.watch_logs;

-- Recreate with correct restriction: only own logs
CREATE POLICY "Users can update their own watch logs"
ON public.watch_logs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
