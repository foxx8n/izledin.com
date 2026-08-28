// Both unions mirror the LIVE watch_logs CHECK constraints (verified
// 2026-08-25). The repo snapshot supabase/schema.sql drifted from production —
// live allows these extra values:
export type MediaType = 'movie' | 'tv' | 'anime' | 'series';

export type WatchStatus =
  | 'watched'
  | 'watching'
  | 'plan_to_watch'
  | 'dropped'
  | 'watchlist';

export interface MediaItem {
  id: string;
  tmdbId?: number;
  type: MediaType;
  title: string;
  originalTitle?: string;
  overview: string;
  overviewEn?: string;
  posterPath: string;
  backdropPath?: string;
  releaseDate?: string;
  year?: number;
  voteAverage?: number;
  voteCount?: number;
  genres: string[];
  duration?: string; // e.g. "2h 46m" or "24 eps"
  director?: string;
  actors?: string;
  awards?: string;
  imdbVotes?: string;
  streamingOn?: string[]; // e.g. ['Netflix', 'BluTV', 'MUBI']
  trailerUrl?: string;
  cinemaNotes?: string; // Cinephile trivia, director's vision & behind-the-scenes fanzine notes
}

export interface WatchLog {
  id: string;
  userId: string;
  user?: Profile;
  mediaId: string;
  mediaType: MediaType;
  title: string;
  year?: number;
  posterUrl: string;
  backdropUrl?: string;
  genres: string[];
  rating?: number; // 0.0 to 10.0
  review?: string;
  isFavorite?: boolean;
  isRewatch?: boolean;
  status: WatchStatus;
  watchedDate: string;
  likesCount: number;
  isLikedByMe?: boolean;
  createdAt: string;
}

export type MatchIntent = 'friend' | 'dating' | 'both';

export interface Profile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  birthDate?: string; // YYYY-MM-DD
  age?: number;
  favoriteGenres: string[];
  top4Favorites: Array<{
    id: string;
    title: string;
    posterUrl: string;
    type: MediaType;
    year?: number;
  }>;
  streamingServices?: string[];
  isPremium?: boolean;
  matchEnabled?: boolean;
  matchIntent?: MatchIntent; // 'friend' (Sadece Film Arkadaşı), 'dating' (Sinematik Flört/İlişki), 'both' (Her İkisi)
  /** İZDAŞ GÜVENCESİ: when false the profile never enters anyone's deck. */
  radarVisible?: boolean;
  /** S15: explicit KVKK opt-in for the weekly İZDAŞ radar e-postası. */
  digestOptIn?: boolean;
  /**
   * One-time identity change: when set (ISO timestamp), the system-generated
   * full_name + username have been changed once and are now permanent. NULL
   * means the single allowance is still available (onboarding step 1 or the
   * profile-page button). Writes go through the update_my_identity RPC only —
   * the columns are not client-writable.
   */
  identityChangedAt?: string;
  intentLastChangedAt?: string; // ISO timestamp of last intent change (24h cooldown)
  intentIntegrityScore?: number; // 0 to 100 (Topluluk Dürüstlük & Güven Puanı)
  intentStrikesCount?: number; // Niyet ihlali şikayet sayısı
  intentAgreedAt?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  totalWatchedCount?: number;
  totalWatchHours?: number;
  createdAt?: string;
}

export interface MovieMateMatch {
  id: string;
  user: Profile;
  compatibilityScore: number; // 0 to 100
  intent?: MatchIntent;
  sharedGenres: string[];
  sharedTitles: Array<{
    id: string;
    title: string;
    posterUrl: string;
    type: MediaType;
  }>;
  matchReasons: string[];
  status: 'pending' | 'matched' | 'passed' | 'blocked';
  initiatorId?: string;
  /**
   * S12 resurface: the pair was passed by ME earlier and the resurface window
   * brought it back. The row keeps its REAL match id (revive path on like),
   * but every deck surface must treat it as a prospect until re-liked.
   */
  resurfaced?: boolean;
  /**
   * S15 BİLET provenance: this pair row was opened with a super-like by its
   * initiator. Immutable once set; receivers badge it ("BİLETLE geldi").
   */
  isBilet?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface WatchTogetherItem {
  id: string;
  matchId: string;
  mediaId: string;
  mediaType: MediaType;
  title: string;
  posterUrl: string;
  addedBy: string;
  status: 'suggested' | 'watching' | 'watched_together';
  createdAt: string;
}
