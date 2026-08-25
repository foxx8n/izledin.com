import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMIT_PROFILES } from "@/lib/rate-limiter";

/**
 * S9: authenticated bridge to get_title_taste_stats (§A2 — the MATCH_SWIPE
 * limiter only guards server-side stores, so client RPC callers need this
 * wrapper). Returns aggregate like-counts with the K-anonymity floor applied
 * inside Postgres: <5 likes arrive as low_confidence=true / count 0 and must
 * render as "birkaç izdaş", never a numeral.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(
    `swipestats:${user.id}`,
    RATE_LIMIT_PROFILES.MATCH_SWIPE,
  );
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const mediaIds = Array.isArray(body?.mediaIds)
    ? body.mediaIds.filter((x: unknown) => typeof x === "string").slice(0, 50)
    : null;
  if (!mediaIds || mediaIds.length === 0) {
    return NextResponse.json({ error: "mediaIds required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("get_title_taste_stats", {
    p_media_ids: mediaIds,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ stats: data ?? [] });
}
