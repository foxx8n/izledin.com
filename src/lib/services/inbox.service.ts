import { createClient } from '@/lib/supabase/client';
import { Profile, MovieMateMatch, ChatMessage } from '@/types';
import { mapDbProfileToProfile, PROFILE_SELECT_COLUMNS } from './profile.service';
import { mapDbMessageToChat } from './messages.service';

export interface InboxItem {
  matchId: string;
  partner: Profile;
  lastMessage?: ChatMessage;
  unreadCount: number;
  compatibilityScore: number;
  status: 'pending' | 'matched' | 'passed';
  isPendingForMe: boolean; // Pending match where initiator is the other person
  initiatorId?: string;
  updatedAt: string;
  sortKey?: string; // ISO timestamp used for ordering (updatedAt is display-only)
}

export interface InboxSummary {
  items: InboxItem[];
  totalUnreadCount: number;
  pendingRequestsCount: number;
}

export async function getInboxSummary(currentUserId: string): Promise<InboxSummary> {
  const supabase = createClient();

  // 1. Matches + embedded messages in ONE round trip.
  const { data: matchRows, error } = await supabase
    .from('movie_mate_matches')
    .select(
      `id,
       user_id_1,
       user_id_2,
       compatibility_score,
       status,
       initiator_id,
       updated_at,
       last_message:messages(content, created_at, sender_id, is_read)`,
    )
    .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
    .order('updated_at', { ascending: false });

  if (error || !matchRows) {
    // Hard failure — throw so callers can distinguish "empty inbox" from
    // "inbox unavailable" (InboxModal renders an error state with retry).
    console.warn('Error fetching inbox matches:', error);
    throw new Error(
      (error as { message?: string } | null)?.message ||
        'Gelen kutusu yüklenemedi.',
    );
  }

  const liveRows = matchRows.filter(
    (row: any) => row.status !== 'passed' && row.status !== 'blocked',
  );
  if (liveRows.length === 0) {
    return { items: [], totalUnreadCount: 0, pendingRequestsCount: 0 };
  }

  // 2. Partner profiles in one batch.
  const partnerIds = liveRows.map((row: any) =>
    row.user_id_1 === currentUserId ? row.user_id_2 : row.user_id_1,
  );
  const { data: partnerRows, error: partnerError } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .in('id', partnerIds);
  if (partnerError) {
    console.warn('Error fetching inbox partners:', partnerError);
    throw new Error(partnerError.message || 'Gelen kutusu yüklenemedi.');
  }
  const partnerMap = new Map<string, Profile>();
  for (const row of partnerRows ?? []) {
    partnerMap.set(row.id, mapDbProfileToProfile(row));
  }

  // 3. Unread markers in one batch, counted client-side.
  const matchIds = liveRows.map((row: any) => row.id);
  const unreadByMatch = new Map<string, number>();
  const { data: unreadRows, error: unreadError } = await supabase
    .from('messages')
    .select('match_id')
    .in('match_id', matchIds)
    .eq('is_read', false)
    .neq('sender_id', currentUserId)
    .limit(2000);
  if (unreadError) {
    // Without this batch the badge would silently read 0 — worse than failing.
    console.warn('Error fetching inbox unread markers:', unreadError);
    throw new Error(unreadError.message || 'Gelen kutusu yüklenemedi.');
  }
  for (const row of unreadRows ?? []) {
    unreadByMatch.set(row.match_id, (unreadByMatch.get(row.match_id) || 0) + 1);
  }

  const items: InboxItem[] = [];
  let totalUnread = 0;
  let pendingRequests = 0;

  for (const row of liveRows) {
    const isUser1 = row.user_id_1 === currentUserId;
    const partnerId = isUser1 ? row.user_id_2 : row.user_id_1;
    const isPendingForMe =
      row.status === 'pending' && row.initiator_id === partnerId;

    const partner = partnerMap.get(partnerId);
    if (!partner) continue; // profile deleted mid-flight

    let lastMessageRaw: any = undefined;
    if (Array.isArray(row.last_message) && row.last_message.length > 0) {
      const sorted = [...row.last_message].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      lastMessageRaw = sorted[0];
    }
    const lastMessage = lastMessageRaw ? mapDbMessageToChat(lastMessageRaw) : undefined;

    // Only matched conversations contribute to the unread badge — otherwise
    // each pending request's intro message double-counts against
    // pendingRequestsCount and inflates the navbar badge.
    const unread =
      row.status === 'matched' ? unreadByMatch.get(row.id) || 0 : 0;
    totalUnread += unread;

    if (isPendingForMe) pendingRequests += 1;

    items.push({
      matchId: row.id,
      partner,
      lastMessage,
      unreadCount: unread,
      compatibilityScore:
        typeof row.compatibility_score === 'number'
          ? row.compatibility_score
          : 80,
      status: row.status,
      isPendingForMe,
      initiatorId: row.initiator_id || undefined,
      updatedAt: lastMessage
        ? lastMessage.createdAt
        : new Date(row.updated_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
      sortKey: lastMessageRaw?.created_at || row.updated_at,
    });
  }

  // Latest activity first (DB order is by match-row updated_at, which sending
  // a message does not touch).
  items.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));

  return {
    items,
    totalUnreadCount: totalUnread,
    pendingRequestsCount: pendingRequests,
  };
}

/**
 * Marks the partner's messages in this conversation as read. The is_read
 * UPDATE grant now exists (it used to fail silently), but the write can still
 * fail on network/RLS issues — returns success so callers don't clear local
 * badges when the server never confirmed.
 */
export async function markMatchMessagesAsRead(
  matchId: string,
  currentUserId: string,
): Promise<boolean> {
  const supabase = createClient();
  // Only touch unread rows: updating every historical message fires one
  // realtime event per row and storms every subscriber into refetching.
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('match_id', matchId)
    .eq('is_read', false)
    .neq('sender_id', currentUserId);

  if (error) {
    console.warn('markMatchMessagesAsRead failed:', error.message);
    return false;
  }
  return true;
}

export interface MatchRespondResult {
  success: boolean;
  /** Human-readable Turkish reason, safe to render directly. */
  error?: string;
}

function describeRpcFailure(
  error: { message?: string | null } | null | undefined,
): string {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  // match_respond raises Turkish exceptions ('Bu istek artık geçerli değil.',
  // 'Kendi isteğinizi kabul edemezsiniz.', …) — pass them through verbatim.
  return message || 'İşlem şu anda tamamlanamadı. Lütfen tekrar deneyin.';
}

/**
 * Accept/reject transitions run through the SECURITY DEFINER `match_respond`
 * RPC — direct client UPDATEs on movie_mate_matches are revoked.
 * Returns {success,error?}: any RPC error OR an empty result counts as failure.
 */
export async function acceptMatchRequest(
  matchId: string,
): Promise<MatchRespondResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('match_respond', {
    p_match_id: matchId,
    p_action: 'accept',
  });

  if (error) {
    console.warn('acceptMatchRequest failed:', error.message);
    return { success: false, error: describeRpcFailure(error) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.status !== 'matched') {
    return { success: false, error: 'Bu istek artık geçerli değil.' };
  }
  return { success: true };
}

/** Receiver-only pending→passed transition via `match_respond`. */
export async function rejectMatchRequest(
  matchId: string,
): Promise<MatchRespondResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('match_respond', {
    p_match_id: matchId,
    p_action: 'reject',
  });

  if (error) {
    console.warn('rejectMatchRequest failed:', error.message);
    return { success: false, error: describeRpcFailure(error) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.status !== 'passed') {
    return { success: false, error: 'Bu istek artık geçerli değil.' };
  }
  return { success: true };
}
