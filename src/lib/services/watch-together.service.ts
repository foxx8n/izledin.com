import { createClient } from '@/lib/supabase/client';
import { WatchTogetherItem } from '@/types';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '@/lib/rate-limiter';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ORTAK SEANS data plane (S14). The watch_together_items table + participant-
 * scoped RLS shipped dormant; this service is its first client. All writes go
 * through RLS: INSERT/UPDATE require a 'matched' pair, so every caller should
 * only mount this against matched conversations.
 */
function mapDbToWatchTogetherItem(row: any): WatchTogetherItem {
  return {
    id: row.id,
    matchId: row.match_id,
    mediaId: row.media_id,
    mediaType: (row.media_type || 'movie') as WatchTogetherItem['mediaType'],
    title: row.title,
    posterUrl: row.poster_url || '',
    addedBy: row.added_by,
    status: row.status || 'suggested',
    createdAt: new Date(row.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    }),
  };
}

export async function getWatchTogetherItems(matchId: string): Promise<WatchTogetherItem[]> {
  if (!matchId || !UUID_REGEX.test(matchId)) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('watch_together_items')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.warn('Error fetching watch-together items:', error);
    return [];
  }

  return data.map(mapDbToWatchTogetherItem);
}

export interface WatchTogetherMutationResult {
  ok: boolean;
  error?: string;
}

export async function addWatchTogetherItem(
  matchId: string,
  userId: string,
  item: { id: string; title: string; type: string; posterPath?: string }
): Promise<WatchTogetherMutationResult> {
  if (!matchId || !UUID_REGEX.test(matchId)) {
    return { ok: false, error: 'Geçersiz eşleşme oturumu.' };
  }
  if (!userId || !UUID_REGEX.test(userId)) {
    return { ok: false, error: 'Geçersiz kullanıcı oturumu.' };
  }
  if (!item?.id || !item.title?.trim()) {
    return { ok: false, error: 'Geçersiz yapım.' };
  }

  // Anti-spam: same bucket as diary logs — list edits are low-volume writes.
  const rateLimit = await checkRateLimit(`watchlist:${userId}`, RATE_LIMIT_PROFILES.DIARY_LOG);
  if (!rateLimit.success) {
    return { ok: false, error: 'Çok hızlı işlem yapıyorsunuz. Lütfen biraz bekleyin.' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('watch_together_items').insert({
    match_id: matchId,
    media_id: item.id,
    media_type: item.type,
    title: item.title.trim(),
    poster_url: item.posterPath || null,
    added_by: userId,
  });

  if (error) {
    console.warn('Error adding watch-together item:', error);
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      return { ok: false, error: 'Ortak seans yalnızca eşleşmiş İzdaşlar arasında açılır.' };
    }
    return { ok: false, error: error.message || 'Yapım eklenemedi. Lütfen tekrar deneyin.' };
  }

  return { ok: true };
}

export async function setWatchTogetherItemStatus(
  itemId: string,
  status: WatchTogetherItem['status']
): Promise<WatchTogetherMutationResult> {
  if (!itemId || !UUID_REGEX.test(itemId)) {
    return { ok: false, error: 'Geçersiz kayıt.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('watch_together_items')
    .update({ status })
    .eq('id', itemId);

  if (error) {
    console.warn('Error updating watch-together status:', error);
    return { ok: false, error: error.message || 'Durum güncellenemedi.' };
  }

  return { ok: true };
}

export async function removeWatchTogetherItem(
  itemId: string
): Promise<WatchTogetherMutationResult> {
  if (!itemId || !UUID_REGEX.test(itemId)) {
    return { ok: false, error: 'Geçersiz kayıt.' };
  }

  const supabase = createClient();
  // RLS: only the adder (or an admin) may delete — others get 42501.
  const { error } = await supabase
    .from('watch_together_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.warn('Error removing watch-together item:', error);
    return { ok: false, error: 'Yalnızca ekleyen kişi kaldırabilir.' };
  }

  return { ok: true };
}

/**
 * Realtime feed for one conversation's shared list. The table joined the
 * supabase_realtime publication in the S14 migration — postgres_changes is
 * live now, not silent.
 */
export function subscribeToWatchTogetherItems(
  matchId: string,
  onChange: () => void
): () => void {
  if (!matchId || !UUID_REGEX.test(matchId)) return () => {};

  const supabase = createClient();
  const channel = supabase
    .channel(`watch_together_${matchId}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'watch_together_items',
        filter: `match_id=eq.${matchId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
