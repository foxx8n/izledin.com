'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  MapPin, 
  X,
  Film
} from 'lucide-react';
import { 
  CinemaFriendshipIcon, 
  CinemaRomanceIcon, 
  CinemaDuoIntentIcon, 
  CinemaTrustShieldIcon,
  FilmReelIcon
} from '@/components/icons/CinemaIcons';
import { MovieMateMatch } from '@/types';
import { generateDynamicBio } from '@/lib/cinema-bio-generator';

interface MatchCardProps {
  match: MovieMateMatch;
  onChatClick: (match: MovieMateMatch) => void;
  onLike?: (match: MovieMateMatch) => void;
  onPass?: (match: MovieMateMatch) => void;
  onMovieClick?: (title: string, posterUrl: string) => void;
}

export function MatchCard({ match, onChatClick, onLike, onPass, onMovieClick }: MatchCardProps) {
  const { user, compatibilityScore, sharedGenres, sharedTitles, matchReasons } = match;
  const [imgError, setImgError] = useState(false);

  const intent = user.matchIntent || match.intent || 'friend';

  return (
    <div className="group relative flex flex-col justify-between  bg-[#171717]  text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[5px_5px_0px_#000000]  hover:shadow-[7px_7px_0px_#EF4444] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 p-5 font-mono h-full">
      
      <div className="flex flex-col flex-1 justify-between gap-3">
        
        {/* Film Header with Perforations & Avatar */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b-2  border-[#404040]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 overflow-hidden border-2  border-[#404040] bg-[#0A0A0A]  shadow-[2px_2px_0px_#000000] flex-shrink-0">
              <img 
                src={imgError ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName || 'User')}&backgroundColor=0A0A0A&textColor=DC2626` : user.avatarUrl} 
                alt={user.fullName} 
                onError={() => setImgError(true)}
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase  text-[#FAFAFA] truncate tracking-tight font-sans">
                {user.fullName}{user.age ? `, ${user.age}` : ''}
              </h3>
              <p className="text-xs  text-[#A3A3A3] truncate">@{user.username}</p>
              {user.location && (
                <div className="flex items-center gap-1 text-[11px] font-bold  text-[#EF4444] mt-0.5 truncate font-mono">
                  <MapPin className="w-3 h-3  text-[#EF4444] flex-shrink-0 stroke-[2.5]" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stamped High-Contrast Compatibility Badge with Micro-Highlight */}
          <div 
            className="stamp-badge px-2.5 py-1 text-xs font-black  bg-[#EF4444]/15 border-2 border-dashed  border-[#EF4444]  text-[#EF4444] text-center flex-shrink-0 tracking-wider"
            title="Sinefil Uyum Puanı"
          >
            %{compatibilityScore} UYUM
          </div>
        </div>

        {/* Intent Badge & Trust Score Bar */}
        <div className="flex items-center justify-between gap-2 h-6">
          {intent === 'friend' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/15  text-emerald-400 border border-emerald-600/30">
              <CinemaFriendshipIcon size={13} />
              <span>Film Arkadaşlığı</span>
            </span>
          )}
          {intent === 'dating' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/15  text-rose-400 border border-rose-600/30">
              <CinemaRomanceIcon size={13} />
              <span>Sinematik Flört</span>
            </span>
          )}
          {intent === 'both' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/15  text-amber-400 border border-amber-600/30">
              <CinemaDuoIntentIcon size={13} />
              <span>Tüm Niyetler</span>
            </span>
          )}

          <span 
            className="inline-flex items-center gap-1 text-[10px] font-bold  text-neutral-300  bg-neutral-800 px-1.5 py-0.5 border  border-neutral-700"
            title="Topluluk Güven Puanı"
          >
            <CinemaTrustShieldIcon size={12} className=" text-emerald-400" />
            <span>%{user.intentIntegrityScore ?? 98} Güven</span>
          </span>
        </div>

        {/* Typewriter Cinema Bio - Fixed Height */}
        <div className=" bg-[#262626] p-2.5 border-2  border-[#404040] text-xs font-medium leading-relaxed  text-[#E5E5E5]  shadow-[2px_2px_0px_#000000] h-[52px] flex items-center overflow-hidden font-sans">
          <p className="line-clamp-2 italic break-words text-neutral-300">
            {user.bio || generateDynamicBio(user)}
          </p>
        </div>

        {/* Match Synergy Notes - Fixed Height */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FilmReelIcon size={12} className=" text-[#EF4444]" />
            <span className="text-[10px] font-black uppercase  text-[#EF4444] tracking-wider">
              ORTAK FREKANS NOKTALARI
            </span>
          </div>
          <div className="h-[44px] overflow-hidden space-y-1 text-xs font-medium  text-[#D4D4D4]">
            {matchReasons && matchReasons.length > 0 ? (
              matchReasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className=" text-[#EF4444] font-black flex-shrink-0 mt-0.5 text-[10px]">▶</span>
                  <span className="line-clamp-1 break-words leading-tight">{reason}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-1.5">
                <span className=" text-[#EF4444] font-black flex-shrink-0 mt-0.5 text-[10px]">▶</span>
                <span className="line-clamp-1 leading-tight">Ortak sinema zevki ve tür tercihleri</span>
              </div>
            )}
          </div>
        </div>

        {/* Film Strip of Top 4 Favorites - Fixed Height */}
        <div className="bg-[#0A0A0A] p-2.5 border-2  border-[#404040]">
          <div className="flex items-center justify-between text-[10px] text-[#A3A3A3] font-black uppercase tracking-widest mb-1.5">
            <span className="flex items-center gap-1">
              <Film className="w-2.5 h-2.5  text-[#EF4444]" />
              FAVORİ 4 SEÇKİ
            </span>
            <span>35MM</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {user.top4Favorites && user.top4Favorites.length > 0 ? (
              user.top4Favorites.slice(0, 4).map((fav, i) => (
                <div 
                  key={i} 
                  role="button"
                  tabIndex={0}
                  aria-label={`Favori başyapıt: ${fav.title}. Detaylar için tıkla.`}
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
                  className="group/poster relative aspect-[2/3] h-[72px] mx-auto overflow-hidden bg-[#171717] border border-[#404040] focus:outline-none focus:ring-2 focus:ring-[#DC2626] cursor-pointer" 
                  title={`${fav.title} — İncelemek için tıkla`}
                >
                  <img 
                    src={fav.posterUrl} 
                    alt={fav.title} 
                    className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-200" 
                  />
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
              [...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="aspect-[2/3] h-[72px] mx-auto bg-[#171717] border border-dashed border-[#404040] flex items-center justify-center text-[#525252]"
                >
                  <Film className="w-3.5 h-3.5 opacity-40" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Action Buttons — Decisive Binary System [Pas Geç] + [İzdaş Ol & Sohbet Başlat] */}
      <div className="pt-2 border-t-2  border-[#404040] flex items-center gap-2.5">
        {/* Pass Button */}
        <button
          type="button"
          onClick={() => onPass?.(match)}
          className="h-12 w-12 min-w-[48px] min-h-[48px] flex items-center justify-center  bg-[#262626]   hover:bg-[#EF4444] hover:text-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-black shrink-0"
          title="Pas Geç"
          aria-label="Pas Geç"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Primary Unified Cinephile Match & Chat Action */}
        <button
          type="button"
          onClick={() => onChatClick(match)}
          className="flex-1 h-12 min-h-[48px] px-4   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase tracking-wider border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] hover:shadow-[1px_1px_0px_#0A0A0A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
          title="İzdaş Ol & Not Bırak"
          aria-label="İzdaş Ol ve Not Bırak"
        >
          <MessageSquare className="w-4 h-4 stroke-[2.5]" />
          <span>İzdaş Ol & Not Bırak</span>
          {match.unreadCount ? (
            <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-ping" />
          ) : null}
        </button>
      </div>

    </div>
  );
}

