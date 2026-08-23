import { createClient } from '@/lib/supabase/client';
import { MovieMateMatch, Profile } from '@/types';
import { calculateCinemaMatch } from '@/lib/matching-algorithm';
import { mapDbProfileToProfile, listDiscoverProfiles, PROFILE_SELECT_COLUMNS } from './profile.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetches all confirmed/pending matches for a user with 1 single batch query (0 N+1 overhead).
 */
export async function getUserMatches(currentUserId: string): Promise<MovieMateMatch[]> {
  if (!currentUserId || !UUID_REGEX.test(currentUserId)) {
    return [];
  }

  const supabase = createClient();
  
  const { data: matchRows, error } = await supabase
    .from('movie_mate_matches')
    .select('*')
    .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
    .order('updated_at', { ascending: false });

  if (error || !matchRows || matchRows.length === 0) {
    if (error) console.warn('Error fetching user matches:', error);
    return [];
  }

  // Collect unique partner IDs to batch-fetch in 1 single query
  const partnerIds = matchRows.map((row: any) => 
    row.user_id_1 === currentUserId ? row.user_id_2 : row.user_id_1
  );

  const { data: partnerProfiles, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .in('id', partnerIds);

  if (profileError || !partnerProfiles) {
    return [];
  }

  const profileMap = new Map<string, Profile>();
  partnerProfiles.forEach((p: any) => {
    profileMap.set(p.id, mapDbProfileToProfile(p));
  });

  const results: MovieMateMatch[] = [];

  for (const row of matchRows) {
    const isUser1 = row.user_id_1 === currentUserId;
    const partnerId = isUser1 ? row.user_id_2 : row.user_id_1;
    const partner = profileMap.get(partnerId);

    if (!partner) continue;

    results.push({
      id: row.id,
      user: partner,
      compatibilityScore:
        typeof row.compatibility_score === 'number'
          ? row.compatibility_score
          : 80,
      intent: partner.matchIntent || 'friend',
      sharedGenres: row.shared_genres || [],
      sharedTitles: row.shared_titles || [],
      matchReasons: (row.shared_genres || []).length > 0
        ? [`Ortak türler: ${(row.shared_genres as string[]).slice(0, 3).join(', ')}`]
        : [],
      status: row.status || 'pending',
      initiatorId: row.initiator_id || undefined,
    });
  }

  return results;
}

/**
 * High-Scale Cinephile Discovery & Vector Matching Engine.
 * Uses PostgreSQL RPC (calculate_cinephile_matches) for sub-5ms multi-vector scoring.
 * Falls back gracefully to local calculations for demo/offline users.
 */
export async function computeDiscoverMatches(
  currentUser: Profile, 
  intentFilter: string = 'all',
  limit: number = 50
): Promise<MovieMateMatch[]> {
  const supabase = createClient();
  const isValidUuid = currentUser.id && UUID_REGEX.test(currentUser.id);

  // 1. Try PostgreSQL RPC Stored Procedure (Sub-5ms Execution in Database for registered users)
  if (isValidUuid) {
    try {
      const { data: rpcMatches, error } = await supabase.rpc('calculate_cinephile_matches', {
        p_user_id: currentUser.id,
        p_intent_filter: intentFilter,
        p_limit: limit,
      });

      if (!error && Array.isArray(rpcMatches)) {
        // An empty result is AUTHORITATIVE (new account / everyone passed):
        // falling through to the local engine would resurface filtered users.
        return rpcMatches.map((row: any): MovieMateMatch => ({
        id: row.match_id,
        user: {
          id: row.partner_id,
          username: row.username || 'sinefil',
          fullName: row.full_name || 'Sinefil Üye',
          avatarUrl: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.username || 'S')}&backgroundColor=0A0A0A&textColor=DC2626&fontWeight=900`,
          bio: row.bio || undefined,
          location: row.location || undefined,
          age: row.age,
          favoriteGenres: row.favorite_genres || [],
          top4Favorites: row.top_4_favorites || [],
          streamingServices: row.streaming_services || [],
          isPremium: !!row.is_premium,
          matchIntent: row.match_intent || 'friend',
          intentIntegrityScore: typeof row.intent_integrity_score === 'number' ? row.intent_integrity_score : 98,
          intentStrikesCount: row.intent_strikes_count ?? 0,
        },
        compatibilityScore:
          typeof row.compatibility_score === 'number'
            ? row.compatibility_score
            : 85,
        intent: row.match_intent || 'friend',
        sharedGenres: row.shared_genres || [],
        sharedTitles: row.shared_titles || [],
        matchReasons: row.match_reasons || ['Yüksek 35mm frekans uyumu'],
        status: row.status || 'pending',
        initiatorId: row.initiator_id || undefined,
      }));
    }
    } catch (err) {
      console.warn('RPC matching unavailable, falling back to in-memory matching:', err);
    }
  }

  // 2. Fallback: In-Memory Multi-Vector Matching (For Guests / Seed Data)
  const otherProfiles = await listDiscoverProfiles(currentUser.id, limit);
  const existingMatches = await getUserMatches(currentUser.id);
  const matchMap = new Map<string, MovieMateMatch>();
  existingMatches.forEach((m) => matchMap.set(m.user.id, m));

  const results: MovieMateMatch[] = [];

  for (const other of otherProfiles) {
    if (other.id === currentUser.id) continue;

    // Filter intent if specified — 'both' members are open to every intent
    if (
      intentFilter !== 'all' &&
      other.matchIntent !== intentFilter &&
      other.matchIntent !== 'both'
    )
      continue;

    const existing = matchMap.get(other.id);
    if (existing) {
      // Any existing interaction (pending, matched, passed, blocked) is excluded from radar
      continue;
    }

    // Calculate real compatibility score
    const { score, reasons, sharedGenres, sharedTitles } = calculateCinemaMatch(currentUser, other);

    results.push({
      id: `prospective_${other.id}`,
      user: other,
      compatibilityScore: score,
      intent: other.matchIntent || 'friend',
      sharedGenres,
      sharedTitles,
      matchReasons: reasons,
      status: 'pending',
    });
  }

  // Sort by highest compatibility score first
  return results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

export interface MatchRequestResult {
  ok: boolean;
  /**
   * True when upsert_match_request v2 sticky-rejected the request: the pair
   * is 'passed' because the OTHER person passed earlier, and only the passer
   * can revive it. Callers show calm Turkish feedback instead of a raw error.
   */
  rejected?: boolean;
  matchId?: string | null;
}

async function upsertMatchRequest(
  targetUserId: string,
  requestedStatus: 'pending' | 'passed',
  score?: number,
  sharedGenres?: string[],
  sharedTitles?: any[]
): Promise<MatchRequestResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('upsert_match_request', {
    p_partner_id: targetUserId,
    p_status: requestedStatus,
    p_compatibility_score: score ?? null,
    p_shared_genres: sharedGenres ?? null,
    p_shared_titles: sharedTitles ?? null,
  });

  if (error) {
    // Sticky rejection arrives as P0001 with a Turkish exception message —
    // classify it so the UI can react without parsing console output.
    const rejected =
      error.code === 'P0001' &&
      typeof error.message === 'string' &&
      error.message.includes('reddedildi');
    if (!rejected) {
      console.error('Error creating/updating match:', error.message);
    }
    return { ok: false, rejected };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, matchId: row?.match_id || null };
}

/**
 * Like path for surfaces that must distinguish a sticky rejection from a
 * generic failure (radar deck likes, first-intro conversion in ChatModal).
 * The caller's own user id is implied by the JWT — kept in the signature for
 * symmetry with createOrUpdateMatch.
 */
export async function requestMatch(
  currentUserId: string,
  targetUserId: string,
  requestedStatus: 'pending' | 'passed',
  score?: number,
  sharedGenres?: string[],
  sharedTitles?: any[]
): Promise<MatchRequestResult> {
  void currentUserId;
  return upsertMatchRequest(
    targetUserId,
    requestedStatus,
    score,
    sharedGenres,
    sharedTitles
  );
}

/**
 * Creates or transitions the caller's pair row with `targetUserId` through the
 * `upsert_match_request` RPC, which enforces the state machine atomically:
 *   - blocked/matched pairs are never downgraded (conversations survive passes)
 *   - mutual pending likes auto-transition to 'matched'
 *   - initiator_id is preserved on updates (no more inverted requests)
 *   - re-liking someone who passed earlier is sticky-rejected (returns null)
 * Returns the pair row id, or null on failure/rejection.
 */
export async function createOrUpdateMatch(
  currentUserId: string,
  targetUserId: string,
  requestedStatus: 'pending' | 'passed',
  score?: number,
  sharedGenres?: string[],
  sharedTitles?: any[]
): Promise<string | null> {
  const result = await upsertMatchRequest(
    targetUserId,
    requestedStatus,
    score,
    sharedGenres,
    sharedTitles
  );
  return result.ok ? result.matchId ?? null : null;
}
