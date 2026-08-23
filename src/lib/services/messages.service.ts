import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from '@/types';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '@/lib/rate-limiter';

export function mapDbMessageToChat(row: any): ChatMessage {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: Boolean(row.is_read),
  };
}

export async function getMatchMessages(matchId: string): Promise<ChatMessage[]> {
  // If this is a prospective match (not yet in DB), no messages yet
  if (matchId.startsWith('prospective_')) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.warn('Error fetching messages:', error);
    return [];
  }

  return data.map(mapDbMessageToChat);
}

export async function sendDirectMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<ChatMessage | null> {
  // Anti-Spam Rate Limiter (Max 25 messages/min)
  const rateLimit = await checkRateLimit(`chat:${senderId}`, RATE_LIMIT_PROFILES.CHAT_MESSAGE);
  if (!rateLimit.success) {
    console.warn(`Rate limit exceeded for chat messages by user ${senderId}`);
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
      is_read: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error sending message:', error);
    return null;
  }

  return mapDbMessageToChat(data);
}

export function subscribeToMatchMessages(
  matchId: string,
  onNewMessage: (msg: ChatMessage) => void
): () => void {
  if (matchId.startsWith('prospective_')) {
    return () => {};
  }

  const supabase = createClient();
  const channel = supabase
    .channel(`messages_match_${matchId}`)
    .on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload: { new: any }) => {
        if (payload.new) {
          onNewMessage(mapDbMessageToChat(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
