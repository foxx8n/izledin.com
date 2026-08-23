'use client';

import React, { useEffect } from 'react';
import { X, MessageSquare, Check } from 'lucide-react';
import { CinemaChatIcon, FilmReelIcon } from '@/components/icons/CinemaIcons';
import { MovieMateMatch } from '@/types';

interface MatchAcceptedToastProps {
  match: MovieMateMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (match: MovieMateMatch) => void;
}

export function MatchAcceptedToast({ match, isOpen, onClose, onOpenChat }: MatchAcceptedToastProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 10000); // 10 seconds auto-dismiss

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !match) return null;

  const partnerName = match.user?.fullName || match.user?.username || 'Bir sinefil';

  return (
    <aside 
      aria-label="İzdaş Eşleşme Bildirimi"
      className="fixed bottom-5 left-4 sm:left-6 lg:left-72 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-200 font-mono"
    >
      <div className="bg-[#171717] text-[#FAFAFA] border-2 sm:border-4 border-[#EF4444] shadow-[6px_6px_0px_#000000] p-4 flex flex-col gap-3">
        {/* Header with dismiss button */}
        <div className="flex items-center justify-between gap-2 border-b border-[#404040] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#EF4444] rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#EF4444]">
              İZDAŞ EŞLEŞMESİ ONAYLANDI
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A3A3A3] hover:text-white p-1 hover:bg-[#262626] transition-colors border border-transparent hover:border-[#404040] cursor-pointer"
            aria-label="Bildirimi Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 border-2 border-[#404040] bg-black shrink-0 overflow-hidden shadow-[2px_2px_0px_#000000]">
            <img 
              src={match.user?.avatarUrl} 
              alt={partnerName} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-neutral-200 leading-snug">
              <span className="text-white font-black">{partnerName}</span> İzdaş isteğini kabul etti. Hemen mesajlaşmaya başla!
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChat(match);
            }}
            className="w-full py-2 px-3 bg-[#EF4444] hover:bg-[#DC2626] text-[#0A0A0A] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <CinemaChatIcon size={14} />
            <span>Sohbete Başla</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
