import { createClient } from '@/lib/supabase/client';
import { WatchLog, Profile, MediaItem } from '@/types';
import { mapDbProfileToProfile, PROFILE_SELECT_COLUMNS } from './profile.service';
import { getOMDBDetails, getMasterpieceOfTheWeek } from '@/lib/omdb';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '@/lib/rate-limiter';
import { localTodayISO } from '@/lib/date';

export function mapDbLogToWatchLog(row: any): WatchLog {
  const user: Profile | undefined = row.profiles
    ? mapDbProfileToProfile(row.profiles)
    : undefined;

  return {
    id: row.id,
    userId: row.user_id,
    user,
    mediaId: row.media_id,
    mediaType: row.media_type,
    title: row.title,
    year: row.year,
    posterUrl: row.poster_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.title || 'İzledin')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`,
    backdropUrl: row.backdrop_url,
    genres: row.genres || [],
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : undefined,
    review: row.review || '',
    isFavorite: Boolean(row.is_favorite),
    isRewatch: Boolean(row.is_rewatch),
    status: row.status || 'watched',
    watchedDate: row.watched_date || localTodayISO(),
    likesCount: row.likes_count || 0,
    createdAt: row.created_at,
  };
}

/**
 * Community Feed Algorithmic Scoring Engine (Topluluk Akış Algoritması)
 * 
 * Scores watch logs based on real engagement, content depth, recency decay,
 * and gives İzledin+ (isPremium) members a subtle, organic boost.
 */
export function calculateCommunityFeedScore(log: WatchLog): number {
  const likes = Math.max(0, log.likesCount || 0);
  const now = Date.now();
  const postDateStr = log.createdAt || log.watchedDate || new Date().toISOString();
  const postTime = new Date(postDateStr).getTime();
  const ageInHours = Math.max(0.1, (now - postTime) / (1000 * 60 * 60));

  // 1. Non-linear Likes Volume
  let score = Math.pow(likes + 1, 1.35) * 12;

  // 2. Review Depth & Critique Quality
  const reviewText = (log.review || '').trim();
  if (reviewText.length >= 200) {
    score *= 1.30; // Detailed cinema critique
  } else if (reviewText.length >= 50) {
    score *= 1.18; // Substantive review
  } else if (reviewText.length > 0) {
    score *= 1.06; // Short thought
  }

  // 3. Rating presence
  if (log.rating !== undefined && log.rating > 0) {
    score *= 1.10;
  }

  // 4. Favorite badge presence
  if (log.isFavorite) {
    score *= 1.08;
  }

  // 5. İzledin+ Member Boost (Subtle, fair 20% organic priority)
  if (log.user?.isPremium) {
    score *= 1.20;
  }

  // 6. Time Decay Half-Life (HackerNews/Reddit style gravity)
  // Gravity 1.28 ensures high-engagement posts stay visible for 24-48h,
  // while fresh trending posts with quick likes rise quickly.
  const gravity = 1.28;
  const timeDecayedScore = score / Math.pow(ageInHours + 2.0, gravity);

  return timeDecayedScore;
}

export type CommunitySortMode = 'trending' | 'top' | 'recent' | 'premium';

export function sortCommunityWatchLogs(logs: WatchLog[], mode: CommunitySortMode = 'trending'): WatchLog[] {
  const cloned = [...logs];

  switch (mode) {
    case 'top':
      // Pure highest likes count first
      return cloned.sort((a, b) => {
        const diff = (b.likesCount || 0) - (a.likesCount || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt || b.watchedDate).getTime() - new Date(a.createdAt || a.watchedDate).getTime();
      });

    case 'recent':
      // Pure chronological: newest first
      return cloned.sort((a, b) => {
        return new Date(b.createdAt || b.watchedDate).getTime() - new Date(a.createdAt || a.watchedDate).getTime();
      });

    case 'premium':
      // Filter for İzledin+ members only, sorted by algorithmic trending score
      return cloned
        .filter((l) => Boolean(l.user?.isPremium))
        .sort((a, b) => calculateCommunityFeedScore(b) - calculateCommunityFeedScore(a));

    case 'trending':
    default:
      // Organic algorithmic feed
      return cloned.sort((a, b) => calculateCommunityFeedScore(b) - calculateCommunityFeedScore(a));
  }
}

export async function getCommunityWatchLogs(
  limit: number = 40,
  minRating: number = 0,
  sortMode: CommunitySortMode = 'trending',
  searchQuery: string = ''
): Promise<WatchLog[]> {
  const supabase = createClient();

  let query = supabase
    .from('watch_logs')
    .select(`
      *,
      profiles (${PROFILE_SELECT_COLUMNS})
    `);

  // Push sort semantics into SQL so 'top' and 'premium' see the WHOLE archive
  // instead of only the N newest rows (previously a 3-week-old hit with many
  // likes was permanently invisible under a recent-first window).
  if (sortMode === 'top') {
    query = query
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  if (sortMode === 'premium') {
    query = query.eq('profiles.is_premium', true);
  }
  query = query.limit(limit);

  if (minRating > 0) {
    query = query.gte('rating', minRating);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    // Commas/parens break PostgREST's .or() grammar — a search containing one
    // made the whole query fail into an empty result set.
    const q = `%${sanitizePostgrestPattern(searchQuery)}%`;
    query = query.or(`title.ilike.${q},review.ilike.${q}`);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn('Error fetching community watch logs:', error);
    return [];
  }

  const mapped = data.map(mapDbLogToWatchLog);

  if (sortMode === 'top' || sortMode === 'premium') {
    return mapped; // already correctly ordered server-side
  }
  return sortCommunityWatchLogs(mapped, sortMode);
}

/**
 * Strips characters that are syntactically significant inside a PostgREST
 * `.or()` ilike pattern (commas split arguments, parentheses group them).
 */
function sanitizePostgrestPattern(input: string): string {
  return input.trim().replace(/[,()]/g, ' ').replace(/\s+/g, ' ');
}

export async function getUserWatchLogs(userId: string, searchQuery: string = ''): Promise<WatchLog[]> {
  const supabase = createClient();
  let query = supabase
    .from('watch_logs')
    .select(`
      *,
      profiles (${PROFILE_SELECT_COLUMNS})
    `)
    .eq('user_id', userId)
    .order('watched_date', { ascending: false });

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = `%${sanitizePostgrestPattern(searchQuery)}%`;
    query = query.or(`title.ilike.${q},review.ilike.${q}`);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn('Error fetching user watch logs:', error);
    return [];
  }

  return data.map(mapDbLogToWatchLog);
}

export interface CreateWatchLogResult {
  data: WatchLog | null;
  error: string | null;
}

export async function createWatchLog(logData: {
  userId: string;
  mediaId: string;
  mediaType?: string;
  title: string;
  year?: number;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];
  rating?: number;
  review?: string;
  isFavorite?: boolean;
  isRewatch?: boolean;
  status?: string;
  watchedDate?: string;
}): Promise<CreateWatchLogResult> {
  if (!logData.userId || !UUID_REGEX.test(logData.userId)) {
    return { data: null, error: 'Geçersiz kullanıcı oturumu. Lütfen tekrar giriş yapın.' };
  }
  if (!logData.mediaId || !logData.title?.trim()) {
    return { data: null, error: 'Film bilgileri eksik veya geçersiz.' };
  }

  const supabase = createClient();

  // 1. Preflight Auth & Token Verification
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        return { data: null, error: 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.' };
      }
    }
  } catch (_) {
    // Non-blocking preflight fallback
  }

  // 2. Anti-Spam Rate Limit Guard (Max 6 logs/min per user)
  const rateLimit = await checkRateLimit(`diary:${logData.userId}`, RATE_LIMIT_PROFILES.DIARY_LOG);
  if (!rateLimit.success) {
    return { data: null, error: 'Çok sık işlem yaptınız. Lütfen 1 dakika sonra tekrar deneyin.' };
  }

  // 3. Normalize & Sanitize payload
  const rawType = logData.mediaType === 'series' ? 'tv' : (logData.mediaType || 'movie');
  const validMediaType = ['movie', 'tv', 'anime', 'series'].includes(rawType) ? rawType : 'movie';
  const rawStatus = logData.status || 'watched';
  const validStatus = ['watched', 'watching', 'plan_to_watch', 'dropped', 'watchlist'].includes(rawStatus)
    ? rawStatus
    : 'watched';

  const clampedRating =
    typeof logData.rating === 'number' && !Number.isNaN(logData.rating)
      ? Math.max(0, Math.min(10, Number(logData.rating.toFixed(1))))
      : null;

  const validWatchedDate =
    logData.watchedDate && /^\d{4}-\d{2}-\d{2}$/.test(logData.watchedDate)
      ? logData.watchedDate
      : localTodayISO();

  const insertPayload = {
    user_id: logData.userId,
    media_id: logData.mediaId,
    media_type: validMediaType,
    title: logData.title.trim(),
    year: typeof logData.year === 'number' && !Number.isNaN(logData.year) ? logData.year : null,
    poster_url: logData.posterUrl || null,
    backdrop_url: logData.backdropUrl || logData.posterUrl || null,
    genres: Array.isArray(logData.genres) ? logData.genres : [],
    rating: clampedRating,
    review: logData.review?.trim() || null,
    is_favorite: Boolean(logData.isFavorite),
    is_rewatch: Boolean(logData.isRewatch),
    status: validStatus,
    watched_date: validWatchedDate,
  };

  const { data, error } = await supabase
    .from('watch_logs')
    .insert(insertPayload)
    .select(`
      *,
      profiles (${PROFILE_SELECT_COLUMNS})
    `)
    .single();

  if (error) {
    console.error('Error creating watch log:', error);
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      return { data: null, error: 'Oturum yetkilendirmesi başarısız oldu. Lütfen tekrar giriş yapın.' };
    }
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      return { data: null, error: 'Kullanıcı profil kaydı bulunamadı. Lütfen profilinizi güncelleyin.' };
    }
    if (error.code === '23514' || error.message?.includes('check constraint')) {
      return { data: null, error: 'Girilen bilgiler geçersiz değer içeriyor.' };
    }
    return { data: null, error: error.message || 'Kayıt oluşturulurken bir hata oluştu.' };
  }

  if (!data) {
    return { data: null, error: 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.' };
  }

  // Profile counters (total_watched_count / total_watch_hours) are maintained
  // by the trg_bump_profile_watch_stats trigger — atomic and decremented on
  // delete. No manual client-side bookkeeping.
  return { data: mapDbLogToWatchLog(data), error: null };
}

export async function deleteWatchLog(logId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('watch_logs')
    .delete()
    .eq('id', logId);

  return !error;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUserLikedLogIds(userId: string): Promise<Set<string>> {
  if (!userId || !UUID_REGEX.test(userId)) return new Set();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('watch_log_likes')
    .select('log_id')
    .eq('user_id', userId);

  if (error || !data) return new Set();
  return new Set(data.map((row: any) => row.log_id));
}

export async function toggleWatchLogLike(
  logId: string,
  userId: string
): Promise<{ liked: boolean; newCount: number } | null> {
  if (!logId || !userId || !UUID_REGEX.test(userId)) return null;
  const supabase = createClient();

  // Atomic server-side toggle + exact recount (prevents likes_count drift).
  const { data, error } = await supabase.rpc('toggle_watch_log_like', {
    p_log_id: logId,
  });

  if (error) {
    console.error('toggle_watch_log_like failed:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    liked: Boolean(row.liked),
    newCount: Number(row.likes_count ?? 0),
  };
}

/**
 * Fetches the genuine community-voted Masterpiece of the Week.
 * 1. Queries Supabase watch_logs for the most acclaimed/reviewed film by club members.
 * 2. If insufficient member logs exist (< 2 positive impressions), automatically falls back to 
 *    the IMDb Top 100 masterpiece pool rotating deterministically week by week.
 */
export async function getWeeklyFeaturedMasterpiece(): Promise<MediaItem> {
  try {
    const supabase = createClient();

    // 0. Check for explicit Admin Featured Override in site_settings
    try {
      const { data: overrideSetting } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_masterpiece_override')
        .maybeSingle();

      if (overrideSetting?.value?.mediaId) {
        const overrideDetails = await getOMDBDetails(overrideSetting.value.mediaId);
        if (overrideDetails) return overrideDetails;
      }
    } catch (_) {}
    
    // Check logs from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs } = await supabase
      .from('watch_logs')
      .select('media_id, user_id, rating, is_favorite, review, likes_count, created_at')
      .gte('created_at', thirtyDaysAgo);

    let logsToScore = logs || [];

    // If recent logs are scarce, consider all-time community logs
    if (logsToScore.length < 3) {
      const { data: allLogs } = await supabase
        .from('watch_logs')
        .select('media_id, user_id, rating, is_favorite, review, likes_count, created_at')
        .order('likes_count', { ascending: false })
        .limit(100);
      if (allLogs && allLogs.length > 0) {
        logsToScore = allLogs;
      }
    }

    if (logsToScore.length >= 2) {
      // Score each unique media_id with 10-point scale & multi-user consensus
      interface MediaScoreData {
        totalRawScore: number;
        users: Set<string>;
        ratingSum: number;
        ratingCount: number;
      }
      const scoreMap: Record<string, MediaScoreData> = {};
      
      for (const log of logsToScore) {
        if (!log.media_id) continue;
        const rating = Number(log.rating) || 0;

        // Only logs with rating >= 7.5 or marked as favorite count towards Masterpiece status
        if (rating >= 7.5 || log.is_favorite) {
          if (!scoreMap[log.media_id]) {
            scoreMap[log.media_id] = {
              totalRawScore: 0,
              users: new Set<string>(),
              ratingSum: 0,
              ratingCount: 0,
            };
          }

          const entry = scoreMap[log.media_id];
          if (log.user_id) entry.users.add(log.user_id);

          const ratingScore = rating >= 5 ? (rating - 5) * 2 : 0; // 8/10 -> 6, 9/10 -> 8, 10/10 -> 10
          const favoriteScore = log.is_favorite ? 6 : 0;
          const reviewLen = (log.review || '').trim().length;
          const reviewScore = reviewLen >= 50 ? 4 : reviewLen >= 15 ? 2 : 0;
          const likesScore = Math.min(15, (Number(log.likes_count) || 0) * 1.5);

          entry.totalRawScore += (ratingScore + favoriteScore + reviewScore + likesScore);
          if (rating > 0) {
            entry.ratingSum += rating;
            entry.ratingCount += 1;
          }
        }
      }

      // Rank by weighted score multiplied by distinct user consensus
      const sorted = Object.entries(scoreMap)
        .map(([mediaId, data]) => {
          const distinctUserMultiplier = Math.log2(data.users.size + 1); // 1 user = 1x, 3 users = 2x, 7 users = 3x
          const finalScore = data.totalRawScore * distinctUserMultiplier;
          const avgRating = data.ratingCount > 0 ? data.ratingSum / data.ratingCount : 0;
          return {
            mediaId,
            finalScore,
            avgRating,
            uniqueUsers: data.users.size,
          };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

      // Must meet minimum consensus threshold (at least 2 users OR very high total score) and avg rating >= 7.5
      if (sorted.length > 0) {
        const top = sorted[0];
        if (top.finalScore >= 18 && (top.uniqueUsers >= 2 || top.finalScore >= 35) && (top.avgRating === 0 || top.avgRating >= 7.5)) {
          const details = await getOMDBDetails(top.mediaId);
          if (details) return details;
        }
      }
    }
  } catch (err) {
    console.warn('Community weekly masterpiece calculation fallback:', err);
  }

  // Fallback: Rotating IMDb Top 100 masterpiece based on ISO calendar week of the year
  return getMasterpieceOfTheWeek();
}

export async function getWatchLogById(logId: string): Promise<WatchLog | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('watch_logs')
    .select(`
      *,
      profiles (${PROFILE_SELECT_COLUMNS})
    `)
    .eq('id', logId)
    .single();

  if (error || !data) return null;

  return mapDbLogToWatchLog(data);
}

/**
 * Toggles the current user's watchlist entry for a media item — a watch_logs
 * row with status='watchlist'. No rating/review required. `year` is passed
 * through untouched: an unknown year stays NULL in the DB, never fabricated.
 *
 * Throws on DB failure so callers can surface a real error instead of
 * pretending the row was written.
 */
export async function toggleWatchlistItem(
  userId: string,
  media: MediaItem
): Promise<{ added: boolean }> {
  const supabase = createClient();

  const { data: existing, error: selectError } = await supabase
    .from('watch_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('media_id', media.id)
    .eq('status', 'watchlist')
    .limit(1)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing) {
    const { error: deleteError } = await supabase
      .from('watch_logs')
      .delete()
      .eq('id', existing.id);

    if (deleteError) throw new Error(deleteError.message);
    return { added: false };
  }

  const { error: insertError } = await supabase.from('watch_logs').insert({
    user_id: userId,
    media_id: media.id,
    media_type: media.type,
    title: media.title,
    year: media.year ?? null,
    poster_url: media.posterPath ?? null,
    backdrop_url: media.backdropPath ?? null,
    genres: media.genres ?? [],
    rating: null,
    review: null,
    is_favorite: false,
    is_rewatch: false,
    status: 'watchlist',
    watched_date: localTodayISO(),
  });

  if (insertError) throw new Error(insertError.message);
  return { added: true };
}

/**
 * Cheap per-item truth check for the current user's relationship to a title:
 * whether a watchlist row exists and whether any actual viewing log exists.
 * `logged` deliberately excludes pure watchlist rows — being on the list is
 * not the same as having watched it.
 */
export async function getMyMediaStatus(
  userId: string,
  mediaId: string
): Promise<{ watchlisted: boolean; logged: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('watch_logs')
    .select('id,status')
    .eq('user_id', userId)
    .eq('media_id', mediaId);

  if (error) throw new Error(error.message);

  const rows = data || [];
  return {
    watchlisted: rows.some((row: any) => row.status === 'watchlist'),
    logged: rows.some((row: any) => row.status !== 'watchlist'),
  };
}

export async function getRecentMediaLogs(mediaId: string, excludeLogId?: string, limit: number = 20): Promise<WatchLog[]> {
  const supabase = createClient();
  let query = supabase
    .from('watch_logs')
    .select(`
      *,
      profiles (${PROFILE_SELECT_COLUMNS})
    `)
    .eq('media_id', mediaId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (excludeLogId) {
    query = query.neq('id', excludeLogId);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map(mapDbLogToWatchLog);
}
