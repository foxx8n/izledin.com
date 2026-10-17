"use client";

import React, { useRef, useState, useCallback } from "react";
import { X, Heart, Info } from "lucide-react";
import { ClapperboardIcon } from "@/components/icons/CinemaIcons";
import type { MediaItem } from "@/types";
import { useTranslation } from "@/lib/i18n/context";

interface MediaSwipeCardProps {
  item: MediaItem;
  nextItem?: MediaItem;
  isWatchlisted?: boolean;
  onLike: (item: MediaItem) => void;
  onPass: (item: MediaItem) => void;
  onDetail: (item: MediaItem) => void;
}

const SWIPE_THRESHOLD = 0.28;
const SWIPE_EXIT_DISTANCE = 1.25;

function triggerHaptic(pattern: number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * PERDE title card — the media variant of the SwipeMatchCard drag engine
 * (S5). Both directions persist to title_swipes only: SEVDİM is a matching
 * signal, never a diary entry (owner ruling) — list management lives in KEŞİF.
 */
export function MediaSwipeCard({
  item,
  nextItem,
  isWatchlisted,
  onLike,
  onPass,
  onDetail,
}: MediaSwipeCardProps) {
  const { t, locale } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, isDragging: false });
  const [dragX, setDragX] = useState(0);
  const [isExiting, setIsExiting] = useState<"pass" | "like" | null>(null);

  const direction = dragX < -10 ? "pass" : dragX > 10 ? "like" : null;
  const dragProgress = cardRef.current
    ? Math.abs(dragX) / (cardRef.current.offsetWidth * SWIPE_THRESHOLD)
    : 0;
  const overlayVisible = Math.abs(dragX) > 18;
  const rotation = (dragX / (cardRef.current?.offsetWidth || 400)) * 10;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isExiting) return;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.isDragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isExiting]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (Math.abs(dy) > Math.abs(dx) * 1.6 && Math.abs(dx) < 20) return;
    setDragX(dx);
    cardRef.current?.classList.add("is-dragging");
  }, []);

  const finish = useCallback(
    (dir: "pass" | "like") => {
      triggerHaptic([15]);
      setIsExiting(dir);
      setDragX(
        dir === "pass"
          ? -window.innerWidth * SWIPE_EXIT_DISTANCE
          : window.innerWidth * SWIPE_EXIT_DISTANCE,
      );
      setTimeout(() => {
        if (dir === "pass") onPass(item);
        else onLike(item);
        setIsExiting(null);
        setDragX(0);
      }, 260);
    },
    [item, onLike, onPass],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds.isDragging) return;
      ds.isDragging = false;
      cardRef.current?.classList.remove("is-dragging");
      const cardWidth = cardRef.current?.offsetWidth || 400;
      const dx = e.clientX - ds.startX;
      if (Math.abs(dx) / cardWidth >= SWIPE_THRESHOLD) {
        finish(dx < 0 ? "pass" : "like");
      } else {
        setDragX(0);
      }
    },
    [finish],
  );

  const posterSrc =
    imgError
      ? item.backdropPath || item.posterPath
      : item.posterPath || item.backdropPath;

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ perspective: "1000px" }}>
      {nextItem && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ transform: "translateY(10px) scale(0.96)", zIndex: 0 }}
        >
          <div className="bg-[#171717] border-2 border-[#404040] p-3 opacity-50 font-mono shadow-[3px_3px_0px_#000000] flex items-center gap-3">
            <div className="w-9 h-[54px] border border-[#404040] bg-black overflow-hidden shrink-0">
              <img
                src={nextItem.posterPath}
                alt={nextItem.title}
                width={36}
                height={54}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-[#FAFAFA] truncate">
                {nextItem.title}
              </p>
              <p className="text-[10px] font-bold text-neutral-500">
                {nextItem.year ?? ""} {nextItem.genres?.[0] ?? ""}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        ref={cardRef}
        className={[
          "relative z-10 swipe-card",
          "bg-[#171717] text-[#FAFAFA]",
          "border-2 sm:border-4 border-[#404040]",
          "shadow-[5px_5px_0px_#000000]",
          "lg:hover:shadow-[7px_7px_0px_#EF4444]",
          "transition-shadow duration-150",
          isExiting ? "duration-[260ms]" : "",
        ].join(" ")}
        style={{
          transform:
            dragX !== 0
              ? `translateX(${dragX}px) rotate(${rotation}deg)`
              : undefined,
          transition: isExiting
            ? "transform 260ms cubic-bezier(0.22,1,0.36,1)"
            : dragX !== 0
              ? "none"
              : undefined,
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setDragX(0);
          dragState.current.isDragging = false;
          cardRef.current?.classList.remove("is-dragging");
        }}
      >
        {/* Pass overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-start justify-start p-4 transition-opacity duration-150"
          style={{
            background: "rgba(220,38,38,0.14)",
            opacity:
              overlayVisible && direction === "pass"
                ? Math.min(dragProgress, 1) * 0.95
                : 0,
          }}
        >
          <div
            style={{ transform: "rotate(-10deg)" }}
            className="flex items-center gap-1.5 bg-[#DC2626] text-white px-3 py-1.5 border-2 border-white font-mono font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000000]"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>{t.home.pass}</span>
          </div>
        </div>

        {/* Like overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-start justify-end p-4 transition-opacity duration-150"
          style={{
            background: "rgba(16,185,129,0.16)",
            opacity:
              overlayVisible && direction === "like"
                ? Math.min(dragProgress, 1) * 0.95
                : 0,
          }}
        >
          <div
            style={{ transform: "rotate(10deg)" }}
            className="flex items-center gap-1.5 bg-emerald-500 text-[#0A0A0A] px-3 py-1.5 border-2 border-[#0A0A0A] font-mono font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000000]"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>{t.home.like}</span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-3.5 sm:p-5 flex flex-col gap-3 select-none">
          <div
            role="button"
            tabIndex={0}
            aria-label={`${item.title} — ${locale === "en" ? "Details" : "Detaylar"}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDetail(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onDetail(item);
              }
            }}
            className="relative aspect-[2/3] w-full overflow-hidden border-2 border-[#404040] bg-black cursor-pointer group focus:outline-none focus:ring-4 focus:ring-[#DC2626]"
          >
            <img
              src={posterSrc}
              alt={item.title}
              width={400}
              height={600}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#0A0A0A] text-[#EF4444] border border-[#EF4444]/60 text-[10px] font-black uppercase font-mono tracking-widest">
              {locale === "en" ? "TODAY'S SCREENING" : "GÜNÜN SEANSI"}
            </div>
            {typeof item.voteAverage === "number" && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center border-2 border-black shadow-[2px_2px_0px_#000000] overflow-hidden">
                <span className="bg-[#F5C518] text-black font-black text-[10px] px-1.5 py-0.5 uppercase">
                  IMDb
                </span>
                <span className="bg-[#121212] text-white font-mono font-black text-xs px-1.5 py-0.5">
                  {item.voteAverage.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="font-mono space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase text-[#FAFAFA] font-sans tracking-tight leading-tight line-clamp-2">
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
              {item.year && (
                <span className="px-1.5 py-0.5 bg-neutral-900 text-neutral-300 border border-neutral-700">
                  {item.year}
                </span>
              )}
              {item.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-1.5 py-0.5 bg-[#DC2626]/15 text-[#EF4444] border border-[#DC2626]/30 uppercase"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-neutral-300 font-sans leading-relaxed line-clamp-2 h-[34px] overflow-hidden">
            {locale === "en" && (item as any).overviewEn ? (item as any).overviewEn : item.overview}
          </p>

          {/* Buttons */}
          <div className="pt-1 border-t-2 border-[#404040] flex items-center gap-2.5 font-mono">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                finish("pass");
              }}
              className="h-12 w-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-[#262626] hover:bg-[#EF4444] hover:text-[#0A0A0A] text-[#FAFAFA] border-2 border-[#404040] shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
              title={t.home.pass}
              aria-label={t.home.pass}
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                finish("like");
              }}
              className={`flex-1 h-12 min-h-[48px] px-4 text-xs font-black uppercase tracking-wider border-2 border-[#404040] shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isWatchlisted
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-[#EF4444] hover:bg-[#DC2626] text-[#0A0A0A]"
              }`}
              title={isWatchlisted ? (locale === "en" ? "In Watchlist" : "İzleme listende") : (locale === "en" ? "Loved it — add to list" : "Sevdim — listene ekle")}
              aria-label={t.home.like}
            >
              <Heart className={`w-4 h-4 ${isWatchlisted ? "fill-current" : ""}`} />
              <span>{isWatchlisted ? (locale === "en" ? "IN LIST" : "LISTENDE") : t.home.like}</span>
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDetail(item);
              }}
              className="h-12 w-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-[#262626] hover:bg-[#404040] text-[#FAFAFA] border-2 border-[#404040] shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
              title={locale === "en" ? "Details" : "İncele"}
              aria-label={locale === "en" ? "Details" : "İncele"}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
            <ClapperboardIcon size={12} className="text-[#EF4444]" />
            <span>{locale === "en" ? "SWIPE RIGHT: LOVED IT • LEFT: PASS" : "SAĞA KAYDIR: SEVDİM • SOLA: PAS"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
