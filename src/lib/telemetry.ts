import { track as vaTrack } from "@vercel/analytics";

/**
 * Product analytics wrapper around Vercel Analytics.
 *
 * Ground rules (MATCHING-PIVOT-PLAN.md §S2):
 *  - Events must never break product code — every failure is swallowed.
 *  - No PII: pass usernames/user-ids only where the event is meaningless
 *    without them; never emails, full names, or birth data.
 *  - Dev mode logs to console instead of shipping events, so local
 *    sessions don't pollute production dashboards.
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean | null | undefined>,
): void {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[telemetry] ${name}`, props ?? {});
      return;
    }
    vaTrack(name, props);
  } catch {
    // Analytics is observability, not a feature — silence is correct here.
  }
}

/** Canonical event names — keep exhaustiveness checks honest. */
export const TELEMETRY_EVENTS = {
  RADAR_EXHAUSTED: "radar_exhausted",
  PROFILE_VIEW: "profile_view",
} as const;
