'use client';

/**
 * Client-side action wiring for the (server-rendered) film detail page.
 *
 * The server page receives the REAL OMDB/catalog data for the title and hands
 * the relevant fields down here as plain props. Two exports:
 *
 *  - <FilmShareButton />        — copies the current page URL to the clipboard
 *                                 and shows honest "KOPYALANDI" feedback.
 *  - <FilmPageActions ... />    — the primary "DAKTİLOYA EKLE (PUANLA)" CTA,
 *                                 which opens the QuickLogModal prefilled with
 *                                 a MediaItem rebuilt from exactly those same
 *                                 real props. No field is invented here: what
 *                                 the log form pre-shows is what the catalog
 *                                 actually has.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Star, Share2, Check } from 'lucide-react';
import { QuickLogModal } from '@/components/media/QuickLogModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useTranslation } from '@/lib/i18n';
import { MediaItem } from '@/types';

interface FilmActionDataProps {
  id: string;
  title: string;
  type: MediaItem['type'];
  overview: string;
  posterPath: string;
  backdropPath?: string;
  releaseDate?: string;
  year?: number;
  voteAverage?: number;
  voteCount?: number;
  genres: string[];
}

export function FilmShareButton() {
  const { locale } = useTranslation();
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave the
      // button state untouched rather than pretending it worked.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? (locale === 'tr' ? 'Link kopyalandı' : 'Link copied') : (locale === 'tr' ? 'Linki Kopyala' : 'Copy link')}
      aria-label={locale === 'tr' ? "Sayfa linkini kopyala" : "Copy page link"}
      aria-live="polite"
      className={`h-10 px-3 flex items-center justify-center gap-1.5 border-2 transition-colors cursor-pointer font-mono text-[10px] font-black uppercase tracking-wider ${
        copied
          ? ' bg-[#16A34A] border-[#16A34A] text-white'
          : ' border-[#404040] hover:bg-neutral-800 text-[#FAFAFA]'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{locale === 'tr' ? 'KOPYALANDI' : 'COPIED'}</span>
        </>
      ) : (
        <Share2 className="w-4 h-4" />
      )}
    </button>
  );
}

export function FilmPageActions(props: FilmActionDataProps) {
  const { locale } = useTranslation();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // The exact same real fields the server page rendered — rebuilt as a
  // MediaItem so QuickLogModal can prefill from genuine data only.
  const mediaItem: MediaItem = useMemo(
    () => ({
      id: props.id,
      type: props.type,
      title: props.title,
      overview: props.overview,
      posterPath: props.posterPath,
      backdropPath: props.backdropPath,
      releaseDate: props.releaseDate,
      year: props.year,
      voteAverage: props.voteAverage,
      voteCount: props.voteCount,
      genres: props.genres,
    }),
    [
      props.id,
      props.type,
      props.title,
      props.overview,
      props.posterPath,
      props.backdropPath,
      props.releaseDate,
      props.year,
      props.voteAverage,
      props.voteCount,
      props.genres,
    ],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsQuickLogOpen(true)}
        className="w-full py-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black uppercase text-sm border-4 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] transition-transform active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
      >
        <Star className="w-5 h-5 fill-current" />
        <span>{locale === 'tr' ? 'DAKTİLOYA EKLE (PUANLA)' : 'LOG TO DIARY (RATE)'}</span>
      </button>

      <QuickLogModal
        item={mediaItem}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onOpenAuth={() => {
          setIsQuickLogOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
