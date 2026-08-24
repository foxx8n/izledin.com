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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SendMessageResult {
  data: ChatMessage | null;
  error: string | null;
}

export async function sendDirectMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<SendMessageResult> {
  if (!content || !content.trim()) {
    return { data: null, error: 'Mesaj içeriği boş olamaz.' };
  }

  if (!matchId || !UUID_REGEX.test(matchId)) {
    return { data: null, error: 'Geçersiz eşleşme oturumu.' };
  }

  if (!senderId || !UUID_REGEX.test(senderId)) {
    return { data: null, error: 'Geçersiz kullanıcı oturumu. Lütfen tekrar giriş yapın.' };
  }

  const supabase = createClient();

  // 1. Preflight Auth & Token Verification
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        return { data: null, error: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' };
      }
    }
  } catch (_) {
    // Non-blocking preflight fallback
  }

  // 2. Anti-Spam Rate Limiter (Max 25 messages/min)
  const rateLimit = await checkRateLimit(`chat:${senderId}`, RATE_LIMIT_PROFILES.CHAT_MESSAGE);
  if (!rateLimit.success) {
    return { data: null, error: 'Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyin.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content: content.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      return {
        data: null,
        error:
          'Mesaj gönderilemedi. Bu istek henüz karşı tarafça onaylanmamış veya reddedilmiş olabilir.',
      };
    }
    return { data: null, error: error.message || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.' };
  }

  if (!data) {
    return { data: null, error: 'Mesaj iletilemedi. Lütfen tekrar deneyin.' };
  }

  return { data: mapDbMessageToChat(data), error: null };
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
