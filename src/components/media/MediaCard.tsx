'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Check, Bookmark, Plus, Film } from 'lucide-react';
import { MediaItem } from '@/types';
import { useTranslation } from '@/lib/i18n';
import { translateGenre } from '@/lib/i18n/genres';
import { resolvePosterUrl, applyArtfulPosterFallback } from '@/lib/poster-placeholder';

interface MediaCardProps {
  item: MediaItem;
  onLogClick?: (item: MediaItem) => void;
  onSelect?: (item: MediaItem) => void;
  /**
   * Real watchlist wiring. When absent the bookmark button is not rendered at
   * all — a card without persistence must not show a toggle that only flips
   * local pixels. `isWatchlisted` feeds the button's active styling from the
   * owner's state so optimistic flips and rollbacks stay truthful.
   */
  onToggleWatchlist?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  /** Opens the quick-log flow for this title ("İzledim" action). */
  onOpenLog?: (item: MediaItem) => void;
}

export function MediaCard({
  item,
  onLogClick,
  onSelect,
  onToggleWatchlist,
  isWatchlisted,
  onOpenLog,
}: MediaCardProps) {
  const { t, locale } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const rawGenre =
    item.genres?.[0] ||
    (item.type === 'anime' ? 'Anime' : item.type === 'tv' ? 'Dizi' : 'Sinema');
  const primaryGenre = translateGenre(rawGenre, locale);

  const ratingFormatted =
    typeof item.voteAverage === 'number' && item.voteAverage > 0
      ? item.voteAverage.toFixed(1)
      : null;

  const typeLabel =
    item.type === 'anime' ? t.mediaModal.anime : item.type === 'tv' ? t.mediaModal.tv : t.mediaModal.movie;

  return (
    <div className="group relative flex flex-col justify-between  bg-[#171717]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[4px_4px_0px_#000000]  hover:shadow-[6px_6px_0px_#EF4444] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 p-2.5 sm:p-3 select-none">
      
      {/* 1. Header Stamp Bar */}
      <div className="flex items-start justify-between gap-1 mb-2 font-mono text-[10px] min-h-[16px]">
        <span
          className="stamp-badge px-1 py-0.5 font-black uppercase tracking-tight line-clamp-2 leading-none border-dashed  border-[#EF4444]  text-[#FAFAFA]"
          title={primaryGenre}
        >
          {primaryGenre}
        </span>
        <span className="font-bold  text-neutral-400 uppercase shrink-0 pt-0.5">
          #{typeLabel}
        </span>
      </div>

      {/* 2. Uncropped 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full bg-[#0A0A0A] border-2  border-[#404040] group-hover:border-[#DC2626] transition-colors">
        {/* SEO Link Overlay: Allows Googlebot to crawl the dynamic page while keeping Modal behavior for users */}
        <Link 
          href={`/film/${item.id}`}
          className="absolute inset-0 z-10"
          aria-label={`${item.title} detaylarını görüntüle`}
          onClick={(e) => {
            if (onSelect) {
              e.preventDefault();
              onSelect(item);
            }
          }}
        />
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={resolvePosterUrl(item.posterPath, item.title, item.year, item.genres?.[0])}
            alt={item.title}
            width={300}
            height={450}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 filter contrast-105 brightness-95 group-hover:brightness-100"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              applyArtfulPosterFallback(e, item.title, item.year, item.genres?.[0]);
            }}
          />
        </div>
      </div>

      {/* 3. Metadata & Title Section */}
      <div className="pt-2.5 flex flex-col justify-between flex-1 space-y-1.5 font-mono">
        <div>
          <div className="flex items-center justify-between text-[11px]  text-neutral-400 font-bold">
            <span>{t.watchDate.year}: {item.year || '—'}</span>
            {item.streamingOn && item.streamingOn.length > 0 && (
              <span className="px-1 py-0.2  bg-neutral-800  text-[#FAFAFA] text-[10px] font-black border  border-[#404040] truncate max-w-[65px]">
                {item.streamingOn[0]}
              </span>
            )}
          </div>

          <h3
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(item);
              }
            }}
            className="font-sans font-black text-xs sm:text-sm uppercase tracking-tight line-clamp-2  hover:text-[#EF4444] transition-colors cursor-pointer leading-snug min-h-[32px] sm:min-h-[38px]  text-[#FAFAFA]"
          >
            {locale === 'en' && item.originalTitle ? item.originalTitle : item.title}
          </h3>

          {/* 4. Action & Score Bar */}
          <div className="pt-2 border-t-2  border-[#404040] flex items-center justify-between gap-0.5 sm:gap-1 mt-auto">
            <div
              className={`flex items-center gap-0.5 sm:gap-1 font-black text-[10px] sm:text-[11px]   bg-[#FAFAFA] text-[#0A0A0A] px-1 sm:px-1.5 py-1 border-2  border-[#FAFAFA] cursor-pointer   hover:bg-[#DC2626] hover:border-[#DC2626] hover:text-white transition-colors shrink-0 ${ratingFormatted ? '' : 'opacity-40'}`}
              title={ratingFormatted ? `${item.title} (${ratingFormatted}/10)` : t.watchDate.noDateSelected}
              onClick={() => onSelect?.(item)}
            >
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#F59E0B] text-[#F59E0B] inline stroke-none" />
              <span>{ratingFormatted ?? '—'}</span>
            </div>

            {/* Quick Action Button Group — controls render only when real
                handlers are wired; no dead toggles on unwired surfaces */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {onOpenLog && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLog(item);
                  }}
                  title={t.mediaModal.markWatched}
                  aria-label={t.mediaModal.markWatched}
                  className="w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] sm:min-w-[28px] min-h-[24px] sm:min-h-[28px] flex items-center justify-center border-2  border-[#404040] transition-all cursor-pointer shrink-0 bg-[#171717]  text-[#FAFAFA] hover:bg-[#0A0A0A] hover:text-white"
                >
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                </button>
              )}

              {onToggleWatchlist && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(item);
                  }}
                  title={isWatchlisted ? t.mediaModal.inWatchlist : t.mediaModal.addWatchlist}
                  aria-label={isWatchlisted ? t.mediaModal.inWatchlist : t.mediaModal.addWatchlist}
                  aria-pressed={Boolean(isWatchlisted)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] sm:min-w-[28px] min-h-[24px] sm:min-h-[28px] flex items-center justify-center border-2  border-[#404040] transition-all cursor-pointer shrink-0 ${
                    isWatchlisted
                      ? ' text-white bg-[#DC2626]'
                      : ' bg-[#171717]  text-[#FAFAFA] hover:bg-[#DC2626] hover:text-white'
                  }`}
                >
                  <Bookmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogClick?.(item);
                }}
                title={t.quickLog.title}
                aria-label={t.quickLog.title}
                className="h-6 w-6 sm:h-7 sm:w-auto sm:px-2 min-h-[24px] sm:min-h-[28px] min-w-[24px] sm:min-w-[28px]  hover:bg-[#B91C1C] bg-[#DC2626] text-white font-mono font-black text-[11px] border-2  border-[#404040]  shadow-[1.5px_1.5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer p-0 sm:p-1 shrink-0"
              >
                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                <span className="hidden sm:inline">{t.searchModal.rate}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
