"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Heart,
  Repeat,
  Check,
  LogIn,
  Loader2,
  Search,
  Calendar,
  Film,
} from "lucide-react";
import {
  CinemaStarIcon,
  MasterpieceLaurelIcon,
  CinemaVerifiedSeal,
  CinemaCheckIcon,
  FilmReelIcon,
} from "@/components/icons/CinemaIcons";
import { MediaItem, WatchLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { createWatchLog } from "@/lib/services/watch-logs.service";
import { WatchDateSelector } from "@/components/ui/WatchDateSelector";
import { localTodayISO } from "@/lib/date";
import { useTranslation } from "@/lib/i18n";
import { translateGenre } from "@/lib/i18n/genres";
import { resolvePosterUrl, applyArtfulPosterFallback } from "@/lib/poster-placeholder";

interface QuickLogModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveLog?: (log: WatchLog) => void;
  onOpenAuth?: () => void;
  onChangeMovie?: () => void;
}

export function QuickLogModal({
  item,
  isOpen,
  onClose,
  onSaveLog,
  onOpenAuth,
  onChangeMovie,
}: QuickLogModalProps) {
  const { t, locale } = useTranslation();
  const { user, profile } = useAuth();
  const [rating, setRating] = useState<number>(8.0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [watchedDate, setWatchedDate] = useState(
    localTodayISO(),
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Reset states and restore draft if exists
  useEffect(() => {
    if (isOpen && item) {
      setRating(
        item.voteAverage
          ? Math.min(10, Math.max(1, Math.round(item.voteAverage)))
          : 8.0,
      );
      setHoverRating(null);
      const savedDraft =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`izledin_log_draft_${item.id}`)
          : null;
      setReview(savedDraft || "");
      setIsFavorite(false);
      setIsRewatch(false);
      setWatchedDate(localTodayISO());
      setErrorMsg(null);
      setSuccessSaved(false);
      setSaving(false);
      setImgError(false);
      // A leftover discard prompt from a previous session of the modal must
      // not swallow ESC/close on reopen.
      setShowDiscardConfirm(false);
    }
  }, [isOpen, item]);

  // Persist draft to sessionStorage whenever review changes; a cleared review
  // must REMOVE the key or the deleted text resurrects on next open.
  useEffect(() => {
    if (!item) return;
    if (review.trim()) {
      sessionStorage.setItem(`izledin_log_draft_${item.id}`, review);
    } else {
      sessionStorage.removeItem(`izledin_log_draft_${item.id}`);
    }
  }, [item, review]);

  // Safe dismiss handler
  const handleSafeClose = () => {
    if (review.trim().length > 20 && !showDiscardConfirm) {
      setShowDiscardConfirm(true);
      return;
    }
    setShowDiscardConfirm(false);
    onClose();
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSafeClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, review, showDiscardConfirm]);

  if (!isOpen || !item) return null;

  const handleSave = async () => {
    if (!user) {
      onOpenAuth?.();
      return;
    }

    if (profile?.isBanned) {
      setErrorMsg(
        `Hesabınız askıya alınmıştır (${profile.banReason || "Topluluk kuralları ihlali"}). Yeni izleme kaydı yazamazsınız.`,
      );
      return;
    }

    // Guard the 600ms success window: `saving` is already false by then, so a
    // second click here would insert a duplicate log.
    if (saving || successSaved) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const result = await createWatchLog({
        userId: user.id,
        mediaId: item.id,
        mediaType: item.type,
        title: item.title,
        year: item.year,
        posterUrl: item.posterPath,
        backdropUrl: item.backdropPath,
        genres: item.genres,
        rating,
        review,
        isFavorite,
        isRewatch,
        status: "watched",
        watchedDate,
      });

      if (result.data) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(`izledin_log_draft_${item.id}`);
        }
        setSuccessSaved(true);
        onSaveLog?.(result.data);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(
          result.error ||
            "Kayıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono overflow-y-auto"
      onClick={handleSafeClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-modal-title"
        className="relative w-full max-w-lg my-auto  bg-[#171717]  text-[#FAFAFA] border-4  border-[#404040] p-5 sm:p-6  shadow-[10px_10px_0px_#000000] space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b-4  border-[#404040] pb-3">
          <div className="flex items-center gap-2">
            <span
              id="quick-log-modal-title"
              className="stamp-badge-solid px-2.5 py-1 text-xs font-black  bg-[#EF4444] text-white border-none  shadow-[2px_2px_0px_#000000]"
            >
              {t.quickLog.title}
            </span>
            <span className="text-xs font-black  text-neutral-400 uppercase hidden sm:inline">
              {t.quickLog.archivePrefix}{(item.id || "26").slice(-4).toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center    bg-neutral-800 hover:bg-[#EF4444] hover:text-[#0A0A0A] border-2  border-[#404040] transition-colors cursor-pointer"
            title={`${t.common.close} (ESC)`}
            aria-label={t.common.close}
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Discard confirmation inline alert */}
        {showDiscardConfirm && (
          <div className="p-3 bg-amber-500/15 border-2 border-amber-600 text-xs font-bold font-mono flex items-center justify-between gap-3 animate-in fade-in">
            <span className=" text-amber-300">
              {t.quickLog.discardNotice}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-2.5 py-1  bg-neutral-800 text-xs font-black uppercase border border-[#0A0A0A]"
              >
                {t.quickLog.keepEditing}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 bg-[#DC2626] text-white text-xs font-black uppercase border border-[#0A0A0A]"
              >
                {t.quickLog.exit}
              </button>
            </div>
          </div>
        )}

        {/* Media Preview Header */}
        <div className="flex gap-3.5 items-center  bg-neutral-800 p-3 border-2  border-[#404040] relative">
          <div className="w-14 sm:w-16 h-20 sm:h-24 bg-neutral-900 border-2  border-[#404040] flex-shrink-0 overflow-hidden">
            <img
              src={resolvePosterUrl(item.posterPath, item.title, item.year, item.genres?.[0])}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                applyArtfulPosterFallback(e, item.title, item.year, item.genres?.[0]);
                setImgError(true);
              }}
            />
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <h3
              className="text-sm sm:text-base font-black font-sans uppercase  text-[#FAFAFA] truncate"
              title={item.title}
            >
              {item.title}
            </h3>
            <p className="text-xs  text-neutral-400 font-bold truncate">
              {item.year || "—"} •{" "}
              {item.genres?.slice(0, 2).map((g) => translateGenre(g, locale)).join(" / ") || (item.type === "tv" ? t.mediaModal.tv : t.mediaModal.movie)}
            </p>
            {item.director && (
              <p className="text-xs  text-[#EF4444] font-black truncate">
                {t.media.director.toUpperCase()}: {item.director.toUpperCase()}
              </p>
            )}
          </div>

          {onChangeMovie && (
            <button
              type="button"
              onClick={() => {
                // Unconditional plain close: the draft is already persisted to
                // sessionStorage, and routing through handleSafeClose() would
                // leave this modal half-open (fighting SearchModal over ESC).
                onClose();
                onChangeMovie();
              }}
              className="px-3 py-2 min-h-[44px]   bg-[#0A0A0A] text-[#EF4444] text-xs font-black uppercase border  border-[#404040]  hover:bg-[#171717] cursor-pointer flex items-center gap-1.5 self-center flex-shrink-0"
              title={t.quickLog.changeMovie}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.quickLog.changeMovie}</span>
            </button>
          )}
        </div>

        {/* Auth prompt if not logged in */}
        {!user && (
          <div className="p-3 bg-amber-50 bg-amber-950/40 border-2 border-amber-500 text-xs font-bold flex items-center justify-between gap-2">
            <span className=" text-amber-300">
              {t.quickLog.authNotice}
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth?.();
              }}
              className="px-3 py-1.5  hover:bg-[#B91C1C] bg-[#EF4444] text-white text-[11px] font-black uppercase border  border-[#404040] cursor-pointer whitespace-nowrap active:translate-x-0.5"
            >
              {t.quickLog.signIn}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 bg-red-950/40 border-2 border-red-500  text-red-400 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {successSaved && (
          <div className="p-3 bg-green-50 bg-green-950/40 border-2 border-green-600  text-green-300 text-xs font-black text-center flex items-center justify-center gap-2">
            <CinemaVerifiedSeal
              size={15}
              className=" text-green-400"
            />
            <span>{t.quickLog.success}</span>
          </div>
        )}

        {/* 1 to 10 Star Rating Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span>{t.quickLog.yourRating}</span>
            <div className="marker-highlight text-sm font-black  text-[#FAFAFA] flex items-center gap-1">
              <CinemaStarIcon size={14} className=" text-[#EF4444]" />
              <span>
                {hoverRating !== null
                  ? hoverRating.toFixed(1)
                  : rating.toFixed(1)}{" "}
                / 10
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1  bg-[#000000] p-2.5 sm:p-3 border-2  border-[#404040] overflow-x-auto scrollbar-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
              const currentScore = hoverRating !== null ? hoverRating : rating;
              const isFilled = currentScore >= starVal;
              return (
                <button
                  key={starVal}
                  type="button"
                  onClick={() => setRating(starVal)}
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                  aria-label={`${starVal}`}
                >
                  <CinemaStarIcon
                    size={22}
                    filled={isFilled}
                    className={
                      isFilled
                        ? " text-[#EF4444]"
                        : " text-[#404040]  hover:text-[#737373]"
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Typewriter Review Textarea */}
        <div className="space-y-1.5">
          <label
            htmlFor="log-review-textarea"
            className="text-xs font-black uppercase  text-[#FAFAFA] block"
          >
            {t.quickLog.reviewLabel}
          </label>
          <textarea
            id="log-review-textarea"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={t.quickLog.reviewPlaceholder}
            rows={3}
            className="w-full  bg-neutral-800  text-[#FAFAFA] placeholder-neutral-500 border-2  border-[#404040] p-3 text-xs font-mono font-bold focus:outline-none  focus:bg-neutral-900 transition-colors"
          />
        </div>

        {/* 35mm İzleme Tarihi Seçici (Bugün / Dün / Özel) */}
        <WatchDateSelector
          value={watchedDate}
          onChange={setWatchedDate}
          label={t.quickLog.watchDate}
        />

        {/* Toggles (Favorite & Rewatch) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2.5 min-h-[44px] border-2  border-[#404040] flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
              isFavorite
                ? " bg-[#EF4444] text-white  shadow-[2px_2px_0px_#000000]"
                : " bg-neutral-800  text-[#FAFAFA] hover:bg-neutral-200"
            }`}
          >
            <Heart className="w-4 h-4 fill-current stroke-[2]" />
            <span>{t.quickLog.favorite}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRewatch(!isRewatch)}
            className={`p-2.5 min-h-[44px] border-2  border-[#404040] flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
              isRewatch
                ? " bg-[#FAFAFA]  text-[#0A0A0A]  shadow-[2px_2px_0px_#000000]"
                : " bg-neutral-800  text-[#FAFAFA] hover:bg-neutral-200"
            }`}
          >
            <Repeat className="w-4 h-4 stroke-[3]" />
            <span>{t.quickLog.rewatch}</span>
          </button>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5   bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-black uppercase tracking-wider border-2  border-[#404040]  shadow-[4px_4px_0px_#000000] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-1 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.quickLog.saving}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.quickLog.save}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
