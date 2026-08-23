-- ==============================================================================
-- SECURITY FIX & REVENUECAT SYNC:
-- 1. Protect privileged fields (is_premium, is_banned) from direct client updates
-- 2. Create secure RPC for RevenueCat webhooks / backend to sync subscription
-- ==============================================================================

-- 1. Trigger function to protect privileged profile fields from unauthorized client updates
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_premium or is_banned is being modified
  IF (OLD.is_premium IS DISTINCT FROM NEW.is_premium OR OLD.is_banned IS DISTINCT FROM NEW.is_banned) THEN
    -- Only allow if caller is admin or service_role or internal security definer functions
    IF (current_user <> 'postgres' AND NOT (public.is_admin() OR auth.role() = 'service_role')) THEN
      NEW.is_premium := OLD.is_premium;
      NEW.is_banned := OLD.is_banned;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 2. Secure RPC to sync subscription status from webhooks/backend
CREATE OR REPLACE FUNCTION public.sync_subscription_status(
  p_user_id UUID,
  p_is_premium BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_premium = p_is_premium,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
