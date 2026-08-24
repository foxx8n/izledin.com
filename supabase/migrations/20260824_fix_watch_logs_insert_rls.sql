-- ==============================================================================
-- Migration: Fix watch_logs INSERT RLS policy with Security Definer Predicate
-- Solves 42501 permission error caused by unprivileged subquery on profiles.is_banned
-- ==============================================================================

DROP POLICY IF EXISTS "Users can insert their own watch logs" ON public.watch_logs;

CREATE POLICY "Users can insert their own watch logs"
ON public.watch_logs
FOR INSERT
TO authenticated
WITH CHECK (
    ((SELECT auth.uid()) = user_id) AND (NOT public.is_currently_banned())
);
