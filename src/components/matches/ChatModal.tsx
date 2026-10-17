"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  X,
  Send,
  Loader2,
  MessageSquare,
  Film,
  ShieldAlert,
  Check,
  UserX,
  Clapperboard,
} from "lucide-react";
import {
  ClapperboardIcon,
  CinemaPopcornIcon,
  CinemaProjectorIcon,
  CinemaTrophyIcon,
  CinemaFrequencyIcon,
  FilmReelIcon,
  CinemaChatIcon,
  CinemaFriendshipIcon,
  CinemaRomanceIcon,
  CinemaDuoIntentIcon,
  CinemaTrustShieldIcon,
} from "@/components/icons/CinemaIcons";
import { MovieMateMatch, ChatMessage } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { translateGenre } from "@/lib/i18n/genres";
import {
  getMatchMessages,
  sendDirectMessage,
  subscribeToMatchMessages,
} from "@/lib/services/messages.service";
import { requestMatch } from "@/lib/services/matches.service";
import { submitUserReport } from "@/lib/services/reports.service";
import {
  markMatchMessagesAsRead,
  acceptMatchRequest,
  rejectMatchRequest,
} from "@/lib/services/inbox.service";

// S14 ORTAK SEANS — panel + premium upsell are code-split so every chat-only
// visitor does not pay for them.
const WatchTogetherPanel = dynamic(
  () => import("./WatchTogetherPanel").then((m) => m.WatchTogetherPanel),
  { ssr: false },
);
const PremiumModal = dynamic(
  () =>
    import("@/components/premium/PremiumModal").then((m) => m.PremiumModal),
  { ssr: false },
);

interface ChatModalProps {
  match: MovieMateMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  onRequestSent?: (match: MovieMateMatch) => void;
}

const ICEBREAKER_ICONS = [
  ClapperboardIcon,
  CinemaPopcornIcon,
  CinemaProjectorIcon,
  CinemaTrophyIcon,
];

