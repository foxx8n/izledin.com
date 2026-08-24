import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

/**
 * Column-level privacy grants make birth_date / is_banned / ban_reason /
 * banned_at / intent_agreed_at unSELECTable for browser roles (anon +
 * authenticated). Any `select('*')` on profiles asks for those columns too,
 * and Postgres rejects the ENTIRE query with 42501 "permission denied for
 * table profiles". Every client-side profiles read must use this explicit
 * safe list; admin flows that genuinely need ban data go through the
 * is_admin()-gated admin_list_profiles RPC instead.
 */
export const PROFILE_SELECT_COLUMNS = [
  'id',
  'username',
  'full_name',
  'avatar_url',
  'bio',
  'location',
  'favorite_genres',
  'top_4_favorites',
  'streaming_services',
  'is_premium',
  'match_enabled',
  'total_watched_count',
  'total_watch_hours',
  'created_at',
  'updated_at',
  'is_verified',
  'match_intent',
  'intent_last_changed_at',
  'intent_integrity_score',
  'intent_strikes_count',
].join(',');

export function calculateAge(birthDateStr?: string): number | undefined {
  if (!birthDateStr) return undefined;
  // Parse calendar parts locally — new Date('YYYY-MM-DD') is UTC midnight,
  // which flips the birthday one day early in negative-offset timezones.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDateStr);
  if (!m) return undefined;
  const birthY = Number(m[1]);
  const birthM = Number(m[2]);
  const birthD = Number(m[3]);
  const today = new Date();
  let age = today.getFullYear() - birthY;
  const mm = today.getMonth() + 1 - birthM;
  if (mm < 0 || (mm === 0 && today.getDate() < birthD)) {
    age--;
  }
  return age >= 0 ? age : undefined;
}

