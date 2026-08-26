import { Profile } from '@/types';

/**
 * Client-side compatibility scoring for GUESTS and RPC-failure fallback only.
 * Mirrors the authoritative `calculate_cinephile_matches` Postgres spec so the
 * same pair sees the same score everywhere:
 *   baseline 32 + genre-Jaccard ×35 + streaming 15/5
 *   + intent 15 when equal OR either side 'both' else 5
 *   + title-overlap LEAST(10, round(30·shared / max(myTasteN,10)))  [S12],
 *   clamped to [50, 99]. Top-4 overlaps are surfaced as shared titles/reasons
 *   but intentionally carry no score (parity with the DB engine).
 *
 * The S12 taste term activates only when the caller supplies liked-title
 * vectors (title_swipes like/super ∪ watch_logs watched/watching ids). Without
 * them — the usual guest path — it contributes 0, exactly like empty tables do
 * in Postgres.
 */
export function calculateCinemaMatch(
  userA: Profile,
  userB: Profile,
  userAWatchlist?: string[], // list of media titles/ids userA wants to watch
  userBWatchlist?: string[], // list of media titles/ids userB wants to watch
  userALikedTitles?: string[], // S12 taste vector: media_ids userA liked/watched
  userBLikedTitles?: string[]  // S12 taste vector: media_ids userB liked/watched
): { score: number; reasons: string[]; sharedGenres: string[]; sharedTitles: Array<{ id: string; title: string; posterUrl: string; type: any }> } {
  const reasons: string[] = [];

  // 1. Genre Affinity — Jaccard intersection/union × 35 (matches DB)
  const genresA = new Set(userA.favoriteGenres || []);
  const genresB = new Set(userB.favoriteGenres || []);
  const sharedGenres = [...genresA].filter((g) => genresB.has(g));

  const unionSet = new Set([...(userA.favoriteGenres || []), ...(userB.favoriteGenres || [])]);
  let genreScore = 15; // DB convention: empty profiles still get a neutral 15
  if (unionSet.size > 0) {
    genreScore = Math.round((sharedGenres.length / unionSet.size) * 35);
  }
  if (sharedGenres.length > 0) {
    reasons.push(`Ortak türler: ${sharedGenres.slice(0, 3).join(', ')}`);
  }

  // 2. Streaming Overlap — 15 if any shared service, else 5 (matches DB)
  const servicesA = new Set(userA.streamingServices || []);
  const servicesB = new Set(userB.streamingServices || []);
  const hasStreamingOverlap = [...servicesA].some((s) => servicesB.has(s));
  const serviceScore = hasStreamingOverlap ? 15 : 5;

  // 3. Intent Alignment — 15 when equal OR either side open ('both'), else 5
  // (matches DB since the S1 hotfix; 'both' is admitted by the pool filter
  // and must not be scored as a mismatch)
  const intentA = userA.matchIntent || 'friend';
  const intentB = userB.matchIntent || 'friend';
  const intentsAligned =
    intentA === intentB || intentA === 'both' || intentB === 'both';
  const intentScore = intentsAligned ? 15 : 5;
  if (intentsAligned) {
    reasons.push('Ortak kulüp niyeti ve vizyon anlayışı');
  }

  // 3b. Taste-Vector Overlap [S12] — damped asymmetric overlap, max +10:
  // LEAST(10, round(30 · shared_n / GREATEST(caller_vector_n, 10))).
  // Asymmetric on purpose (caller side), damped against catalog hoarders.
  let titleScore = 0;
  const likedA = userALikedTitles || [];
  const likedB = userBLikedTitles || [];
  if (likedA.length > 0 && likedB.length > 0) {
    const setB = new Set(likedB);
    const sharedLiked = likedA.filter((id) => setB.has(id));
    if (sharedLiked.length > 0) {
      titleScore = Math.min(
        10,
        Math.round((30 * sharedLiked.length) / Math.max(likedA.length, 10)),
      );
      reasons.push(
        `Ortak beğeni: ${sharedLiked.length} ortak yapım`,
      );
    }
  }

  // 4. Top-4 Favorites Overlap — display-only (DB parity: no score)
  const top4A = userA.top4Favorites || [];
  const top4B = userB.top4Favorites || [];
  const sharedTitles: Array<{ id: string; title: string; posterUrl: string; type: any }> = [];

  for (const itemA of top4A) {
    const match = top4B.find(
      (itemB) =>
        itemB.id === itemA.id ||
        itemB.title.toLowerCase().trim() === itemA.title.toLowerCase().trim()
    );
    if (match) {
      sharedTitles.push(itemA);
      reasons.push(`Ortak Başyapıt: "${itemA.title}"`);
    }
  }

  // 5. Watch Synergy ("Both want to watch") — informational only
  if (userAWatchlist && userBWatchlist) {
    const setWatchA = new Set(userAWatchlist);
    const commonWatch = userBWatchlist.filter((t) => setWatchA.has(t));
    if (commonWatch.length > 0) {
      reasons.push(`Birlikte İzlenecekler: ${commonWatch[0]}`);
    }
  }

  // Normalize exactly like the DB engine: [50, 99]
  const total = 32 + genreScore + serviceScore + intentScore + titleScore;
  const finalScore = Math.min(99, Math.max(50, Math.round(total)));

  return {
    score: finalScore,
    reasons: reasons.length > 0 ? reasons : ['Yüksek 35mm frekans uyumu'],
    sharedGenres,
    sharedTitles,
  };
}
