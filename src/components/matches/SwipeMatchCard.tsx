'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MessageSquare, MapPin, X, Film, Check, Ticket } from 'lucide-react';
import { 
  CinemaFriendshipIcon, 
  CinemaRomanceIcon, 
  CinemaDuoIntentIcon, 
  CinemaTrustShieldIcon,
  FilmReelIcon,
  MasterpieceLaurelIcon
} from '@/components/icons/CinemaIcons';
import { MovieMateMatch } from '@/types';
import { generateDynamicBio } from '@/lib/cinema-bio-generator';
import { useTranslation } from '@/lib/i18n/context';

interface SwipeMatchCardProps {
  match: MovieMateMatch;
  nextMatch?: MovieMateMatch;
  onChatClick: (match: MovieMateMatch) => void;
  onLike?: (match: MovieMateMatch) => void;
  onPass?: (match: MovieMateMatch) => void;
  /** S15 BİLET super-like — same deck exit as a like, DB-side quota applies. */
  onBilet?: (match: MovieMateMatch) => void;
  onMovieClick?: (title: string, posterUrl: string) => void;
}

const SWIPE_THRESHOLD = 0.28;
const SWIPE_EXIT_DISTANCE = 1.25;

function triggerHaptic(pattern: number[]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function SwipeMatchCard({ match, nextMatch, onChatClick, onLike, onPass, onBilet, onMovieClick }: SwipeMatchCardProps) {
  const { t, locale } = useTranslation();
  const { user, compatibilityScore, sharedGenres, sharedTitles, matchReasons } = match;
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [nextImgError, setNextImgError] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, isDragging: false, hasMoved: false });
  const [dragX, setDragX] = useState(0);
  const [isExiting, setIsExiting] = useState<'pass' | 'like' | null>(null);

  const intent = user.matchIntent || match.intent || 'friend';

  const direction = dragX < -10 ? 'pass' : dragX > 10 ? 'like' : null;
  const dragProgress = cardRef.current ? Math.abs(dragX) / (cardRef.current.offsetWidth * SWIPE_THRESHOLD) : 0;
  const overlayVisible = Math.abs(dragX) > 18;
  const rotation = (dragX / (cardRef.current?.offsetWidth || 400)) * 10;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isExiting) return;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.isDragging = true;
    dragState.current.hasMoved = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isExiting]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.hasMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    ds.hasMoved = true;
    if (Math.abs(dy) > Math.abs(dx) * 1.6 && Math.abs(dx) < 20) return;
    setDragX(dx);
    cardRef.current?.classList.add('is-dragging');
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.isDragging = false;
    cardRef.current?.classList.remove('is-dragging');
    const cardWidth = cardRef.current?.offsetWidth || 400;
    const dx = e.clientX - ds.startX;
    const absProgress = Math.abs(dx) / cardWidth;
    if (absProgress >= SWIPE_THRESHOLD) {
      const dir = dx < 0 ? 'pass' : 'like';
      triggerHaptic([15]);
      setIsExiting(dir);
      setDragX(dx < 0 ? -window.innerWidth * SWIPE_EXIT_DISTANCE : window.innerWidth * SWIPE_EXIT_DISTANCE);
      setTimeout(() => {
        if (dir === 'pass') onPass?.(match);
        else onLike?.(match);
        setIsExiting(null);
        setDragX(0);
      }, 260);
    } else {
      setDragX(0);
    }
  }, [match, onLike, onPass]);

  const exitCard = (dir: 'pass' | 'like', likeOverride?: (m: MovieMateMatch) => void) => {
    if (isExiting) return;
    triggerHaptic([12]);
    setIsExiting(dir);
    setDragX(dir === 'pass' ? -window.innerWidth * SWIPE_EXIT_DISTANCE : window.innerWidth * SWIPE_EXIT_DISTANCE);
    setTimeout(() => {
      if (dir === 'pass') onPass?.(match);
      else (likeOverride ?? onLike)?.(match);
      setIsExiting(null);
      setDragX(0);
    }, 260);
  };

  const avatarSrc = imgError
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || 'User')}&backgroundColor=0A0A0A&textColor=DC2626`
    : user.avatarUrl;

  const nextAvatarSrc = nextMatch
    ? nextImgError
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nextMatch.user.fullName || 'User')}&backgroundColor=0A0A0A&textColor=DC2626`
      : nextMatch.user.avatarUrl
    : undefined;

  const cardTransform = dragX !== 0 ? `translateX(${dragX}px) rotate(${rotation}deg)` : undefined;

  return (
    <div className="relative w-full" style={{ perspective: '1000px' }}>
      {/* Background Next Card Preview in Deck Stack */}
      {nextMatch && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none transition-transform duration-200"
          style={{ transform: 'translateY(10px) scale(0.96)', zIndex: 0 }}
        >
          <div className=" bg-[#171717] border-2 sm:border-4  border-[#404040] p-4 opacity-50 font-mono  shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2  border-[#404040] bg-[#0A0A0A] overflow-hidden shrink-0">
                <img src={nextAvatarSrc} alt={nextMatch.user.fullName} width={40} height={40} loading="lazy" decoding="async" onError={() => setNextImgError(true)} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase  text-[#FAFAFA] truncate">{nextMatch.user.fullName}</p>
                <p className="text-[10px] font-bold text-neutral-500">
                  %{nextMatch.compatibilityScore} {locale === 'en' ? 'MATCH' : 'UYUM'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Foreground Swipe Card */}
      <div
        ref={cardRef}
        className={[
          'relative z-10 swipe-card',
          ' bg-[#171717]  text-[#FAFAFA]',
          'border-2 sm:border-4  border-[#404040]',
          ' shadow-[5px_5px_0px_#000000]',
          ' lg:hover:shadow-[7px_7px_0px_#EF4444]',
          'transition-shadow duration-150',
          isExiting ? 'duration-[260ms]' : '',
        ].join(' ')}
        style={{ 
          transform: cardTransform, 
          transition: isExiting ? 'transform 260ms cubic-bezier(0.22,1,0.36,1)' : dragX !== 0 ? 'none' : undefined,
          touchAction: 'pan-y'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { setDragX(0); dragState.current.isDragging = false; cardRef.current?.classList.remove('is-dragging'); }}
      >
        {/* Pass Overlay Stamp */}
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-start justify-start p-4 transition-opacity duration-150"
          style={{ 
            background: 'rgba(220,38,38,0.14)', 
            opacity: overlayVisible && direction === 'pass' ? Math.min(dragProgress, 1) * 0.95 : 0 
          }}
        >
          <div 
            style={{ transform: 'rotate(-10deg)' }} 
            className="flex items-center gap-1.5 bg-[#DC2626] text-white px-3 py-1.5 border-2 border-white font-mono font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000000]"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>{t.home.pass}</span>
          </div>
        </div>

        {/* Like Overlay Stamp */}
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-start justify-end p-4 transition-opacity duration-150"
          style={{ 
            background: intent === 'friend' ? 'rgba(16,185,129,0.18)' : intent === 'dating' ? 'rgba(225,29,72,0.18)' : 'rgba(245,158,11,0.18)', 
            opacity: overlayVisible && direction === 'like' ? Math.min(dragProgress, 1) * 0.95 : 0 
          }}
        >
          <div 
            style={{ transform: 'rotate(10deg)' }} 
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-mono font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000000] ${
              intent === 'friend'
                ? 'bg-[#10B981] text-[#0A0A0A] border-[#0A0A0A]'
                : intent === 'dating'
                ? 'bg-[#E11D48] text-white border-white'
                : 'bg-[#F59E0B] text-[#0A0A0A] border-[#0A0A0A]'
            }`}
          >
            {intent === 'friend' ? (
              <CinemaFriendshipIcon size={16} className="text-[#0A0A0A]" />
            ) : intent === 'dating' ? (
              <CinemaRomanceIcon size={16} className="text-white" />
            ) : (
              <CinemaDuoIntentIcon size={16} className="text-[#0A0A0A]" />
            )}
            <span>
              {intent === 'friend'
                ? (locale === 'en' ? 'FILM MATE' : 'İZDAŞ ARKADAŞI')
                : intent === 'dating'
                ? (locale === 'en' ? 'CINEMATIC DATING' : 'SİNEMATİK FLÖRT')
                : (locale === 'en' ? 'MATCH' : 'İZDAŞ OL')}
            </span>
          </div>
        </div>

        {/* Card Body Container */}
        <div className="p-3.5 sm:p-5 flex flex-col justify-between flex-1 gap-2.5 sm:gap-3.5 h-full select-none">
          
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3 pb-2 sm:pb-3 border-b-2  border-[#404040]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 overflow-hidden border-2  border-[#404040] bg-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] flex-shrink-0">
                <img src={avatarSrc} alt={user.fullName} width={52} height={52} loading="lazy" decoding="async" onError={() => setImgError(true)} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-black uppercase  text-[#FAFAFA] truncate tracking-tight font-sans">
                  {user.fullName}{user.age ? `, ${user.age}` : ''}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-mono  text-neutral-400 truncate">@{user.username}</p>
                {user.location && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold  text-[#EF4444] mt-0.5 truncate font-mono">
                    <MapPin className="w-3 h-3 flex-shrink-0 stroke-[2.5]" />
                    <span className="truncate">{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Symmetrical High-Contrast Compatibility Badge */}
            <div className="flex-shrink-0 text-center px-2 sm:px-2.5 py-1 border-2 border-dashed  border-[#EF4444]  bg-[#EF4444]/15">
              <span className="text-sm sm:text-base font-black  text-[#EF4444] font-mono leading-none block">
                %{compatibilityScore}
              </span>
              <span className="text-[10px] font-black uppercase  text-[#EF4444] font-mono tracking-widest leading-none block mt-0.5">
                {locale === 'en' ? 'CINEPHILE MATCH' : 'SİNEFİL UYUMU'}
              </span>
            </div>
          </div>

          {/* Intent Tag & Verification Bar */}
          <div className="flex items-center justify-between gap-2 h-6 font-mono">
            {intent === 'friend' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/15  text-emerald-400 border border-emerald-600/30">
                <CinemaFriendshipIcon size={13} />
                <span>{locale === 'en' ? 'Film Friendship' : 'Film Arkadaşlığı'}</span>
              </span>
            )}
            {intent === 'dating' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/15  text-rose-400 border border-rose-600/30">
                <CinemaRomanceIcon size={13} />
                <span>{locale === 'en' ? 'Cinematic Dating' : 'Sinematik Flört'}</span>
              </span>
            )}
            {intent === 'both' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/15  text-amber-400 border border-amber-600/30">
                <CinemaDuoIntentIcon size={13} />
                <span>{locale === 'en' ? 'All Intents' : 'Tüm Niyetler'}</span>
              </span>
            )}

            {match.resurfaced && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-600/30"
                title={locale === 'en' ? 'Passed earlier; frequency aligned again' : 'Daha önce pas geçmiştin; frekansınız yeniden kesişti'}
              >
                <span>{locale === 'en' ? 'Back on Radar' : 'Yeniden Karşında'}</span>
              </span>
            )}

            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold  text-neutral-300  bg-neutral-800 px-1.5 py-0.5 border  border-neutral-700"
              title={locale === 'en' ? 'Community Trust & Intent Integrity' : 'Topluluk Güven ve Niyet Uyumu'}
            >
              <CinemaTrustShieldIcon size={12} className=" text-emerald-400" />
              <span>%{user.intentIntegrityScore ?? 99} {locale === 'en' ? 'Trust' : 'Güven'}</span>
            </span>
          </div>

          {/* Symmetrical DNA Stats Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 font-mono">
            <div className=" bg-[#262626] border  border-[#404040] p-1 sm:p-1.5 text-center">
              <p className="text-xs sm:text-sm font-black  text-[#FAFAFA] leading-none">{sharedTitles?.length || 0}</p>
              <p className="text-[10px] font-black uppercase  text-neutral-400 tracking-wider mt-0.5">
                {locale === 'en' ? 'Shared Films' : 'Ortak Film'}
              </p>
            </div>
            <div className=" bg-[#262626] border  border-[#404040] p-1 sm:p-1.5 text-center">
              <p className="text-xs sm:text-sm font-black  text-[#FAFAFA] leading-none">{sharedGenres?.length || 0}</p>
              <p className="text-[10px] font-black uppercase  text-neutral-400 tracking-wider mt-0.5">
                {locale === 'en' ? 'Shared Genres' : 'Ortak Tür'}
              </p>
            </div>
            <div className=" bg-[#262626] border  border-[#404040] p-1 sm:p-1.5 text-center">
              <p className="text-xs sm:text-sm font-black  text-[#FAFAFA] leading-none">{matchReasons?.length || 0}</p>
              <p className="text-[10px] font-black uppercase  text-neutral-400 tracking-wider mt-0.5">
                {locale === 'en' ? 'Synergy' : 'Sinerji'}
              </p>
            </div>
          </div>

          {/* Cinephile Bio Note - Compact Responsive Height */}
          <div className=" bg-[#262626] p-2 sm:p-2.5 border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] text-xs font-medium leading-relaxed  text-[#E5E5E5] h-[44px] sm:h-[52px] flex items-center overflow-hidden font-sans">
            <p className="line-clamp-2 italic break-words text-neutral-300">
              {user.bio || generateDynamicBio(user)}
            </p>
          </div>

          {/* Match Affinity Reasons - Compact Responsive Height */}
          <div className="font-mono">
            <div className="flex items-center gap-1.5 mb-1">
              <FilmReelIcon size={12} className=" text-[#EF4444]" />
              <span className="text-[10px] font-black uppercase  text-[#EF4444] tracking-wider">
                {locale === 'en' ? 'SHARED FREQUENCIES' : 'ORTAK FREKANS NOKTALARI'}
              </span>
            </div>
            <div className="h-[38px] sm:h-[44px] overflow-hidden space-y-0.5 sm:space-y-1 text-xs font-medium  text-neutral-300">
              {matchReasons && matchReasons.length > 0 ? (
                matchReasons.slice(0, 2).map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className=" text-[#EF4444] font-black flex-shrink-0 text-[10px] mt-0.5">▶</span>
                    <span className="line-clamp-1 break-words leading-tight">{reason}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-1.5">
                  <span className=" text-[#EF4444] font-black flex-shrink-0 text-[10px] mt-0.5">▶</span>
                  <span className="line-clamp-1 leading-tight">
                    {locale === 'en' ? 'Shared cinema taste and genre preferences' : 'Ortak sinema zevki ve tür tercihleri'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Film Strip of 4 Favorites - Compact Responsive Height */}
          <div className="bg-[#0A0A0A] p-2 sm:p-2.5 border-2  border-[#404040] font-mono">
            <div className="flex items-center justify-between text-[10px] text-[#A3A3A3] font-black uppercase tracking-widest mb-1.5">
              <span className="flex items-center gap-1">
                <Film className="w-2.5 h-2.5  text-[#EF4444]" />
                {locale === 'en' ? 'TOP 4 SELECTIONS' : 'FAVORİ 4 SEÇKİ'}
              </span>
              <span>35MM</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {user.top4Favorites && user.top4Favorites.length > 0 ? (
                user.top4Favorites.slice(0, 4).map((fav: { title: string; posterUrl: string }, i: number) => (
                  <div 
                    key={i} 
                    role="button"
                    tabIndex={0}
                    aria-label={locale === 'en' ? `Favorite masterpiece: ${fav.title}. Click for details.` : `Favori başyapıt: ${fav.title}. Detaylar için tıkla.`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovieClick?.(fav.title, fav.posterUrl);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onMovieClick?.(fav.title, fav.posterUrl);
                      }
                    }}
                    className="group/poster relative aspect-[2/3] h-[64px] sm:h-[72px] mx-auto overflow-hidden bg-[#171717] border border-[#404040] focus:outline-none focus:ring-2 focus:ring-[#DC2626] cursor-pointer" 
                    title={`${fav.title} — ${locale === 'en' ? 'Click to inspect' : 'İncelemek için tıkla'}`}
                  >
                    <img src={fav.posterUrl} alt={fav.title} width={48} height={72} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-200" />
                    {/* Always visible subtle bottom badge on touch, full overlay on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/85 px-1 py-0.5 text-center pointer-events-none group-hover/poster:opacity-0 transition-opacity">
                      <span className="text-[10px] font-bold text-white uppercase leading-none block truncate tracking-tight">{fav.title}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/90 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center p-1 text-center pointer-events-none">
                      <span className="text-[10px] font-black text-white uppercase leading-tight line-clamp-2">{fav.title}</span>
                    </div>
                  </div>
                ))
              ) : (
                [...Array(4)].map((_: unknown, i: number) => (
                  <div key={i} className="aspect-[2/3] h-[64px] sm:h-[72px] mx-auto bg-[#171717] border border-dashed border-[#404040] flex items-center justify-center">
                    <Film className="w-3.5 h-3.5 text-neutral-600 opacity-40" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons — Decisive Binary System [Pas Geç] + [İzdaş Ol & Sohbet Başlat] */}
          <div className="pt-2 border-t-2  border-[#404040] flex items-center gap-2.5 font-mono">
            {/* Pass Action */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                exitCard('pass');
              }}
              className="h-12 w-12 min-w-[48px] min-h-[48px] flex items-center justify-center  bg-[#262626]   hover:bg-[#EF4444] hover:text-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
              title={t.home.pass}
              aria-label={t.home.pass}
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>

            {/* S15 BİLET — super-like; exits like a like but flags the request.
                Free members get 1/day (DB-enforced), Kulüp members unlimited. */}
            {onBilet && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  exitCard('like', onBilet);
                }}
                className="h-12 w-12 min-w-[48px] min-h-[48px] flex items-center justify-center  bg-[#F59E0B]/15   hover:bg-[#F59E0B]  text-[#F59E0B] hover:text-[#0A0A0A] border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                title={locale === 'en' ? 'Send TICKET — spotlight request (1/day on free accounts)' : 'BİLET Gönder — öne çıkan istek (ücretsiz hesapta günde 1)'}
                aria-label={locale === 'en' ? 'Send TICKET' : 'BİLET gönder'}
              >
                <Ticket className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            {/* Primary Unified Cinephile Match & Chat Action */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onChatClick(match);
              }}
              className="flex-1 h-12 min-h-[48px] px-4   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase tracking-wider border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] hover:shadow-[1px_1px_0px_#0A0A0A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
              title={locale === 'en' ? 'Connect & Leave Note' : 'İzdaş Ol & Not Bırak'}
              aria-label={locale === 'en' ? 'Connect & Leave Note' : 'İzdaş Ol ve Not Bırak'}
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>{locale === 'en' ? 'Connect & Leave Note' : 'İzdaş Ol & Not Bırak'}</span>
              {match.unreadCount ? <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-ping" /> : null}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
