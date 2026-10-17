import { createClient } from '@/lib/supabase/client';
import { WatchLog, Profile } from '@/types';
import { mapDbLogToWatchLog } from './watch-logs.service';
import { mapDbProfileToProfile, PROFILE_SELECT_COLUMNS } from './profile.service';

export const ADMIN_EMAILS: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Checks if the given email belongs to a designated platform administrator.
 * Display convenience only — the real gate is isCurrentUserAdmin() / is_admin().
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Server-truth admin check: asks Postgres whether the current session's user
 * is an admin. is_admin() resolves from auth.uid() / trusted JWT claims /
 * auth.users lookup — never from anything client-writable. Returns false for
 * signed-out visitors, non-admins, and on any RPC error (fail closed).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('is_admin');

    if (error) {
      console.error('Error calling is_admin RPC:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('Error in isCurrentUserAdmin:', err);
    return false;
  }
}

export interface AdminStats {
  totalUsers: number;
  totalLogs: number;
  totalMatches: number;
  totalVIPs: number;
  totalReviews: number;
}

export interface BroadcastAnnouncement {
  enabled: boolean;
  message: string;
  badgeText?: string;
  link?: string;
  type: 'info' | 'alert' | 'event' | 'maintenance';
  updatedAt?: string;
}

/**
 * Fetches platform-wide statistics for the admin dashboard.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

  try {
    const [usersRes, logsRes, matchesRes, vipsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('watch_logs').select('id', { count: 'exact', head: true }),
      supabase.from('movie_mate_matches').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('watch_logs').select('id', { count: 'exact', head: true }).not('review', 'is', null)
    ]);

    return {
      totalUsers: usersRes.count || 0,
      totalLogs: logsRes.count || 0,
      totalMatches: matchesRes.count || 0,
      totalVIPs: vipsRes.count || 0,
      totalReviews: reviewsRes.count || 0,
    };
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return {
      totalUsers: 0,
      totalLogs: 0,
      totalMatches: 0,
      totalVIPs: 0,
      totalReviews: 0,
    };
  }
}

/**
 * Fetches all community watch logs with author profiles for moderation.
 */
export async function getAllWatchLogsAdmin(limit = 100): Promise<WatchLog[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('watch_logs')
      .select(`*, profiles(${PROFILE_SELECT_COLUMNS})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error('Error fetching logs for admin:', error);
      return [];
    }

    return data.map(mapDbLogToWatchLog);
  } catch (err) {
    console.error('Error in getAllWatchLogsAdmin:', err);
    return [];
  }
}

/**
 * Admin action: Permanently deletes a community watch log/post from the platform.
 */
export async function deleteWatchLogAdmin(logId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('watch_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting watch log by admin:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteWatchLogAdmin:', err);
    return { success: false, error: err.message || 'Silme işlemi başarısız oldu' };
  }
}

/**
 * Fetches all registered members on the platform.
 */
export async function getAllProfilesAdmin(limit = 200): Promise<Profile[]> {
  const supabase = createClient();

  try {
    // profiles is privacy-column-granted (birth_date and ban fields are
    // unSELECTable for browser roles), so a plain .select('*') fails with
    // 42501 and ban data is unreachable from clients. The is_admin()-gated
    // RPC returns the public-safe columns PLUS moderation fields.
    const { data, error } = await supabase.rpc('admin_list_profiles', {
      p_limit: limit,
    });

    if (error || !data) {
      console.error('Error fetching profiles for admin:', error);
      return [];
    }

    return data.map(mapDbProfileToProfile);
  } catch (err) {
    console.error('Error in getAllProfilesAdmin:', err);
    return [];
  }
}

/**
 * Admin action: Toggles izledin+ VIP membership status for any user.
 * Runs through the admin_set_user_flags RPC — direct column updates on
 * privileged fields are blocked by column grants + the protection trigger.
 */
export async function toggleUserVIPAdmin(userId: string, isPremium: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('admin_set_user_flags', {
      p_user_id: userId,
      p_is_premium: isPremium,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin action: Toggles verified badge for any user.
 */
export async function toggleUserVerifiedAdmin(userId: string, isVerified: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('admin_set_user_flags', {
      p_user_id: userId,
      p_is_verified: isVerified,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin action: Bans/suspends a user account with an explicit reason.
 */
export async function banUserAdmin(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('admin_set_user_flags', {
      p_user_id: userId,
      p_is_banned: true,
      p_ban_reason: reason || 'Topluluk ve kullanım kurallarının ihlali.',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin action: Unbans/reactivates a suspended user account.
 */
export async function unbanUserAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('admin_set_user_flags', {
      p_user_id: userId,
      p_is_banned: false,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches a site-wide setting from public.site_settings.
 */
export async function getSiteSetting<T = any>(key: string, defaultValue: T): Promise<T> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) {
      return defaultValue;
    }

    return (data.value as T) ?? defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

/**
 * Admin action: Updates or creates a site-wide setting.
 */
export async function setSiteSetting(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