export function mapDbProfileToProfile(row: any): Profile {
  const birthDate = row.birth_date || row.birthDate || undefined;
  const computedAge = row.age || calculateAge(birthDate);

  return {
    id: row.id,
    username: row.username || 'sinemasever',
    fullName: row.full_name || 'Sinemasever',
    avatarUrl: row.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.username || 'S')}&backgroundColor=0A0A0A&textColor=DC2626&fontWeight=900`,
    // Honest display fallbacks: absent user content stays absent — no invented
    // bios or cities attributed to people who never wrote them.
    bio: row.bio || undefined,
    location: row.location || undefined,
    birthDate: birthDate,
    age: computedAge,
    favoriteGenres: row.favorite_genres || [],
    top4Favorites: row.top_4_favorites || [],
    streamingServices: row.streaming_services || [],
    isPremium: Boolean(row.is_premium),
    matchEnabled: row.match_enabled !== false,
    matchIntent: (row.match_intent || row.matchIntent || 'friend') as any,
    intentLastChangedAt: row.intent_last_changed_at || undefined,
    intentIntegrityScore: row.intent_integrity_score ?? 98,
    intentStrikesCount: row.intent_strikes_count ?? 0,
    intentAgreedAt: row.intent_agreed_at || undefined,
    // DB default is false — an unreadable value must not fabricate a badge
    isVerified: Boolean(row.is_verified),
    isBanned: Boolean(row.is_banned),
    banReason: row.ban_reason || undefined,
    bannedAt: row.banned_at || undefined,
    totalWatchedCount: row.total_watched_count || 0,
    totalWatchHours: row.total_watch_hours || 0,
    createdAt: row.created_at,
  };
}

export function mapProfileToDb(profile: Partial<Profile>): Record<string, any> {
  const dbData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (profile.username !== undefined) dbData.username = profile.username;
  if (profile.fullName !== undefined) dbData.full_name = profile.fullName;
  if (profile.avatarUrl !== undefined) dbData.avatar_url = profile.avatarUrl;
  if (profile.bio !== undefined) dbData.bio = profile.bio;
  if (profile.location !== undefined) dbData.location = profile.location;
  // Empty string means "cleared" — write a real NULL so birth dates can be
  // removed again, not just changed.
  if (profile.birthDate !== undefined)
    dbData.birth_date = profile.birthDate ? profile.birthDate : null;
  if (profile.favoriteGenres !== undefined) dbData.favorite_genres = profile.favoriteGenres;
  if (profile.top4Favorites !== undefined) dbData.top_4_favorites = profile.top4Favorites;
  if (profile.streamingServices !== undefined) dbData.streaming_services = profile.streamingServices;
  // NOTE: is_premium / is_verified / is_banned are intentionally NOT mapped here.
  // They are privileged fields — clients cannot write them (column grants +
  // protection trigger). Admin flows go through the admin_set_user_flags RPC.
  if (profile.matchEnabled !== undefined) dbData.match_enabled = profile.matchEnabled;
  if (profile.matchIntent !== undefined) dbData.match_intent = profile.matchIntent;
  if (profile.intentAgreedAt !== undefined) dbData.intent_agreed_at = profile.intentAgreedAt;
  // NOTE: intent_integrity_score / intent_strikes_count / total_watched_count /
  // total_watch_hours are intentionally NOT mapped either. Column grants exclude
  // them from UPDATE, so any SET clause touching them fails the whole statement
  // with 42501. They are server-maintained now (submit_user_report RPC and the
  // watch-stats trigger).
  return dbData;

  return dbData;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProfileById(userId: string): Promise<Profile | null> {
  if (!userId || !UUID_REGEX.test(userId)) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // birth_date is not directly readable anymore (privacy: only ages are public).
  // Owners get their own date back via RPC so onboarding / profile forms prefill.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id === userId) {
    const { data: ownBirthDate } = await supabase.rpc('get_my_birth_date');
    if (ownBirthDate) (data as Record<string, unknown>).birth_date = ownBirthDate;
  }

  return mapDbProfileToProfile(data);
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return getProfileById(user.id);
}

/**
 * UPDATE/UPSERT returning rows are privacy-redacted (birth_date is not
 * SELECTable). Owners get their own values re-attached so client state
 * keeps birthDate/age after a save instead of silently losing them.
 */
async function withOwnBirthDate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  row: Record<string, any>
): Promise<Record<string, any>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id === userId) {
    const { data: bd } = await supabase.rpc('get_my_birth_date');
    if (bd) row.birth_date = bd;
  }
  return row;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  if (!userId || !UUID_REGEX.test(userId)) {
    return null;
  }

  const supabase = createClient();
  const dbUpdates = mapProfileToDb(updates);

  // Try updating first
  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select(PROFILE_SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error('Error updating profile:', error.message || error);
    return null;
  }

  if (data) {
    return mapDbProfileToProfile(await withOwnBirthDate(supabase, userId, data));
  }

  // If no row existed to update, perform an upsert
  const { data: upsertData, error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...dbUpdates })
    .select(PROFILE_SELECT_COLUMNS)
    .maybeSingle();

  if (upsertError || !upsertData) {
    console.error('Error upserting profile:', upsertError?.message || upsertError);
    return null;
  }

  return mapDbProfileToProfile(await withOwnBirthDate(supabase, userId, upsertData));
}

export async function listDiscoverProfiles(excludeUserId?: string, limit: number = 25): Promise<Profile[]> {
  const supabase = createClient();
  let query = supabase
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .eq('match_enabled', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (excludeUserId && UUID_REGEX.test(excludeUserId)) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn('Error fetching discover profiles:', error);
    return [];
  }

  // Ages are computed server-side; birth_date itself never leaves the database.
  const ids = data.map((row: any) => row.id).filter(Boolean);
  const ageMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: ages } = await supabase.rpc('get_user_ages', { p_ids: ids });
    for (const entry of ages ?? []) {
      ageMap.set((entry as any).id, (entry as any).age);
    }
  }

  return data.map((row: any) => mapDbProfileToProfile({ ...row, age: row.age ?? ageMap.get(row.id) }));
}
