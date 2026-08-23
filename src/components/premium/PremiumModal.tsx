'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import {
  MasterpieceLaurelIcon,
  CinemaVerifiedSeal,
  CinemaPassTicketIcon,
} from '@/components/icons/CinemaIcons';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Kept for call-site compatibility; plan selection no longer applies — VIP is admin-granted. */
  initialPlan?: 'monthly' | 'yearly';
  onOpenAuth?: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-modal-title"
        className="relative w-full max-w-lg bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#404040] shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b-2 border-[#404040] pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <MasterpieceLaurelIcon size={14} className="text-white" />
              <span>İZLEDİN+ KULÜP ÜYELİĞİ</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#171717] hover:bg-[#EF4444] hover:text-[#0A0A0A] border border-[#404040] cursor-pointer transition-colors"
            aria-label="Modalı Kapat"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Intro */}
        <div className="space-y-2 text-center">
          <h2 id="premium-modal-title" className="text-2xl sm:text-3xl font-black uppercase font-sans tracking-tight text-[#FAFAFA]">
            BAĞIMSIZ SİNEFİL KULÜBÜ
          </h2>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Altın mühür, radarda ve akışta öncelik, bağımsız sinemaya destek. Çekirdek platform zaten herkese ücretsiz ve reklamsızdır.
          </p>
        </div>

        {/* Benefits List */}
        <div className="p-3.5 bg-neutral-900 border-2 border-[#333333] space-y-2">
          <span className="text-[11px] font-black uppercase text-[#EF4444] block">
            KULÜP AYRICALIKLARI:
          </span>
          <ul className="space-y-1.5 text-xs font-sans text-[#FAFAFA] list-none p-0 m-0">
            <li className="flex items-center gap-2">
              <CinemaVerifiedSeal size={13} className="text-[#F59E0B] shrink-0" />
              <span>Altın Kulüp Mührü — profilinde ve günlük notlarında görünen VIP rozeti</span>
            </li>
            <li className="flex items-center gap-2">
              <CinemaVerifiedSeal size={13} className="text-[#F59E0B] shrink-0" />
              <span>Radarda Öncelikli Sıralama — İzdaş keşif radarında eşleşmede öne alın</span>
            </li>
            <li className="flex items-center gap-2">
              <CinemaVerifiedSeal size={13} className="text-[#F59E0B] shrink-0" />
              <span>Akışta Görünürlük Önceliği — topluluk akışında ölçülü görünürlük</span>
            </li>
            <li className="flex items-center gap-2">
              <CinemaVerifiedSeal size={13} className="text-[#F59E0B] shrink-0" />
              <span>Bağımsız Sinemaya Destek — kısa film fonu ve yerel gösterimlere katkı</span>
            </li>
            <li className="flex items-center gap-2">
              <CinemaVerifiedSeal size={13} className="text-[#F59E0B] shrink-0" />
              <span>Yeni Modüllere Erken Erişim — yeni modüller herkesten önce açılır</span>
            </li>
          </ul>
        </div>

        {/* Membership Assignment Info Panel */}
        <div className="p-4 bg-[#F59E0B]/5 border-2 border-[#F59E0B] space-y-2">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#F59E0B] tracking-wider">
            <CinemaPassTicketIcon size={14} className="shrink-0" />
            <span>ÜYELİK ATAMASI</span>
          </span>
          <p className="text-xs font-sans text-[#FAFAFA] leading-relaxed">
            İzledin+ VIP üyeliği şu anda satışa açık değil; yönetim tarafından davetiye ve katkı usulüne göre atanır.
          </p>
          <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
            Kulübe davet edildiyseniz ayrıcalıklarınız profilinize otomatik olarak işlenir. Sorularınız için{' '}
            <Link href="/iletisim" onClick={onClose} className="text-[#EF4444] font-black underline decoration-2 underline-offset-2 hover:text-white transition-colors">
              iletişim formunu
            </Link>{' '}
            kullanabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
