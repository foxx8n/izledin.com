'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  AtSign,
  Lock,
  AlertTriangle,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  IDENTITY_NAME_MAX,
  IDENTITY_USERNAME_MAX,
  normalizeUsername,
  updateMyIdentity,
  validateIdentity,
} from '@/lib/services/profile.service';

/**
 * The profile-page surface of the ONE lifetime identity change (ad & rumuz).
 * Same allowance as onboarding step 1 — once profiles.identity_changed_at is
 * stamped, the whole surface (and the button that opens it) disappears.
 */
interface IdentityChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IdentityChangeModal({ isOpen, onClose }: IdentityChangeModalProps) {
  const { profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state from profile on open
  useEffect(() => {
    if (!isOpen) return;
    setFullName(profile?.fullName || '');
    setUsername(profile?.username || '');
    setErrorMsg(null);
  }, [isOpen, profile?.fullName, profile?.username]);

  // Window ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !profile) return null;

  const nextHandle = normalizeUsername(username);
  // The server no-ops identical values without burning the allowance, but the
  // honest UI move is to keep the seal button unusable until something changed.
  const changed =
    fullName.trim() !== (profile.fullName || '') || nextHandle !== (profile.username || '');

  const handleSave = async () => {
    if (saving || !changed) return;

    const validationError = validateIdentity(fullName, nextHandle, profile.username);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg(null);
    setSaving(true);
    try {
      const res = await updateMyIdentity(fullName.trim(), nextHandle);
      if (!res.ok) {
        setErrorMsg(res.error || 'Değişiklik kaydedilemedi.');
        return;
      }
      // Sealed: refresh context from the DB stamp, then close — the profile
      // card itself is the confirmation (new identity, button gone).
      await refreshProfile();
      onClose();
    } catch (err) {
      console.error('Identity change error:', err);
      setErrorMsg('Değişiklik kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-change-modal-title"
        className="w-full max-w-xl bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#404040] shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-[#404040] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#10B981] text-[#0A0A0A] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Lock size={12} />
                <span>KİMLİK DEĞİŞİKLİĞİ — TEK HAK</span>
              </span>
            </div>
            <h2
              id="identity-change-modal-title"
              className="text-base sm:text-xl font-black uppercase text-[#FAFAFA] font-sans tracking-tight"
            >
              AD &amp; RUMUZ DÜZENLE
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Modalı Kapat"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#171717] hover:bg-[#EF4444] hover:text-[#0A0A0A] border border-[#404040] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <>
            {/* One-shot warning */}
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/60 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                  <strong className="text-white font-mono uppercase">Bu hakkınız yalnızca 1 kez kullanılabilir.</strong>{' '}
                  Sistem kimliğiniz yerine buraya yazacağınız ad ve rumuz kalıcılaşır; mühürledikten sonra
                  profil sayfanızdaki bu buton bir daha görünmez.
                </p>
              </div>
            </div>

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border-2 border-[#DC2626] text-red-200 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="p-1 text-red-400 hover:text-white cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Hatayı kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3 p-4 bg-neutral-900 border-2 border-[#333333]">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>AD (GÖRÜNEN İSİM) — 2-40 KARAKTER</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  maxLength={IDENTITY_NAME_MAX}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Gerçek adınız veya takma adınız"
                  aria-label="Ad"
                  className="w-full h-11 bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] px-3 text-xs font-bold focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>RUMUZ — 5-24 KARAKTER (a-z, 0-9, _)</span>
                </label>
                <div className="flex items-stretch">
                  <span className="px-2.5 flex items-center bg-[#171717] border-2 border-r-0 border-[#404040] text-neutral-400 text-xs font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    maxLength={IDENTITY_USERNAME_MAX}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rumuz"
                    aria-label="Rumuz"
                    className="flex-1 min-w-0 h-11 bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] px-3 text-xs font-mono font-bold focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Profil adresiniz: izledin.com/u/{nextHandle || 'rumuz'}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#404040]">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 min-h-[44px] bg-[#262626] hover:bg-[#333333] text-[#A3A3A3] hover:text-white text-xs font-black uppercase border border-[#404040] cursor-pointer transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !changed}
                title={changed ? 'Değişikliği kalıcı olarak mühürle' : 'Bir değişiklik yapmadan hakkınız harcanmaz'}
                className="px-6 py-3 min-h-[44px] bg-[#10B981] hover:bg-[#059669] text-[#0A0A0A] text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#ffffff] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>MÜHÜRLENİYOR...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>DEĞİŞİKLİĞİ MÜHÜRLE</span>
                  </>
                )}
              </button>
            </div>
        </>
      </div>
    </div>
  );
}
