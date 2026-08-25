'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Loader2, 
  AlertCircle,
  MapPin,
  Lock,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { 
  FilmReelIcon, 
  CinemaCheckIcon,
  CinemaFriendshipIcon,
  CinemaRomanceIcon,
  CinemaDuoIntentIcon,
  CinemaDnaHelixIcon
} from '@/components/icons/CinemaIcons';
import { useAuth } from '@/context/AuthContext';
import { POPULAR_GENRES } from '@/lib/constants';
import { MatchIntent } from '@/types';
import { LocationSelector } from '@/components/common/LocationSelector';

interface CinemaDnaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CinemaDnaModal({ isOpen, onClose }: CinemaDnaModalProps) {
  const { profile, updateUserProfile } = useAuth();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [location, setLocation] = useState('Kadıköy, İstanbul');
  const [matchIntent, setMatchIntent] = useState<MatchIntent>('friend');
  // S8 İZDAŞ GÜVENCESİ: radarda görünme hakkı
  const [radarVisible, setRadarVisible] = useState(profile?.radarVisible !== false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state from profile on open
  useEffect(() => {
    if (!isOpen || !profile) return;

    setSelectedGenres(profile.favoriteGenres || []);
    setLocation(profile.location || 'Kadıköy, İstanbul');
    setMatchIntent(profile.matchIntent || 'friend');
    setRadarVisible(profile.radarVisible !== false);
    setErrorMsg(null);
  }, [isOpen, profile]);

  // Window ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  // Calculate 24-hour intent cooldown
  const getCooldownInfo = () => {
    if (!profile.intentLastChangedAt) return { isLocked: false, remainingText: '' };
    
    const lastChanged = new Date(profile.intentLastChangedAt).getTime();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in ms
    const diff = Date.now() - lastChanged;

    if (diff < cooldownPeriod) {
      const remainingMs = cooldownPeriod - diff;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        isLocked: true,
        remainingText: `${hours > 0 ? `${hours} saat ` : ''}${minutes} dakika`,
      };
    }

    return { isLocked: false, remainingText: '' };
  };

  const { isLocked: isIntentLocked, remainingText: cooldownRemainingText } = getCooldownInfo();

