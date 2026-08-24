-- ==============================================================================
-- Migration: Fix messages RLS infinite recursion & Radar Candidate Exclusion
-- ==============================================================================

-- 1. Helper function for messages INSERT to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.can_insert_message(p_match_id UUID, p_sender_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status TEXT;
    v_u1 UUID;
    v_u2 UUID;
    v_initiator UUID;
    v_msg_count INT;
BEGIN
    -- Ensure sender matches current authenticated user
    IF auth.uid() IS NULL OR auth.uid() <> p_sender_id THEN
        RETURN FALSE;
    END IF;

    -- Ensure sender is not banned
    IF public.is_currently_banned() THEN
        RETURN FALSE;
    END IF;

    -- Look up match record
    SELECT status, user_id_1, user_id_2, initiator_id
    INTO v_status, v_u1, v_u2, v_initiator
    FROM public.movie_mate_matches
    WHERE id = p_match_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Ensure user is a participant
    IF p_sender_id NOT IN (v_u1, v_u2) THEN
        RETURN FALSE;
    END IF;

    -- If already matched, any participant can send messages
    IF v_status = 'matched' THEN
        RETURN TRUE;
    END IF;

    -- If pending, only initiator can send the initial intro message
    IF v_status = 'pending' AND v_initiator = p_sender_id THEN
        SELECT COUNT(*) INTO v_msg_count FROM public.messages WHERE match_id = p_match_id;
        RETURN v_msg_count = 0;
    END IF;

    RETURN FALSE;
END;
$$;

DROP POLICY IF EXISTS "Messaging rules by match status" ON public.messages;
CREATE POLICY "Messaging rules by match status"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (public.can_insert_message(match_id, sender_id));
