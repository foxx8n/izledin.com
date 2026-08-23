'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MasterpieceLaurelIcon } from '@/components/icons/CinemaIcons';
import { AuthView } from '@/components/auth/AuthView';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onOpenTasteProfiler?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onOpenTasteProfiler,
}: AuthModalProps) {
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
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md max-h-[min(760px,90vh)] overflow-y-auto  bg-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b-2  border-[#404040] pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <MasterpieceLaurelIcon size={14} className="text-white" />
              <span>35MM SİNEFİL KULÜP GİRİŞİ</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center  bg-[#171717]   hover:bg-[#EF4444] hover:text-[#0A0A0A] border  border-[#404040] cursor-pointer transition-colors"
            aria-label="Modalı Kapat"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="space-y-1 text-center">
          <h2 id="auth-modal-title" className="text-2xl font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
            SİNEMA SALONUNA GİRİŞ
          </h2>
          <p className="text-xs  text-neutral-400 font-sans leading-relaxed">
            35mm daktilo günlüğünüzü tutun ve zevkinize uyan İzdaşlar ile eşleşin.
          </p>
        </div>

        {/* Auth View with 2-step Onboarding Trigger */}
        <AuthView 
          defaultMode={defaultMode} 
          onSuccess={onClose}
          onOpenTasteProfiler={onOpenTasteProfiler}
          isModal={true}
        />
      </div>
    </div>
  );
}
