"use client";

import { useEffect } from "react";
import { trackEvent, TELEMETRY_EVENTS } from "@/lib/telemetry";

/**
 * Fires profile_view once per mount. Mounted on /u/[username] so deck cards
 * can later link out and deck→profile-view conversion becomes measurable
 * (plan §S2). Renders nothing.
 */
export function ProfileViewTracker({ username }: { username: string }) {
  useEffect(() => {
    trackEvent(TELEMETRY_EVENTS.PROFILE_VIEW, { username });
  }, [username]);
  return null;
}
