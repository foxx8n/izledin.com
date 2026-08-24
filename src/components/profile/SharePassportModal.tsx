'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { Profile } from '@/types';
import { CinemaLogoMark, CinemaVerifiedSeal, CinemaPassTicketIcon } from '@/components/icons/CinemaIcons';

interface SharePassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  watchCount?: number;
}

export function SharePassportModal({
  isOpen,
  onClose,
  profile,
  watchCount = 0,
}: SharePassportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.izledin.com';
  const profileUrl = `${origin}/u/${profile.username || 'sinefil'}`;
  // NOTE: no fabricated compatibility score — the passport shows real data only.
  const ogImageUrl = `${origin}/api/og/profile?username=${encodeURIComponent(profile.username || 'sinefil')}&name=${encodeURIComponent(profile.fullName || 'Sinefil Üye')}&location=${encodeURIComponent(profile.location || 'İstanbul')}&genres=${encodeURIComponent((profile.favoriteGenres || []).join(','))}&count=${watchCount}`;

  const shareText = `Benim izledin.com 35mm Sinema Pasaportum!\nFilm zevklerimiz ne kadar uyuşuyor? İzdaş eşleşme skoruna bak:\n${profileUrl}\n\n#izledin #sinefil #filmgunlugu`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleTwitterShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(tweetUrl, '_blank', 'noopener');
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-passport-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono"
    >
      <div className="relative w-full max-w-xl  bg-[#171717] border-2 sm:border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b-2  border-[#404040] pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[10px] font-black uppercase tracking-wider">
              35MM PASAPORT
            </span>
            <h2 id="share-passport-title" className="text-base sm:text-lg font-black uppercase  text-[#FAFAFA] font-sans">
              PASAPORTUNU PAYLAŞ
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-10 h-10 min-h-[44px] min-w-[44px] border-2  border-[#404040]  bg-neutral-800  text-[#FAFAFA] hover:bg-[#DC2626] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Live OG Card Preview Box */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase text-neutral-500 flex items-center gap-1.5">
            <CinemaPassTicketIcon size={14} className="text-[#F59E0B]" />
            <span>OTOMATİK ÜRETİLEN 35MM SOSYAL MEDYA KARTI:</span>
          </span>

          <div className="relative aspect-[1200/630] w-full overflow-hidden border-2  border-[#404040] bg-[#0A0A0A]  shadow-[4px_4px_0px_#000000]">
            <img
              src={ogImageUrl}
              alt={`${profile.fullName} Sinema Pasaportu`}
              width={600}
              height={315}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Link Copy Bar */}
        <div className="space-y-1.5">
          <label htmlFor="passport-share-url" className="text-xs font-black uppercase  text-[#FAFAFA]">
            PROFİL BAĞLANTIN:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="passport-share-url"
              type="text"
              readOnly
              value={profileUrl}
              className="flex-1 h-11 px-3  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold border-2  border-[#404040] focus:outline-none select-all font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`h-11 px-4 min-h-[44px] border-2  border-[#404040] text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>KOPYALANDI</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>KOPYALA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1-Click Social Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleTwitterShare}
            className="p-3 min-h-[44px] bg-[#0A0A0A] hover:bg-neutral-900 text-white border-2  border-[#404040] text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>X (TWITTER)&apos;DA PAYLAŞ</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="p-3 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white border-2  border-[#404040] text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-white" />
            <span>WHATSAPP&apos;TA GÖNDER</span>
          </button>
        </div>

      </div>
    </div>
  );
}
