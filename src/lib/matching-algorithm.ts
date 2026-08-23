import { Profile } from '@/types';

/**
 * Client-side compatibility scoring for GUESTS and RPC-failure fallback only.
 * Mirrors the authoritative `calculate_cinephile_matches` Postgres spec so the
 * same pair sees the same score everywhere:
 *   baseline 32 + genre-Jaccard ×35 + streaming 15/5 + intent 15/5,
 *   clamped to [50, 99]. Top-4 overlaps are surfaced as shared titles/reasons
 *   but intentionally carry no score (parity with the DB engine).
 */
export function calculateCinemaMatch(
  userA: Profile,
  userB: Profile,
  userAWatchlist?: string[], // list of media titles/ids userA wants to watch
  userBWatchlist?: string[]  // list of media titles/ids userB wants to watch
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

  // 3. Intent Alignment — exact 15 / different 5 (matches DB)
  const intentA = userA.matchIntent || 'friend';
  const intentB = userB.matchIntent || 'friend';
  const intentScore = intentA === intentB ? 15 : 5;
  if (intentA === intentB) {
    reasons.push('Ortak kulüp niyeti ve vizyon anlayışı');
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
  const total = 32 + genreScore + serviceScore + intentScore;
  const finalScore = Math.min(99, Math.max(50, Math.round(total)));

  return {
    score: finalScore,
    reasons: reasons.length > 0 ? reasons : ['Yüksek 35mm frekans uyumu'],
    sharedGenres,
    sharedTitles,
  };
}
