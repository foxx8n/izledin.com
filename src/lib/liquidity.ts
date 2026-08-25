import { createClient } from "@/lib/supabase/client";

/**
 * Liquidity governor (MATCHING-PIVOT-PLAN.md §1 / §S5).
 * Decides what dominates the PERDE deck based on REAL network activity —
 * never fabricated, never cosplaying scale:
 *   - >=25 actives/7d  -> people-dominant deck (the crown event)
 *   - <25 actives/7d   -> title-first deck + capped people teasers/day
 *
 * MVP activity proxy: profiles.match_enabled AND updated_at within 7 days.
 * Honest limitation: updated_at moves on any profile edit, not just visits.
 * S13's last_active_at + touch_last_active() RPC upgrades this metric
 * without changing this module's contract.
 */
export type DeckMode = "people_dominant" | "title_first";

export interface LiquidityDecision {
  mode: DeckMode;
  activeCount7d: number;
  /** Max people-teaser cards shown per day while in title_first mode. */
  dailyTeaserQuota: number;
}

const PEOPLE_DOMINANT_THRESHOLD = 25;

export function decideMode(activeCount7d: number): DeckMode {
  return activeCount7d >= PEOPLE_DOMINANT_THRESHOLD
    ? "people_dominant"
    : "title_first";
}

export async function getLiquidityDecision(): Promise<LiquidityDecision> {
  const supabase = createClient();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("match_enabled", true)
    .gte("updated_at", since);

  const activeCount7d = count ?? 0;
  return {
    mode: decideMode(activeCount7d),
    activeCount7d,
    dailyTeaserQuota: Math.min(2, activeCount7d),
  };
}