export function ChatModal({
  match,
  isOpen,
  onClose,
  onOpenAuth,
  onRequestSent,
}: ChatModalProps) {
  const { t, locale } = useTranslation();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string>("");
  const [currentMatchStatus, setCurrentMatchStatus] = useState<
    "pending" | "matched" | "passed" | "blocked"
  >("pending");
  const [initiatorId, setInitiatorId] = useState<string | undefined>(undefined);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("intent_breach");
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // S14 ORTAK SEANS tab — only rendered for matched conversations.
  const [activeTab, setActiveTab] = useState<"chat" | "seans">("chat");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const intent = match?.user?.matchIntent || match?.intent || "friend";

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (!isOpen || !match) return;

    // Stale-fetch guard: opening convo A then quickly B used to let A's late
    // response paint B's header with A's history.
    let cancelled = false;

    setActiveMatchId(match.id);
    setCurrentMatchStatus(
      match.status ||
        (match.id.startsWith("prospective_") ? "pending" : "matched"),
    );
    setInitiatorId(match.initiatorId);
    setSendError(null);
    setActionError(null);
    setActiveTab("chat");
    setLoading(true);

    if (user?.id && !match.id.startsWith("prospective_")) {
      markMatchMessagesAsRead(match.id, user.id).then((ok) => {
        if (!ok)
          console.warn("Mesajlar okundu olarak işaretlenemedi:", match.id);
      });
    }

    getMatchMessages(match.id)
      .then((msgs) => {
        if (cancelled) return; // a newer conversation took over
        setMessages(msgs);
        setTimeout(() => scrollToBottom("auto"), 50);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, match?.id, user?.id]);

  // Realtime subscription follows activeMatchId instead of the initial match
  // prop: when the first intro converts a prospective_* id into a real match
  // id, this effect resubscribes so the partner's replies arrive live.
  useEffect(() => {
    if (
      !isOpen ||
      !activeMatchId ||
      activeMatchId.startsWith("prospective_")
    )
      return;

    const unsubscribe = subscribeToMatchMessages(activeMatchId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      // Messages arriving while the chat is open count as read immediately,
      // otherwise the unread badge never clears (Bug #2).
      if (user?.id && newMsg.senderId !== user.id) {
        markMatchMessagesAsRead(activeMatchId, user.id).then((ok) => {
          if (!ok)
            console.warn(
              "Mesajlar okundu olarak işaretlenemedi:",
              activeMatchId,
            );
        });
      }
      setTimeout(() => scrollToBottom("smooth"), 50);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, activeMatchId, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isReportOpen) {
          setIsReportOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isReportOpen, onClose]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, loading]);

  if (!isOpen || !match) return null;

  // Request State Calculations
  const isPendingForMe =
    currentMatchStatus === "pending" &&
    Boolean(initiatorId && user && initiatorId !== user.id);
  const isPendingFromMe =
    currentMatchStatus === "pending" &&
    Boolean(
      (initiatorId && user && initiatorId === user.id) ||
      (!initiatorId && !match.id.startsWith("prospective_")),
    );

  // Mirror of the messages INSERT policy: pending requests are initiator-only
  // (the receiver is blocked entirely until they accept), passed/blocked
  // conversations are closed to everyone, and the initiator gets exactly ONE
  // intro while the request is still pending.
  const conversationClosed =
    currentMatchStatus === "passed" || currentMatchStatus === "blocked";
  const canCompose =
    !isPendingForMe &&
    !conversationClosed &&
    !(isPendingFromMe && messages.length > 0);

  const handleAcceptRequest = async () => {
    if (!activeMatchId || activeMatchId.startsWith("prospective_")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await acceptMatchRequest(activeMatchId);
      if (result.success) {
        setCurrentMatchStatus("matched");
      } else {
        setActionError(
          result.error || "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!activeMatchId || activeMatchId.startsWith("prospective_")) {
      onClose();
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await rejectMatchRequest(activeMatchId);
      if (result.success) {
        onClose();
      } else {
        // Keep the modal open — closing would pretend the pass succeeded.
        setActionError(
          result.error || "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const sendMessageContent = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    if (!user) {
      onOpenAuth?.();
      return;
    }

    if (profile?.isBanned) {
      alert(
        `Hesabınız askıya alınmıştır (${profile.banReason || "Topluluk kuralları ihlali"}). Mesaj gönderemezsiniz.`,
      );
      return;
    }

    // Hard stop mirroring the INSERT policy — icebreaker buttons bypass the
    // disabled composer, so guard here too.
    if (
      isPendingForMe ||
      conversationClosed ||
      (isPendingFromMe && messages.length > 0)
    ) {
      return;
    }

    const messageContent = textToSend.trim();
    setInput("");
    setSendError(null);
    setSending(true);

    let matchIdToUse = activeMatchId;

    // If this is a prospective match, create as a 'pending' match request
    if (matchIdToUse.startsWith("prospective_")) {
      const created = await requestMatch(
        user.id,
        match.user.id,
        "pending",
        match.compatibilityScore,
        match.sharedGenres,
        match.sharedTitles,
      );
      if (created.ok && created.matchId) {
        matchIdToUse = created.matchId;
        setActiveMatchId(created.matchId);
        setCurrentMatchStatus("pending");
        setInitiatorId(user.id);
      } else {
        // Never send against the prospective id — the insert would just fail.
        setInput(messageContent);
        setSendError(
          created.rejected
            ? "Bu eşleşme daha önce reddedilmiş. Yeni bir mesaj isteği gönderilemedi."
            : "Mesaj isteği oluşturulamadı. Bağlantınızı kontrol edip tekrar deneyin.",
        );
        setSending(false);
        return;
      }
    }

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      matchId: matchIdToUse,
      senderId: user.id,
      content: messageContent,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 30);

    const sent = await sendDirectMessage(matchIdToUse, user.id, messageContent);
    if (sent.data) {
      // Drop BOTH the optimistic bubble and the realtime echo (which carries
      // the real id and may land before this HTTP response) before appending,
      // or the message renders twice with colliding React keys.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId && m.id !== sent.data!.id),
        sent.data!,
      ]);
      onRequestSent?.(match);
    } else {
      // Never leave a phantom bubble: the write failed (network, ban, rate
      // limit). Remove the optimistic message and tell the user.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(messageContent);
      if (profile?.isBanned) {
        setSendError(
          `Hesabınız askıya alınmış durumda — mesaj gönderilemedi (${profile.banReason || "topluluk ihlali"}).`,
        );
      } else {
        setSendError(
          sent.error ||
            "Mesaj gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.",
        );
      }
    }
    setSending(false);
  };

  const handleSend = () => {
    sendMessageContent(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div
        className="w-full sm:max-w-lg  bg-[#171717]  text-[#FAFAFA] border-t-4 sm:border-4  border-[#404040]   shadow-[0px_-4px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] flex flex-col h-[85vh] sm:h-[600px] max-h-[92vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-3.5 sm:p-4 border-b-4  border-[#404040]  bg-[#262626] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 overflow-hidden border-2  border-[#404040] bg-[#0A0A0A] flex-shrink-0">
              <img
                src={match.user.avatarUrl}
                alt={match.user.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black uppercase  text-[#FAFAFA] truncate font-sans">
                {match.user.fullName}
              </h3>
              <div className="flex items-center gap-2 text-[10px]  text-[#A3A3A3] font-bold">
                <span className="truncate">@{match.user.username}</span>
                <span>•</span>
                <span className=" text-[#EF4444] font-black flex-shrink-0">
                  %{match.compatibilityScore} {t.matches.compatScore}
                </span>
                {match.isBilet && initiatorId !== user?.id && (
                  <>
                    <span>•</span>
                    <span
                      className=" text-[#F59E0B] font-black flex-shrink-0"
                      title={t.matches.ticketBadge}
                    >
                      {t.matches.ticketBadge}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center  bg-[#171717]   hover:bg-[#EF4444] hover:text-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex-shrink-0"
            title={t.common.close}
            aria-label={t.common.close}
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Safety & Intent Reminder Banner */}
        {intent === "friend" && (
          <div className="px-3 py-2 bg-emerald-500/10 border-b-2 border-emerald-600/30  text-emerald-300 text-[10px] font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <CinemaFriendshipIcon
                size={14}
                className=" text-emerald-400 shrink-0"
              />
              <span className="truncate">
                <strong>{t.matches.friendIntent}:</strong> {t.chat.friendBanner}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="text-[10px] font-black uppercase  text-amber-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer min-h-[32px]"
              title={t.chat.reportBreach}
            >
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>{t.chat.reportBreach}</span>
            </button>
          </div>
        )}

        {intent === "dating" && (
          <div className="px-3 py-2 bg-rose-500/10 border-b-2 border-rose-600/30  text-rose-300 text-[10px] font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <CinemaRomanceIcon
                size={14}
                className=" text-rose-400 shrink-0"
              />
              <span className="truncate">
                <strong>{t.matches.datingIntent}:</strong> {t.chat.datingBanner}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="text-[10px] font-black uppercase  text-amber-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer min-h-[32px]"
              title={t.chat.reportBreach}
            >
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>{t.chat.reportBreach}</span>
            </button>
          </div>
        )}

        {intent === "both" && (
          <div className="px-3 py-2 bg-amber-500/10 border-b-2 border-amber-600/30  text-amber-300 text-[10px] font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <CinemaDuoIntentIcon
                size={14}
                className=" text-amber-400 shrink-0"
              />
              <span className="truncate">
                <strong>{t.matches.bothIntent}:</strong> {t.chat.bothBanner}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="text-[10px] font-black uppercase  text-amber-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer min-h-[32px]"
              title={t.chat.reportBreach}
            >
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>{t.chat.reportBreach}</span>
            </button>
          </div>
        )}

        {/* RECIPIENT PENDING REQUEST BANNER */}
        {isPendingForMe && (
          <div className="p-3  bg-amber-500/10 border-b-2 border-amber-600 flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black  text-amber-400 uppercase tracking-wide block">
                {t.chat.incomingRequestBanner}
              </span>
              <p className="text-[11px]  text-neutral-300 truncate mt-0.5">
                @{match.user.username} {t.chat.incomingRequestDesc}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAcceptRequest}
                disabled={actionLoading}
                className="px-3.5 py-2 min-h-[40px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border border-[#0A0A0A] shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>{t.chat.accept}</span>
              </button>
              <button
                type="button"
                onClick={handleRejectRequest}
                disabled={actionLoading}
                className="px-3 py-2 min-h-[40px]   bg-neutral-800 hover:bg-neutral-700  text-neutral-200 text-xs font-black uppercase border border-[#0A0A0A] cursor-pointer"
              >
                <span>{t.chat.pass}</span>
              </button>
            </div>
          </div>
        )}

        {/* SENDER PENDING REQUEST BANNER */}
        {isPendingFromMe && (
          <div className="px-3 py-2 bg-amber-500/10 border-b-2 border-amber-600/30 text-[11px]  text-amber-300 font-bold flex items-center gap-2">
            <CinemaTrustShieldIcon
              size={15}
              className=" text-amber-400 shrink-0"
            />
            <span>
              {t.chat.requestSentNotice}
            </span>
          </div>
        )}

        {/* Accept / Pass failure notice (match_respond RPC) */}
        {actionError && (
          <div className="px-3 py-2 bg-rose-500/10 border-b-2 border-rose-600/40 text-[11px] font-bold text-rose-300 flex items-center justify-between gap-2">
            <span className="truncate">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 cursor-pointer shrink-0"
              aria-label="Uyarıyı kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Deterrent Report & Safety Modal */}
        {isReportOpen && (
          <div className="absolute inset-0 z-50 bg-black/90 p-5 flex flex-col justify-center animate-in fade-in duration-150 font-mono text-xs">
            {reportSuccess ? (
              <div className="p-6 bg-emerald-500/10 border-4 border-emerald-600 text-center space-y-3">
                <Check className="w-10 h-10  text-emerald-400 mx-auto stroke-[3]" />
                <h4 className="text-sm font-black uppercase  text-emerald-300">
                  BİLDİRİM DURUMU
                </h4>
                <p className="text-neutral-300 text-[11px] whitespace-pre-line">
                  {reportSuccess}
                </p>
              </div>
            ) : (
              <div className="bg-[#171717] border-4 border-[#DC2626] p-5 space-y-4 text-white shadow-[6px_6px_0px_#000000]">
                <div className="flex items-start justify-between border-b-2 border-neutral-700 pb-2">
                  <div className="flex items-center gap-2 text-rose-500 font-black uppercase text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>NİYET İHLALİ & GÜVENLİK BİLDİRİMİ</span>
                  </div>
                  <button
                    onClick={() => setIsReportOpen(false)}
                    aria-label="Bildirimi Kapat"
                    className="p-1 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-neutral-300">
                  @{match.user.username} adlı kullanıcıyı bildirme gerekçenizi
                  seçin. Sahte niyet beyanları topluluktan men edilme sebebidir:
                </p>

                <div className="space-y-2">
                  {[
                    {
                      id: "intent_breach",
                      label:
                        "“Film Arkadaşı” seçmesine rağmen flört/rahatsız edici mesaj attı",
                    },
                    {
                      id: "false_profile",
                      label:
                        "Profil bilgileri ve niyet beyanı gerçeği yansıtmıyor",
                    },
                    {
                      id: "harassment",
                      label:
                        "Saygısız, saldırgan veya sinema dışı ısrarcı tutum",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setReportReason(opt.id)}
                      className={`p-2.5 border-2 flex items-center gap-2 cursor-pointer transition-all ${
                        reportReason === opt.id
                          ? "border-[#DC2626] bg-[#DC2626]/10 text-white font-black"
                          : "border-neutral-700 hover:border-neutral-500 text-neutral-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        checked={reportReason === opt.id}
                        onChange={() => setReportReason(opt.id)}
                        className="accent-[#DC2626]"
                      />
                      <span className="text-[11px]">{opt.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3 py-1.5 border border-neutral-600 text-neutral-300 font-black text-xs uppercase cursor-pointer"
                  >
                    İPTAL
                  </button>
                  {reportError && (
                    <p className="text-[11px] font-black text-rose-400 mr-auto">
                      {reportError}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={reportSubmitting}
                    onClick={async () => {
                      if (!user || !match || reportSubmitting) return;
                      setReportError(null);
                      setReportSubmitting(true);
                      try {
                        const result = await submitUserReport(
                          match.user.id,
                          reportReason as
                            | "intent_breach"
                            | "false_profile"
                            | "harassment",
                          activeMatchId.startsWith("prospective_")
                            ? undefined
                            : activeMatchId,
                        );
                        if (!result) {
                          throw new Error("submit failed");
                        }
                        let notice =
                          "Bildiriminiz alındı. Bu eşleşme sonlandırıldı.";
                        if (!result.accepted) {
                          notice =
                            "Bu kullanıcı için zaten bir bildiriminiz kayıtlı.";
                        } else if (result.targetBlocked) {
                          notice +=
                            "\nKullanıcı tekrarlayan ihlaller nedeniyle otomatik olarak askıya alındı.";
                        }
                        setReportSuccess(notice);
                        setTimeout(() => {
                          setReportSuccess(null);
                          setIsReportOpen(false);
                          onClose();
                        }, 1400);
                      } catch {
                        setReportError(
                          "Bildirim gönderilemedi. Lütfen tekrar deneyin.",
                        );
                      } finally {
                        setReportSubmitting(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs uppercase border-2 border-white shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {reportSubmitting && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    BİLDİR VE ENGELLE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* S14 ORTAK SEANS tab strip — matched conversations only (RLS gates
            the underlying table to matched pairs, so pending chats never see
            the tab) */}
        {currentMatchStatus === "matched" && (
          <div
            className="flex border-b-2 border-[#404040] bg-[#262626] shrink-0"
            role="tablist"
            aria-label={t.chat.chatTab}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "chat"}
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-3 py-2.5 min-h-[44px] flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider border-b-4 transition-colors cursor-pointer ${
                activeTab === "chat"
                  ? "border-[#EF4444] text-[#FAFAFA]"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <CinemaChatIcon size={14} />
              <span>{t.chat.chatTab}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "seans"}
              onClick={() => setActiveTab("seans")}
              className={`flex-1 px-3 py-2.5 min-h-[44px] flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider border-b-4 transition-colors cursor-pointer ${
                activeTab === "seans"
                  ? "border-[#EF4444] text-[#FAFAFA]"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>{t.chat.watchTogetherTab}</span>
            </button>
          </div>
        )}

        {/* Messages Body */}
        {(activeTab === "chat" || currentMatchStatus !== "matched") && (
        <div
          ref={scrollContainerRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#171717]"
        >
          {/* Cinema Match Badge Banner */}
          <div className="p-2.5 bg-[#262626] border-2 border-[#404040] text-[11px] text-center text-[#D4D4D4] font-bold shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[#EF4444] font-black flex items-center gap-1">
              <CinemaFrequencyIcon
                size={14}
                className="text-[#EF4444]"
              />
              <span>{t.chat.frequencyLabel}:</span>
            </span>
            <span>
              {match.sharedGenres.length > 0 ? (
                locale === "tr" ? (
                  <>
                    {match.sharedGenres.slice(0, 2).map((g) => translateGenre(g, locale)).join(" & ")}{" "}
                    kategorisinde %{match.compatibilityScore} ortak zevke
                    sahipsiniz.
                  </>
                ) : (
                  <>
                    You share {match.compatibilityScore}% cinema taste in{" "}
                    {match.sharedGenres.slice(0, 2).map((g) => translateGenre(g, locale)).join(" & ")}.
                  </>
                )
              ) : (
                locale === "tr" ? (
                  <>%{match.compatibilityScore} ortak sinema frekansına sahipsiniz.</>
                ) : (
                  <>You share {match.compatibilityScore}% cine match frequency.</>
                )
              )}
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#A3A3A3]">
              <Loader2 className="w-6 h-6 animate-spin text-[#EF4444]" />
              <span>{t.chat.connecting}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-none bg-[#EF4444]/15 border-2 border-[#EF4444] mx-auto flex items-center justify-center text-[#EF4444]">
                <CinemaChatIcon
                  size={24}
                  className="text-[#EF4444]"
                />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#FAFAFA]">
                  {t.chat.noMessages}
                </p>
                <p className="text-[11px] text-[#A3A3A3] mt-0.5 font-sans font-medium">
                  {t.chat.icebreakerPrompt}
                </p>
              </div>

              {/* Quick Cinema Icebreakers */}
              <div className="grid grid-cols-1 gap-2 text-left pt-1">
                {t.chat.icebreakers.map((text, i) => {
                  const Icon = ICEBREAKER_ICONS[i % ICEBREAKER_ICONS.length];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessageContent(text)}
                      disabled={!canCompose || sending}
                      aria-label={text}
                      className="p-3 min-h-[44px] bg-[#262626] hover:bg-[#333333] border-2 border-[#404040] shadow-[2px_2px_0px_#000000] text-xs font-bold text-[#FAFAFA] text-left transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#262626]"
                    >
                      <Icon
                        size={16}
                        className="text-[#EF4444] shrink-0"
                      />
                      <span className="flex-1 leading-snug">
                        {text}
                      </span>
                      <Send className="w-3.5 h-3.5 text-[#737373] hover:text-[#EF4444] flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              // Sender ids are real auth UUIDs from the messages table; the
              // legacy placeholder-sender comparison was dead code.
              const isMe = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-150 ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 text-xs font-medium border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] break-words break-all sm:break-words whitespace-pre-wrap ${
                      isMe
                        ? "  bg-[#EF4444] text-[#0A0A0A] font-bold"
                        : "  bg-[#262626] text-[#FAFAFA]"
                    }`}
                  >
                    <p className="leading-relaxed font-sans">{msg.content}</p>
                  </div>
                  <span className="text-[10px]  text-[#A3A3A3] mt-1 font-mono font-medium">
                    {msg.createdAt}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        )}

        {/* S14 ORTAK SEANS panel — replaces the message body on the seans tab.
            Free members see the anchor teaser inside the panel itself. */}
        {currentMatchStatus === "matched" && activeTab === "seans" && match && user && (
          <WatchTogetherPanel
            match={match}
            currentUserId={user.id}
            isPremium={Boolean(profile?.isPremium)}
            onUpgradeClick={() => setIsPremiumModalOpen(true)}
          />
        )}

        {/* Send failure notice */}
        {sendError && activeTab === "chat" && (
          <div className="px-3 py-2 bg-rose-500/10 border-t-2 border-rose-600/40 text-[11px] font-bold text-rose-300 flex items-center justify-between gap-2">
            <span className="truncate">{sendError}</span>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 cursor-pointer shrink-0"
              aria-label="Uyarıyı kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar or Pending Notice — chat tab only; the seans tab fills
            the whole body height with its own scroll area */}
        {activeTab === "chat" && (isPendingFromMe && messages.length > 0 ? (
          <div className="p-3.5 pb-safe border-t-4 border-[#404040] bg-[#171717] flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#FAFAFA] text-center">
            <CinemaTrustShieldIcon size={16} className="text-[#EF4444] shrink-0" />
            <span>
              {locale === "tr"
                ? `Mesaj isteğiniz iletildi. @${match.user.username} onayladığında sohbet aktifleşecektir.`
                : `Message request sent. Chat will activate once @${match.user.username} approves.`}
            </span>
          </div>
        ) : isPendingForMe ? (
          <div className="p-3.5 pb-safe border-t-4 border-[#404040] bg-[#171717] flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#FAFAFA] text-center">
            <CinemaTrustShieldIcon size={16} className="text-amber-400 shrink-0" />
            <span>
              {locale === "tr"
                ? "Mesaj yazmak için lütfen yukarıdaki panelden isteği kabul edin."
                : "Please accept the request from the panel above to start messaging."}
            </span>
          </div>
        ) : conversationClosed ? (
          <div className="p-3.5 pb-safe border-t-4 border-[#404040] bg-[#171717] flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#A3A3A3] text-center">
            <span>{t.chat.closedNotice}</span>
          </div>
        ) : (
          <div className="p-3 pb-safe border-t-4 border-[#404040] bg-[#262626] flex items-center gap-2">
            <input
              type="text"
              value={input}
              maxLength={500}
              aria-label={t.chat.inputPlaceholder}
              disabled={!canCompose}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                !user
                  ? t.chat.loginToMessage
                  : t.chat.inputPlaceholder
              }
              className="flex-1 h-11 min-h-[44px] bg-[#171717] text-xs font-bold text-[#FAFAFA] placeholder-[#737373] border-2 border-[#404040] px-3 py-2 focus:outline-none focus:border-[#EF4444] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || !canCompose}
              className="h-11 min-h-[44px] min-w-[44px] px-3.5 bg-[#EF4444] hover:bg-[#DC2626] text-[#0A0A0A] border-2 border-[#404040] shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center flex-shrink-0"
              title={t.chat.send}
              aria-label={t.chat.send}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        ))}

        {/* S14 premium anchor — upsell layer for the ORTAK SEANS teaser */}
        <PremiumModal
          isOpen={isPremiumModalOpen}
          onClose={() => setIsPremiumModalOpen(false)}
        />
      </div>
    </div>
  );
}
