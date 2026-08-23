"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Star,
  Plus,
  Bookmark,
  Check,
  Film,
  Calendar,
  Clock,
  Award,
  Users,
  Play,
  ExternalLink,
  Share2,
  Loader2,
} from "lucide-react";
import { MediaItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  toggleWatchlistItem,
  getMyMediaStatus,
} from "@/lib/services/watch-logs.service";

interface MediaDetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLog?: (item: MediaItem) => void;
  onOpenTasteProfiler?: () => void;
}

export function MediaDetailModal({
  item,
  isOpen,
  onClose,
  onOpenLog,
  onOpenTasteProfiler,
}: MediaDetailModalProps) {
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [synopsisLang, setSynopsisLang] = useState<"tr" | "en">("tr");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [togglingWatchlist, setTogglingWatchlist] = useState(false);
  const [actionHint, setActionHint] = useState<string | null>(null);

  const { user } = useAuth();
  const userId = user?.id;

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset local state and load the item's TRUE persistence state per open.
  // Stale-guarded so a slow fetch for a previous movie can never paint over
  // the current one.
  useEffect(() => {
    setImgError(false);
    setCopied(false);
    setSynopsisLang("tr");
    setActionHint(null);
    setIsWatchlist(false);
    setIsWatched(false);
    setStatusError(false);
    setStatusLoading(false);

    if (!isOpen || !item || !userId) return;

    let stale = false;
    setStatusLoading(true);
    getMyMediaStatus(userId, item.id)
      .then((status) => {
        if (!stale) {
          setIsWatchlist(status.watchlisted);
          setIsWatched(status.logged);
        }
      })
      .catch(() => {
        // No fake success: buttons that need DB truth are disabled below.
        if (!stale) setStatusError(true);
      })
      .finally(() => {
        if (!stale) setStatusLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [isOpen, item, userId]);

  if (!isOpen || !item) return null;

  const ratingFormatted =
    typeof item.voteAverage === "number" && item.voteAverage > 0
      ? item.voteAverage.toFixed(1)
      : null;

  const typeLabel =
    item.type === "anime"
      ? "Anime"
      : item.type === "tv"
        ? "Dizi"
        : "Sinema Filmi";

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/film/${item.id}`;

    // Check if Web Share API is available (usually on mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.title} - İzledin`,
          text: `${item.title} filmini Sinefil Kulübü'nde incele!`,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback to clipboard if share was canceled or failed
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } else if (navigator.clipboard) {
      // Fallback for desktop devices without Web Share API
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // İZLEDİM routes into the REAL logging flow (QuickLogModal) through the
  // same callback the primary CTA uses — it never claims a save by itself.
  const handleMarkWatched = () => {
    if (!item) return;
    onClose();
    onOpenLog?.(item);
  };

  // LİSTEYE EKLE toggles a real watch_logs row with status='watchlist'.
  const handleToggleWatchlist = async () => {
    if (!item || togglingWatchlist) return;
    if (!userId) {
      setActionHint("LİSTEYE EKLEMEK İÇİN GİRİŞ YAPMALISINIZ.");
      return;
    }
    setActionHint(null);
    setTogglingWatchlist(true);
    try {
      const res = await toggleWatchlistItem(userId, item);
      setIsWatchlist(res.added);
    } catch (err) {
      console.warn("Watchlist toggle failed:", err);
      setActionHint(
        "LİSTE GÜNCELLENİRKEN BİR HATA OLUŞTU. LÜTFEN TEKRAR DENEYİN.",
      );
    } finally {
      setTogglingWatchlist(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto  bg-[#171717]  text-[#FAFAFA] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-5 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-4  border-[#404040] pb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="stamp-badge-solid px-2.5 py-1 text-xs font-black  bg-[#EF4444] text-white border-2  border-[#404040]">
              {typeLabel.toUpperCase()}
            </span>
            <span className="font-mono text-xs font-bold  text-neutral-400">
              #ARŞİV-{(item.id || "").slice(-4).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              title="Paylaş"
              className="p-1.5   bg-neutral-800 hover:bg-neutral-700 border-2  border-[#404040] transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {copied ? "KOPYALANDI" : "PAYLAŞ"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5   bg-neutral-800 hover:bg-neutral-700 border-2  border-[#404040] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Content Section: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Poster / Visual */}
          <div className="md:col-span-4 space-y-3">
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0A0A0A] border-3  border-[#404040]  shadow-[4px_4px_0px_#000000]">
              {!imgError && (item.posterPath || item.backdropPath) ? (
                <img
                  src={item.posterPath || item.backdropPath}
                  alt={item.title}
                  className="w-full h-full object-cover filter contrast-105"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-neutral-900 text-neutral-300 space-y-2">
                  <Film className="w-10 h-10 text-[#DC2626] stroke-[2]" />
                  <span className="font-mono text-xs font-black uppercase line-clamp-2">
                    {item.title}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Watchlist / Watched Toggles */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={handleMarkWatched}
                title="Günlüğe kaydetmek için puanlama ekranını açar"
                className={`py-2 px-2 border-2  border-[#404040] font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                  isWatched
                    ? "  bg-[#FAFAFA] text-[#0A0A0A]"
                    : " bg-neutral-800  text-[#FAFAFA] hover:bg-neutral-200"
                }`}
              >
                {statusLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>{isWatched ? "İZLENDİ" : "İZLEDİM"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWatchlist}
                disabled={
                  statusLoading || togglingWatchlist || statusError
                }
                title={
                  statusError
                    ? "Durum bilgisi yüklenemediği için liste güncellenemiyor"
                    : undefined
                }
                className={`py-2 px-2 border-2  border-[#404040] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isWatchlist
                    ? " text-white bg-[#EF4444]"
                    : " bg-neutral-800  text-[#FAFAFA] hover:bg-neutral-200"
                } ${statusLoading || togglingWatchlist || statusError ? "" : "cursor-pointer"}`}
              >
                {togglingWatchlist ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isWatchlist ? "LİSTEDE" : "LİSTEYE EKLE"}</span>
              </button>

              {(statusError || actionHint) && (
                <p className="col-span-2 mt-0.5 text-[10px] leading-snug font-bold uppercase tracking-wide text-[#FBBF24]">
                  {statusError
                    ? "DURUM BİLGİSİ YÜKLENEMEDİ — LİSTE DURUMU DOĞRULANAMAZ"
                    : actionHint}
                </p>
              )}
            </div>
          </div>

          {/* Right Editorial Info */}
          <div className="md:col-span-8 space-y-4 font-mono">
            {/* Badges strip */}
            <div className="flex items-center gap-2 flex-wrap">
              {ratingFormatted && (
              <span className="px-2.5 py-1 bg-[#F59E0B] text-[#0A0A0A] text-xs font-black flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>IMDb: {ratingFormatted}/10</span>
                {item.imdbVotes && (
                  <span className="text-[10px] opacity-80">
                    ({item.imdbVotes})
                  </span>
                )}
              </span>
              )}

              {item.year && (
                <span className="px-2 py-1  bg-neutral-800  text-[#FAFAFA] text-xs font-bold border  border-neutral-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{item.year}</span>
                </span>
              )}

              {item.duration && (
                <span className="px-2 py-1  bg-neutral-800  text-[#FAFAFA] text-xs font-bold border  border-neutral-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.duration}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight  text-[#FAFAFA] leading-tight">
                {item.title}
              </h2>
              {item.originalTitle && item.originalTitle !== item.title && (
                <p className="text-xs  text-neutral-400 font-mono italic mt-0.5">
                  Orijinal: {item.originalTitle}
                </p>
              )}
            </div>

            {/* Genres */}
            {item.genres && item.genres.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.genres.map((g) => (
                  <span
                    key={g}
                    className="stamp-badge px-2 py-0.5 text-[10px] font-black  border-[#404040]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Awards */}
            {item.awards && (
              <div className="text-xs font-black  text-[#FBBF24] flex items-center gap-1.5">
                <Award className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-2">{item.awards}</span>
              </div>
            )}

            {/* Director & Cast */}
            <div className="space-y-1 text-xs">
              {item.director && (
                <p className=" text-neutral-300 font-bold">
                  <span className=" text-[#EF4444] font-black">
                    YÖNETMEN:{" "}
                  </span>
                  {item.director}
                </p>
              )}
              {item.actors && (
                <p className=" text-neutral-300 font-bold">
                  <span className=" text-[#EF4444] font-black">
                    OYUNCULAR:{" "}
                  </span>
                  {item.actors}
                </p>
              )}
            </div>

            {/* Synopsis with Language Switcher */}
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[11px] font-black  text-neutral-400 uppercase">
                <span>ÖZET</span>
                {item.overviewEn && item.overviewEn !== item.overview && (
                  <div className="flex items-center border  border-[#404040] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSynopsisLang("tr")}
                      className={`px-2 py-0.5 text-[10px] font-black cursor-pointer transition-colors ${
                        synopsisLang === "tr"
                          ? "bg-[#DC2626] text-white"
                          : " bg-neutral-800  text-neutral-300"
                      }`}
                    >
                      TR
                    </button>
                    <button
                      type="button"
                      onClick={() => setSynopsisLang("en")}
                      className={`px-2 py-0.5 text-[10px] font-black cursor-pointer transition-colors ${
                        synopsisLang === "en"
                          ? "bg-[#DC2626] text-white"
                          : " bg-neutral-800  text-neutral-300"
                      }`}
                    >
                      EN
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3 bg-neutral-100 bg-neutral-800/80 border-2  border-neutral-700 text-xs sm:text-sm  text-neutral-200 font-sans leading-relaxed">
                <p className="line-clamp-6 font-medium">
                  &ldquo;
                  {synopsisLang === "en"
                    ? item.overviewEn
                    : item.overview ||
                      "Bu yapım hakkında henüz ayrıntılı özet eklenmedi."}
                  &rdquo;
                </p>
              </div>
            </div>

            {/* Streaming Availability */}
            {item.streamingOn && item.streamingOn.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-black  text-neutral-400">
                  YAYINLANDIĞI PLATFORM:
                </span>
                {item.streamingOn.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-0.5   bg-[#FAFAFA] text-[#0A0A0A] text-[10px] font-black uppercase"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            )}

            {/* Primary CTAs */}
            <div className="pt-3 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLog?.(item);
                }}
                className="px-5 py-3   bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-1 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>İzledim & Günlüğe Yaz</span>
              </button>

              {onOpenTasteProfiler && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTasteProfiler();
                  }}
                  className="px-4 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] text-xs font-black uppercase tracking-wider border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] hover:shadow-[1px_1px_0px_#0A0A0A] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 stroke-[2.5]" />
                  <span>Sinema Eşi Bul</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