  const toggleGenre = (g: string) => {
    setErrorMsg(null);
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter((item) => item !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    if (selectedGenres.length === 0) {
      setErrorMsg('Lütfen en az 1 favori sinema türü seçin.');
      return;
    }

    setErrorMsg(null);
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        favoriteGenres: selectedGenres,
        location: location.trim().slice(0, 60) || 'Kadıköy, İstanbul',
      };

      // Only include matchIntent if it changed and is not locked
      if (matchIntent !== profile.matchIntent) {
        if (isIntentLocked) {
          setErrorMsg(`İzdaş niyetinizi 24 saatte bir kez değiştirebilirsiniz. Kalan süre: ${cooldownRemainingText}`);
          setSaving(false);
          return;
        }
        payload.matchIntent = matchIntent;
      }

      // S8: radar visibility opt-out
      if (radarVisible !== (profile.radarVisible !== false)) {
        payload.radarVisible = radarVisible;
      }

      const res = await updateUserProfile(payload);
      if (res?.success) {
        onClose();
      } else {
        setErrorMsg(res?.error || 'Güncelleme yapılırken bir hata oluştu.');
      }
    } catch (err: any) {
      console.error('Cinema DNA update error:', err);
      setErrorMsg(err?.message || 'Güncelleme sırasında bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="cinema-dna-modal-title"
        className="w-full max-w-2xl bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#404040] shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-[#404040] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#F59E0B] text-[#0A0A0A] text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <CinemaDnaHelixIcon size={13} />
                <span>SİNEMA DNA KALİBRATÖRÜ</span>
              </span>
            </div>
            <h2 id="cinema-dna-modal-title" className="text-base sm:text-xl font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
              SİNEMA DNA & İZDAŞ TERCİHLERİ
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

        {/* 1. MATCH INTENT (24H COOLDOWN) */}
        <div className="space-y-3 p-4 bg-neutral-900 border-2 border-[#333333]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#EF4444]" />
              <span>İZDAŞ RADARI EŞLEŞME NİYETİ:</span>
            </label>
            {isIntentLocked ? (
              <span className="px-2 py-0.5 bg-[#1E1E1E] border border-amber-500/60 text-[10px] font-mono text-[#F59E0B] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#F59E0B]" />
                <span>24 Saat Kilidi: {cooldownRemainingText} kaldı</span>
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Günde 1 kez değiştirilebilir</span>
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            İzdaş Radarı&apos;nda diğer sinefillerle hangi niyetle eşleşmek istediğinizi belirleyin.
          </p>

          {/* 3 Intent Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {[
              {
                id: 'friend',
                title: 'FİLM ARKADAŞLIĞI',
                subtitle: 'Platonik & Sinema Sohbeti',
                icon: CinemaFriendshipIcon,
              },
              {
                id: 'dating',
                title: 'SİNEMATİK FLÖRT',
                subtitle: 'Romantik & Randevu',
                icon: CinemaRomanceIcon,
              },
              {
                id: 'both',
                title: 'HER İKİSİNE DE AÇIĞIM',
                subtitle: 'Esnek Sinefil Tanışma',
                icon: CinemaDuoIntentIcon,
              },
            ].map((item) => {
              const isSelected = matchIntent === item.id;
              const Icon = item.icon;
              const disabled = isIntentLocked && !isSelected;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!isIntentLocked) {
                      setMatchIntent(item.id as MatchIntent);
                      setErrorMsg(null);
                    }
                  }}
                  className={`p-3 text-left border-2 transition-all flex flex-col justify-between gap-2 ${
                    disabled
                      ? 'bg-[#111111] text-neutral-600 border-[#262626] opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#0A0A0A] text-white border-[#DC2626] shadow-[3px_3px_0px_#DC2626] cursor-pointer'
                      : 'bg-[#171717] text-[#FAFAFA] border-[#404040] hover:border-neutral-500 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon size={18} className={isSelected ? 'text-[#F59E0B]' : 'text-neutral-500'} />
                    {isSelected && <CinemaCheckIcon size={14} className="text-[#EF4444]" />}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">{item.title}</span>
                    <span className="text-[10px] text-neutral-400 font-sans block">{item.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. FAVORITE GENRES */}
        <div className="space-y-3 p-4 bg-neutral-900 border-2 border-[#333333]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-2">
              <FilmReelIcon size={14} className="text-[#EF4444]" />
              <span>FAVORİ SİNEMA TÜRLERİNİZ ({selectedGenres.length}):</span>
            </label>
            <span className="text-[10px] text-[#DC2626] font-mono font-bold">
              {selectedGenres.length === 0 ? 'En az 1 adet seçin' : `${selectedGenres.length} Tür Seçildi`}
            </span>
          </div>

          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Sinema zevkinizi ve algoritma afinite oranınızı belirleyen favori türleri seçin veya kaldırın.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-52 overflow-y-auto pr-1">
            {POPULAR_GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`p-2.5 min-h-[42px] text-xs font-black uppercase border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 select-none ${
                    isSelected
                      ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-[2px_2px_0px_#000000]'
                      : 'bg-neutral-900 text-[#FAFAFA] border-[#404040] hover:border-neutral-500'
                  }`}
                >
                  <span className="truncate">{genre}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. LOCATION SELECTOR */}
        <div className="space-y-1.5 p-4 bg-neutral-900 border-2 border-[#333333]">
          <LocationSelector
            value={location}
            onChange={(locStr) => setLocation(locStr)}
          />
        </div>

        {/* S8 İZDAŞ GÜVENCESİ: radarda görünme anahtarı */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setRadarVisible((v) => !v)}
            className={`w-full p-3 text-left border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
              radarVisible
                ? 'bg-[#171717] text-[#FAFAFA] border-[#404040] hover:border-neutral-500'
                : 'bg-[#0A0A0A] text-white border-emerald-600 shadow-[3px_3px_0px_#10B981]'
            }`}
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                RADARDA GÖRÜNME HAKKI
              </span>
              <span className="text-[10px] font-bold text-neutral-400 block mt-0.5 leading-relaxed">
                {radarVisible
                  ? 'Profilin İzdaş radarında görünür. Kapatırsan kimse destende seni göremez.'
                  : 'Profilin gizli — hiçbir desteye düşmezsin. Dilediğin an geri açabilirsin.'}
              </span>
            </div>
            <span
              className={`shrink-0 px-2 py-1 text-[10px] font-black uppercase border-2 ${
                radarVisible
                  ? 'bg-[#262626] text-neutral-300 border-[#404040]'
                  : 'bg-emerald-500 text-[#0A0A0A] border-[#0A0A0A]'
              }`}
            >
              {radarVisible ? 'AÇIK' : 'GİZLİ'}
            </span>
          </button>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-[#404040]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] bg-[#262626] hover:bg-[#333333] text-[#A3A3A3] hover:text-white text-xs font-black uppercase border border-[#404040] cursor-pointer transition-colors"
          >
            Vazgeç
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#000000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>GÜNCELLENİYOR...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SİNEMA DNA&apos;SINI GÜNCELLE</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
