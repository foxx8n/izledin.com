'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Check, UserX, Loader2, ArrowRight, Film, RefreshCw } from 'lucide-react';
import { 
  CinemaFriendshipIcon, 
  CinemaRomanceIcon, 
  CinemaDuoIntentIcon, 
  CinemaTrustShieldIcon,
  FilmReelIcon,
  CinemaChatIcon 
} from '@/components/icons/CinemaIcons';
import { useAuth } from '@/context/AuthContext';
import { getInboxSummary, acceptMatchRequest, rejectMatchRequest, cancelMatchRequest, markMatchMessagesAsRead, InboxItem } from '@/lib/services/inbox.service';
import { MovieMateMatch } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (match: MovieMateMatch) => void;
  onOpenAuth?: () => void;
}

// Realtime refreshes run at most once per this interval — platform-wide
// message/match events previously triggered a full getInboxSummary
// recomputation per event (same storm the Navbar badge debounces).
const INBOX_REFRESH_MIN_INTERVAL_MS = 2500;

export function InboxModal({ isOpen, onClose, onOpenChat, onOpenAuth }: InboxModalProps) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [requestsSubTab, setRequestsSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<{ matchId: string; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const lastFetchAtRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInbox = async (showSpinner = true) => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Background refreshes (realtime events) must not flash the spinner over
    // an already-rendered list.
    if (showSpinner) setLoading(true);
    lastFetchAtRef.current = Date.now();
    try {
      const summary = await getInboxSummary(user.id);
      setItems(summary.items);
      setLoadError(false);
    } catch {
      // getInboxSummary throws on hard DB failures — show the error panel
      // with retry instead of an innocent empty inbox.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Leading call when the cooldown has elapsed, otherwise one trailing call
  // after it — event bursts collapse into a single refetch.
  const scheduleInboxRefresh = () => {
    const elapsed = Date.now() - lastFetchAtRef.current;
    if (elapsed >= INBOX_REFRESH_MIN_INTERVAL_MS) {
      lastFetchAtRef.current = Date.now();
      void fetchInbox(false);
      return;
    }
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      lastFetchAtRef.current = Date.now();
      void fetchInbox(false);
    }, Math.max(INBOX_REFRESH_MIN_INTERVAL_MS - elapsed, 0));
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchInbox(true);
    }
  }, [isOpen, user?.id]);

  // Realtime subscription for instant inbox updates — only while open, and
  // refreshed as a background update (no spinner flash).
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`inbox_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          scheduleInboxRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movie_mate_matches' },
        () => {
          scheduleInboxRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  // ESC to close — the footer advertises "[ESC] İLE KAPAT" but the handler
  // was never implemented.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const messageItems = items.filter((item) => item.status === 'matched');
  const incomingRequests = items.filter((item) => item.status === 'pending' && item.isPendingForMe);
  const outgoingRequests = items.filter((item) => item.status === 'pending' && !item.isPendingForMe);
  const totalPendingRequests = incomingRequests.length + outgoingRequests.length;

  const handleAccept = async (item: InboxItem) => {
    setActionError(null);
    setActionLoading(item.matchId);
    try {
      const result = await acceptMatchRequest(item.matchId);
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.matchId === item.matchId ? { ...i, status: 'matched', isPendingForMe: false } : i))
        );
        // Open chat immediately
        handleOpenConversation({ ...item, status: 'matched', isPendingForMe: false });
      } else {
        // Nothing was mutated optimistically: the card stays in place and the
        // RPC's Turkish reason is shown on it. Resync in case the request was
        // resolved elsewhere meanwhile.
        setActionError({
          matchId: item.matchId,
          message: result.error || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
        });
        void fetchInbox(false);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: InboxItem) => {
    setActionError(null);
    setActionLoading(item.matchId);
    try {
      const result = await rejectMatchRequest(item.matchId);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.matchId !== item.matchId));
      } else {
        // Keep the card visible; surface why the pass did not stick.
        setActionError({
          matchId: item.matchId,
          message: result.error || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
        });
        void fetchInbox(false);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (item: InboxItem) => {
    setActionError(null);
    setActionLoading(item.matchId);
    try {
      const result = await cancelMatchRequest(item.matchId);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.matchId !== item.matchId));
      } else {
        setActionError({
          matchId: item.matchId,
          message: result.error || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
        });
        void fetchInbox(false);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenConversation = async (item: InboxItem) => {
    if (user) {
      const marked = await markMatchMessagesAsRead(item.matchId, user.id);
      if (marked) {
        setItems((prev) =>
          prev.map((i) => (i.matchId === item.matchId ? { ...i, unreadCount: 0 } : i))
        );
      } else {
        // Server-side mark failed — don't zero the local badge or it drifts
        // from reality. Resync authoritative unread counts instead.
        void fetchInbox(false);
      }
    }

    // Real overlap only — labeling the partner's whole list as "shared" would
    // fabricate common ground in the chat banner.
    const myGenres = profile?.favoriteGenres || [];
    const realSharedGenres = (item.partner.favoriteGenres || []).filter((g) =>
      myGenres.includes(g)
    );

    const matchObj: MovieMateMatch = {
      id: item.matchId,
      user: item.partner,
      compatibilityScore: item.compatibilityScore,
      sharedGenres: realSharedGenres,
      sharedTitles: [],
      // The inbox payload carries no real "why we matched" data — pass an
      // empty list rather than a canned marketing line.
      matchReasons: [],
      status: item.status,
      initiatorId: item.initiatorId,
    };

    onClose();
    onOpenChat(matchObj);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div 
        className="w-full max-w-xl  bg-[#171717]  text-[#FAFAFA] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200 relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-4  border-[#404040] pb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="stamp-badge-solid px-2.5 py-1 text-xs font-black   bg-[#262626] text-[#EF4444] border-2  border-[#404040]">
              GELEN KUTUSU
            </span>
            <span className="text-xs font-black  text-[#A3A3A3] uppercase">
              #İZDAŞ POSTASI
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center    bg-[#262626] hover:bg-[#EF4444] hover:text-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Kapat"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {!user ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-none  bg-[#EF4444]/15 border-2  border-[#EF4444] mx-auto flex items-center justify-center  text-[#EF4444]">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black uppercase  text-[#FAFAFA]">GELEN KUTUSUNU GÖRMEK İÇİN GİRİŞ YAPIN</h3>
            <p className="text-xs  text-[#A3A3A3] font-bold max-w-sm mx-auto leading-relaxed font-sans">
              Diğer sinemaseverlerle mesajlaşmak ve gelen eşleşme bildirimlerini yanıtlamak için oturum açın.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuth?.();
              }}
              className="h-11 min-h-[44px] px-6   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-2 font-mono"
            >
              <CinemaFriendshipIcon size={16} />
              <span>GİRİŞ YAP</span>
            </button>
          </div>
        ) : (
          <>
            {/* Tabs — Min Height 44px */}
            <div className="grid grid-cols-2 gap-2 border-2  border-[#404040]  bg-[#262626] p-1">
              <button
                onClick={() => setActiveTab('messages')}
                className={`h-11 min-h-[44px] px-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'messages'
                    ? '  bg-[#000000] text-[#FAFAFA] shadow-[2px_2px_0px_#DC2626]'
                    : ' text-[#FAFAFA]  hover:bg-[#333333]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Sohbetler ({messageItems.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`h-11 min-h-[44px] px-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                  activeTab === 'requests'
                    ? '  bg-[#000000] text-[#FAFAFA] shadow-[2px_2px_0px_#DC2626]'
                    : ' text-[#FAFAFA]  hover:bg-[#333333]'
                }`}
              >
                <CinemaTrustShieldIcon size={16} className=" text-[#EF4444]" />
                <span>Mesaj İstekleri ({totalPendingRequests})</span>
                {incomingRequests.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full  bg-[#EF4444] animate-ping absolute top-2 right-2" />
                )}
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6  text-[#EF4444] animate-spin" />
                  <span className="text-xs font-black uppercase  text-[#A3A3A3]">Gelen Kutusu Yükleniyor...</span>
                </div>
              ) : loadError ? (
                /* Fetch failed — never masquerade as an empty inbox */
                <div className="py-12 text-center space-y-3 font-mono">
                  <div className="w-12 h-12 rounded-none  bg-[#EF4444]/15 border-2  border-[#EF4444] mx-auto flex items-center justify-center  text-[#EF4444]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs uppercase font-black  text-[#FAFAFA]">GELEN KUTUSU YÜKLENEMEDİ.</p>
                  <p className="text-[11px]  text-[#A3A3A3] max-w-xs mx-auto font-sans font-medium">
                    Bağlantıda bir sorun oluştu. Sohbetleriniz ve istekleriniz güvende — lütfen tekrar deneyin.
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchInbox(true)}
                    className="h-11 min-h-[44px] px-5   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>TEKRAR DENE</span>
                  </button>
                </div>
              ) : activeTab === 'messages' ? (
                messageItems.length === 0 ? (
                  <div className="py-12 text-center  text-[#A3A3A3] font-bold space-y-2">
                    <div className="w-12 h-12 rounded-none  bg-[#262626] border-2  border-[#404040] mx-auto flex items-center justify-center  text-[#A3A3A3]">
                      <Film className="w-6 h-6 opacity-60" />
                    </div>
                    <p className="text-xs uppercase font-black  text-[#FAFAFA]">HENÜZ AKTİF BİR SOHBETİNİZ YOK.</p>
                    <p className="text-[11px]  text-[#A3A3A3] max-w-xs mx-auto font-sans font-medium">
                      İzdaşlar sayfasından sinemaseverleri keşfedip mesaj isteği gönderebilirsiniz.
                    </p>
                  </div>
                ) : (
                  messageItems.map((item) => (
                    <div
                      key={item.matchId}
                      onClick={() => handleOpenConversation(item)}
                      className="group p-3.5   bg-[#262626] hover:bg-[#333333] border-2  border-[#404040] transition-all cursor-pointer  shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-3 min-h-[58px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.partner.avatarUrl}
                          alt={item.partner.fullName}
                          className="w-10 h-10 object-cover border-2  border-[#404040] flex-shrink-0 bg-[#0A0A0A]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase  text-[#FAFAFA] truncate font-sans">{item.partner.fullName}</h4>
                            <span className="text-[10px]  text-[#A3A3A3] truncate">@{item.partner.username}</span>
                          </div>
                          <p className="text-[11px]  text-[#D4D4D4] font-medium truncate mt-0.5 font-sans">
                            {item.lastMessage ? `"${item.lastMessage.content}"` : 'Sohbete başla...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[10px] font-black shadow-[1px_1px_0px_#0A0A0A]">
                            {item.unreadCount} YENİ
                          </span>
                        )}
                        <span className="text-[10px]  text-[#A3A3A3] font-bold">{item.updatedAt}</span>
                        <ArrowRight className="w-4 h-4  text-[#FAFAFA] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Requests Tab (Incoming & Outgoing Sub-tabs) */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 border border-[#404040] bg-[#171717] p-1 font-mono">
                    <button
                      type="button"
                      onClick={() => setRequestsSubTab('incoming')}
                      className={`h-9 px-2 text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        requestsSubTab === 'incoming'
                          ? 'bg-[#EF4444] text-[#0A0A0A] shadow-[2px_2px_0px_#000000]'
                          : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Gelen ({incomingRequests.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRequestsSubTab('outgoing')}
                      className={`h-9 px-2 text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        requestsSubTab === 'outgoing'
                          ? 'bg-[#EF4444] text-[#0A0A0A] shadow-[2px_2px_0px_#000000]'
                          : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                      }`}
                    >
                      <CinemaTrustShieldIcon size={14} />
                      <span>Giden ({outgoingRequests.length})</span>
                    </button>
                  </div>

                  {requestsSubTab === 'incoming' ? (
                    incomingRequests.length === 0 ? (
                      <div className="py-12 text-center  text-[#A3A3A3] font-bold space-y-2">
                        <div className="w-12 h-12 rounded-none  bg-[#262626] border-2  border-[#404040] mx-auto flex items-center justify-center  text-[#A3A3A3]">
                          <CinemaTrustShieldIcon size={24} className="opacity-50 text-[#DC2626]" />
                        </div>
                        <p className="text-xs uppercase font-black  text-[#FAFAFA]">BEKLEYEN GELEN MESAJ İSTEĞİNİZ YOK.</p>
                        <p className="text-[11px]  text-[#A3A3A3] max-w-xs mx-auto font-sans font-medium">
                          Diğer sinemaseverler sizinle eşleşmek ve sohbet başlatmak istediğinde istekleri burada listelenecektir.
                        </p>
                      </div>
                    ) : (
                      incomingRequests.map((item) => (
                        <div
                          key={item.matchId}
                          className="p-4  bg-[#262626] border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.partner.avatarUrl}
                                alt={item.partner.fullName}
                                className="w-10 h-10 object-cover border-2  border-[#404040] bg-[#0A0A0A] flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-black uppercase  text-[#FAFAFA] truncate font-sans">{item.partner.fullName}</h4>
                                <p className="text-[10px]  text-[#A3A3A3] font-bold truncate">
                                  @{item.partner.username} • {(item.partner.favoriteGenres || []).slice(0, 2).join(', ')}
                                </p>
                              </div>
                            </div>

                            <div className="stamp-badge px-2 py-0.5 text-[11px] font-black  bg-[#EF4444]/15 border border-dashed  border-[#EF4444]  text-[#EF4444] whitespace-nowrap flex-shrink-0">
                              %{item.compatibilityScore} UYUM
                            </div>
                          </div>

                          {/* Request Message Quote */}
                          {item.lastMessage?.content && (
                            <div className=" bg-[#171717] p-2.5 border  border-[#404040] text-xs font-medium italic  text-neutral-300 font-sans">
                              &ldquo;{item.lastMessage.content}&rdquo;
                            </div>
                          )}

                          {/* Accept/reject failure feedback (match_respond RPC) */}
                          {actionError?.matchId === item.matchId && (
                            <p className="px-2.5 py-1.5  bg-rose-500/10 border-2  border-rose-600/40 text-[11px] font-bold text-rose-300">
                              {actionError.message}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t  border-[#404040]">
                            <button
                              onClick={() => handleAccept(item)}
                              disabled={actionLoading === item.matchId}
                              className="flex-1 h-11 min-h-[44px]   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                            >
                              {actionLoading === item.matchId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>Kabul Et & Sohbete Başla</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleReject(item)}
                              disabled={actionLoading === item.matchId}
                              className="h-11 min-h-[44px] px-4   bg-[#171717] hover:bg-[#333333]  text-[#FAFAFA] text-xs font-black uppercase border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                            >
                              <UserX className="w-4 h-4" />
                              <span>Pas</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    /* Outgoing Requests Sub-tab */
                    outgoingRequests.length === 0 ? (
                      <div className="py-12 text-center  text-[#A3A3A3] font-bold space-y-2">
                        <div className="w-12 h-12 rounded-none  bg-[#262626] border-2  border-[#404040] mx-auto flex items-center justify-center  text-[#A3A3A3]">
                          <CinemaTrustShieldIcon size={24} className="opacity-50 text-amber-500" />
                        </div>
                        <p className="text-xs uppercase font-black  text-[#FAFAFA]">GÖNDERİLMİŞ BEKLEYEN BİR İSTEĞİNİZ YOK.</p>
                        <p className="text-[11px]  text-[#A3A3A3] max-w-xs mx-auto font-sans font-medium">
                          Radardan bir sinemaseveri beğendiğinizde gönderdiğiniz istekler burada onay bekler.
                        </p>
                      </div>
                    ) : (
                      outgoingRequests.map((item) => (
                        <div
                          key={item.matchId}
                          className="p-4  bg-[#262626] border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.partner.avatarUrl}
                                alt={item.partner.fullName}
                                className="w-10 h-10 object-cover border-2  border-[#404040] bg-[#0A0A0A] flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-black uppercase  text-[#FAFAFA] truncate font-sans">{item.partner.fullName}</h4>
                                <p className="text-[10px]  text-[#A3A3A3] font-bold truncate">
                                  @{item.partner.username} • {(item.partner.favoriteGenres || []).slice(0, 2).join(', ')}
                                </p>
                              </div>
                            </div>

                            <div className="stamp-badge px-2 py-0.5 text-[10px] font-black  bg-amber-500/15 border border-dashed  border-amber-500  text-amber-400 whitespace-nowrap flex-shrink-0">
                              ONAY BEKLENİYOR
                            </div>
                          </div>

                          {item.lastMessage?.content && (
                            <div className=" bg-[#171717] p-2.5 border  border-[#404040] text-xs font-medium italic  text-neutral-300 font-sans">
                              <span className="not-italic text-[10px] font-black uppercase text-[#A3A3A3] block mb-1">İlettiğiniz Not:</span>
                              &ldquo;{item.lastMessage.content}&rdquo;
                            </div>
                          )}

                          {actionError?.matchId === item.matchId && (
                            <p className="px-2.5 py-1.5  bg-rose-500/10 border-2  border-rose-600/40 text-[11px] font-bold text-rose-300">
                              {actionError.message}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t  border-[#404040]">
                            <button
                              type="button"
                              onClick={() => handleOpenConversation(item)}
                              className="flex-1 h-11 min-h-[44px] bg-[#171717] hover:bg-[#333333] text-[#FAFAFA] text-xs font-black uppercase border-2 border-[#404040] shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
                            >
                              <MessageSquare className="w-4 h-4 text-[#EF4444]" />
                              <span>Detayı Görüntüle</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancel(item)}
                              disabled={actionLoading === item.matchId}
                              className="h-11 min-h-[44px] px-4 bg-[#262626] hover:bg-rose-950 hover:text-rose-300 text-neutral-400 text-xs font-black uppercase border-2 border-[#404040] shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                              title="İsteği İptal Et / Geri Çek"
                            >
                              {actionLoading === item.matchId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <span>İptal Et</span>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t-2  border-[#404040] flex items-center justify-between text-[11px]  text-[#A3A3A3] font-bold">
              <span className="flex items-center gap-1.5">
                <CinemaTrustShieldIcon size={14} className=" text-[#EF4444]" />
                CANLI İZDAŞ AĞI
              </span>
              <span>[ESC] İLE KAPAT</span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

