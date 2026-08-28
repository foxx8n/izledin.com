'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Film,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Edit3,
  Lock
} from 'lucide-react';
import {
  ClapperboardIcon,
  FilmReelIcon,
  CinemaCheckIcon,
  CinemaFriendshipIcon,
  CinemaRomanceIcon,
  CinemaDuoIntentIcon,
  CinemaVerifiedSeal,
} from '@/components/icons/CinemaIcons';
import { useAuth } from '@/context/AuthContext';
import { searchCatalog } from '@/lib/omdb';
import { MediaItem, MatchIntent } from '@/types';
import { generateDynamicBio, CINEMA_PROMPT_STARTERS } from '@/lib/cinema-bio-generator';
import { updateMyIdentity, normalizeUsername, validateIdentity } from '@/lib/services/profile.service';
import { LocationSelector } from '@/components/common/LocationSelector';
import { BirthDateSelector } from '@/components/ui/BirthDateSelector';

interface TasteProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onOpenAuth?: () => void;
}

export function TasteProfilerModal({ isOpen, onClose, onComplete, onOpenAuth }: TasteProfilerModalProps) {
  const { user, profile, updateUserProfile, refreshProfile } = useAuth();

  // S11 condensation: the genre-checkbox step is gone — the S12 taste vector
  // replaced the questionnaire as the matching signal. Genres remain editable
  // in CinemaDnaModal for anyone who wants to tune them manually; this flow
  // never overwrites them.
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [top4Favorites, setTop4Favorites] = useState<(any | null)[]>([null, null, null, null]);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Kadıköy, İstanbul');
  const [birthDate, setBirthDate] = useState('');
  const [matchIntent, setMatchIntent] = useState<MatchIntent>('friend');
  const [intentAgreed, setIntentAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // One-time identity (ad & rumuz): prefilled with the system-provisioned
  // values; only a real change spent through updateMyIdentity burns the
  // lifetime allowance. identityLockedLocal covers the optimistic lock between
  // a successful RPC and the background profile refresh landing.
  const [identityName, setIdentityName] = useState('');
  const [identityUsername, setIdentityUsername] = useState('');
  const [identityLockedLocal, setIdentityLockedLocal] = useState(false);
  const [identitySaving, setIdentitySaving] = useState(false);

  // Search state for Step 3 (Top 4)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync state from profile on open, overlay any active draft
  useEffect(() => {
    if (!isOpen) return;

    const draftKey = user?.id ? `izledin_onboarding_draft_${user.id}` : 'izledin_onboarding_draft_guest';

    let draft: any = null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) draft = JSON.parse(raw);
    } catch {}

    // Base values from saved profile
    setBio(profile?.bio || '');
    setLocation(profile?.location || 'Kadıköy, İstanbul');
    setBirthDate(profile?.birthDate || '');
    if (profile?.matchIntent) setMatchIntent(profile.matchIntent);
    setIntentAgreed(Boolean(profile?.intentAgreedAt));
    setIdentityName(profile?.fullName || '');
    setIdentityUsername(profile?.username || '');
    setIdentityLockedLocal(Boolean(profile?.identityChangedAt));

    if (profile?.top4Favorites && profile.top4Favorites.length > 0) {
      const initialTop4: (any | null)[] = [null, null, null, null];
      profile.top4Favorites.slice(0, 4).forEach((fav, i) => {
        initialTop4[i] = fav;
      });
      setTop4Favorites(initialTop4);
    } else {
      setTop4Favorites([null, null, null, null]);
    }

    // Overlay draft progress if available
    if (draft) {
      if (typeof draft.step === 'number') {
        // Legacy 4-step drafts: old steps 3 (genres) and 4 (top4+bio) both
        // land on the condensed final step.
        const legacy = Math.trunc(draft.step);
        const remapped = legacy >= 4 ? 3 : legacy;
        setStep(Math.min(3, Math.max(1, remapped)) as 1 | 2 | 3);
      }
      if (Array.isArray(draft.top4Favorites)) {
        const dTop4: (any | null)[] = [null, null, null, null];
        draft.top4Favorites.slice(0, 4).forEach((fav: any, i: number) => {
          dTop4[i] = fav || null;
        });
        setTop4Favorites(dTop4);
      }
      if (typeof draft.bio === 'string') setBio(draft.bio);
      if (typeof draft.location === 'string') setLocation(draft.location);
      if (typeof draft.birthDate === 'string' && draft.birthDate) setBirthDate(draft.birthDate);
      if (draft.matchIntent) setMatchIntent(draft.matchIntent);
      if (typeof draft.intentAgreed === 'boolean') setIntentAgreed(draft.intentAgreed);
      return;
    }

    // Always start at Step 1 when there's no ongoing draft
    setStep(1);
  }, [isOpen, user?.id, profile]);

  // Persist draft continuously while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    const draftKey = user?.id ? `izledin_onboarding_draft_${user.id}` : 'izledin_onboarding_draft_guest';
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          step,
          top4Favorites,
          bio,
          location,
          birthDate,
          matchIntent,
          intentAgreed,
        }),
      );
    } catch {}
  }, [isOpen, user?.id, step, top4Favorites, bio, location, birthDate, matchIntent, intentAgreed]);

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

  // Live OMDB search for Top 4
  const searchSeqRef = useRef(0);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const seq = ++searchSeqRef.current;
    const query = searchQuery;
    const timer = setTimeout(() => {
      setSearching(true);
      searchCatalog(query)
        .then((res) => {
          if (seq !== searchSeqRef.current) return;
          setSearchResults(res);
        })
        .finally(() => {
          if (seq === searchSeqRef.current) setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const identityUsed = Boolean(profile?.identityChangedAt) || identityLockedLocal;
  const nextHandle = normalizeUsername(identityUsername);
  // "Changed" only when a value actually differs from the stored profile —
  // merely visiting step 1 with the system-provided names never spends the
  // single lifetime allowance.
  const identityChanged =
    !identityUsed &&
    (identityName.trim() !== (profile?.fullName ?? '') ||
      nextHandle !== (profile?.username ?? ''));

  const validateBirthDate = (dateStr: string): string | null => {
    if (!dateStr) return 'Lütfen doğum tarihinizi seçin.';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Geçersiz doğum tarihi formatı.';
    
    const minDate = new Date('1920-01-01');
    const now = new Date();
    const thirteenYearsAgo = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
    
    if (d < minDate) {
      return 'Geçerli bir doğum yılı seçiniz.';
    }
    if (d > thirteenYearsAgo) {
      return 'İzledin.com topluluğuna katılmak için en az 13 yaşında olmalısınız.';
    }
    return null;
  };

  const handleSelectMovieForSlot = (item: MediaItem) => {
    if (activeSlotIndex === null) return;
    setErrorMsg(null);

    const movieObj = {
      id: item.id,
      title: item.title,
      posterUrl: item.posterPath,
      year: item.year,
      type: item.type,
    };

    const next = [...top4Favorites];
    next[activeSlotIndex] = movieObj;
    setTop4Favorites(next);
    setActiveSlotIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = [...top4Favorites];
    next[index] = null;
    setTop4Favorites(next);
  };

  const handleStep1Next = async () => {
    // If birth date is already locked on user profile, it's valid
    if (!profile?.birthDate) {
      const err = validateBirthDate(birthDate);
      if (err) {
        setErrorMsg(err);
        return;
      }
    }

    // One-time identity: only a real change goes through the RPC and burns
    // the lifetime allowance (the server keeps its own no-op guard too).
    if (identityChanged) {
      const name = identityName.trim();
      const validationError = validateIdentity(name, nextHandle, profile?.username);
      if (validationError) {
        setErrorMsg(validationError);
        return;
      }
      setIdentitySaving(true);
      setErrorMsg(null);
      try {
        const res = await updateMyIdentity(name, nextHandle);
        if (!res.ok) {
          setErrorMsg(res.error || 'Kimlik değişikliği kaydedilemedi.');
          return;
        }
        // Optimistic local lock; the background refresh reconciles with the
        // DB stamp. Step advances first so the continuously-persisted draft
        // records step 2 before the profile-triggered re-sync reads it back.
        setIdentityLockedLocal(true);
        setIdentityName(name);
        setIdentityUsername(nextHandle);
        setStep(2);
        void refreshProfile();
        return;
      } catch (err) {
        console.error('Identity change failed:', err);
        setErrorMsg('Kimlik değişikliği kaydedilirken bir sorun oluştu.');
        return;
      } finally {
        setIdentitySaving(false);
      }
    }

    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!intentAgreed) {
      setErrorMsg('Lütfen İzdaş Dürüst Niyet Beyanı ve Topluluk Güven Taahhüdünü onaylayın.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinish = async () => {
    if (saving) return;

    if (!user) {
      onClose();
      onOpenAuth?.();
      return;
    }

    const validFavorites = top4Favorites.filter((f): f is NonNullable<typeof f> => Boolean(f && f.id));
    if (validFavorites.length === 0) {
      setErrorMsg('Lütfen tüm zamanların favori başyapıtlarından en az 1 tanesini seçin.');
      return;
    }
    if (!bio.trim()) {
      setErrorMsg('Lütfen sinema biyografinizi yazın veya hazır şablonlardan birini seçin.');
      return;
    }

    setErrorMsg(null);
    setSaving(true);
    try {
      await updateUserProfile({
        bio: bio.trim().slice(0, 280),
        location: location.trim().slice(0, 60) || 'Kadıköy, İstanbul',
        // Birth date is only written if not already set, or keeps current
        birthDate: profile?.birthDate || birthDate || undefined,
        matchIntent: matchIntent,
        // Preserve original intentAgreedAt timestamp if exists, otherwise timestamp now
        intentAgreedAt: profile?.intentAgreedAt || new Date().toISOString(),
        // S11: favorite_genres is intentionally NOT sent — the field stays
        // exactly as the user last set it (CinemaDnaModal owns it now).
        top4Favorites: validFavorites,
      });

      try {
        localStorage.setItem(`izledin_onboarded_${user.id}`, 'true');
        localStorage.removeItem(`izledin_onboarding_draft_${user.id}`);
        localStorage.removeItem('izledin_onboarding_draft_guest');
      } catch {}
      onComplete?.();
      onClose();
    } catch (err) {
      console.error('Onboarding update error:', err);
      setErrorMsg('Profil kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const validTop4ForBio = top4Favorites.filter((f): f is NonNullable<typeof f> => Boolean(f && f.id));
  const suggestedBioText = generateDynamicBio({ favoriteGenres: profile?.favoriteGenres || [], top4Favorites: validTop4ForBio });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="taste-profiler-title"
        className="w-full max-w-2xl bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#404040] shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-[#404040] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
                SİNEMA DNA ONBOARDING
              </span>
              <span className="text-xs font-black text-[#EF4444] flex items-center gap-1">
                <ClapperboardIcon size={12} className="text-[#EF4444]" />
                <span>ADIM {step} / 3</span>
              </span>
            </div>
            <h2 id="taste-profiler-title" className="text-base sm:text-xl font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
              {step === 1 && '1. SİNEMA KİMLİĞİ & DOĞUM TARİHİ'}
              {step === 2 && '2. İZDAŞ NİYETİ & GÜVENLİK SÖZLEŞMESİ'}
              {step === 3 && '3. 4 BAŞYAPIT & SİNEMA BİYOGRAFİSİ'}
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

        {/* Step Progress Visual Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase text-neutral-400">
            <span className={step >= 1 ? 'text-[#EF4444]' : ''}>1. Profil</span>
            <span className={step >= 2 ? 'text-[#EF4444]' : ''}>2. Niyet</span>
            <span className={step >= 3 ? 'text-[#EF4444]' : ''}>3. Başyapıt & Biyo</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-800 border border-[#404040] overflow-hidden flex">
            <div className={`h-full bg-[#EF4444] transition-all duration-300 ${
              step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
            }`} />
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

        {/* ========================================================================= */}
        {/* STEP 1: IDENTITY, BIRTHDATE & LOCATION                                    */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">

            {/* Identity: system-provisioned name & nickname — ONE lifetime change */}
            {profile && (
              <div className="space-y-1.5 p-4 bg-neutral-900 border-2 border-[#333333]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#EF4444]" />
                    <span>ADINIZ &amp; RUMUZUNUZ:</span>
                  </label>
                  {identityUsed ? (
                    <span className="px-2 py-0.5 bg-[#171717] border border-emerald-500/60 text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MÜHÜRLENDİ</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#F59E0B] font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>TEK KULLANIMLIK HAK</span>
                    </span>
                  )}
                </div>

                {identityUsed ? (
                  <div className="p-3 bg-[#171717] border border-[#404040] space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Lock className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span>{profile.fullName} · @{profile.username}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Ad ve rumuz değiştirme hakkınızı kullandınız — bu bilgiler artık kalıcıdır.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                      Sistem sizin için{' '}
                      <span className="text-white font-bold">
                        {profile.fullName} (@{profile.username})
                      </span>{' '}
                      kimliğini otomatik oluşturdu. Beğenmediyseniz yalnızca 1 kez değiştirebilirsiniz — şimdi
                      değiştirmezseniz hakkınız profil sayfanızda sizi bekler.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-neutral-400 block">
                          AD (GÖRÜNEN İSİM)
                        </label>
                        <input
                          type="text"
                          value={identityName}
                          maxLength={40}
                          onChange={(e) => setIdentityName(e.target.value)}
                          placeholder="Gerçek adınız veya takma adınız"
                          aria-label="Ad"
                          className="w-full h-11 bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] px-3 text-xs font-bold focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-neutral-400 block">
                          RUMUZ (PROFİL ADRESİNİZ)
                        </label>
                        <div className="flex items-stretch">
                          <span className="px-2.5 flex items-center bg-[#171717] border-2 border-r-0 border-[#404040] text-neutral-400 text-xs font-mono">
                            @
                          </span>
                          <input
                            type="text"
                            value={identityUsername}
                            maxLength={24}
                            onChange={(e) => setIdentityUsername(e.target.value)}
                            placeholder="rumuz"
                            aria-label="Rumuz"
                            className="flex-1 min-w-0 h-11 bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] px-3 text-xs font-mono font-bold focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>
                      </div>
                    </div>
                    {identityChanged && (
                      <p className="text-[10px] text-[#F59E0B] font-mono flex items-start gap-1.5 pt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>
                          Devam ederseniz değiştirme hakkınız KALICI olarak kullanılır ve profil adresiniz
                          izledin.com/u/{nextHandle} olur.
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Birth Date Selector (Locked if already set in profile) */}
            <div className="space-y-1.5 p-4 bg-neutral-900 border-2 border-[#333333]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#EF4444]" />
                  <span>DOĞUM TARİHİNİZ (ZORUNLU):</span>
                </label>
                {profile?.birthDate && (
                  <span className="px-2 py-0.5 bg-[#171717] border border-emerald-500/60 text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DOĞRULANDI ({profile.age ? `${profile.age} YAŞINDA` : 'KAYITLI'})</span>
                  </span>
                )}
              </div>

              {profile?.birthDate ? (
                <div className="p-3 bg-[#171717] border border-[#404040] space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Lock className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Doğum tarihiniz mühürlenmiştir.</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Topluluk güvenliği ve İzdaş yaş eşleşme bütünlüğü gereği doğum tarihi bir kez kaydedildikten sonra değiştirilemez.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 font-sans">
                    Yaşınız ve İzdaş eşleşme filtresi için gereklidir (En az 13 yaş). Doğum gününüz gizli tutulur, sadece yaşınız gösterilir.
                  </p>
                  <div className="pt-2">
                    <BirthDateSelector
                      value={birthDate}
                      onChange={(dateStr) => {
                        setBirthDate(dateStr);
                        setErrorMsg(null);
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Location Selector */}
            <div className="space-y-1.5 p-4 bg-neutral-900 border-2 border-[#333333]">
              <LocationSelector
                value={location}
                onChange={(locStr) => setLocation(locStr)}
              />
            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4 border-t-2 border-[#404040]">
              <button
                type="button"
                onClick={handleStep1Next}
                disabled={identitySaving}
                className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#000000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                {identitySaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>KİMLİK MÜHÜRLENİYOR...</span>
                  </>
                ) : (
                  <>
                    <span>DEVAM ET: İZDAŞ NİYETİ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MATCH INTENT & TRUST PLEDGE                                       */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="space-y-3 p-4 bg-neutral-900 border-2 border-[#333333]">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#FAFAFA]">
                <Users className="w-4 h-4 text-[#EF4444]" />
                <span>İZDAŞ RADARI NİYETİNİZİ BELİRLEYİN:</span>
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                İzledin.com hem sinema arkadaşlığı hem de sinematik flört için şeffaf bir platformdur. Doğru kişileri görmeniz için niyetinizi dürüstçe seçin.
              </p>

              {/* 3 Intent Cards */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  {
                    id: 'friend',
                    title: 'FİLM ARKADAŞLIĞI (PLATONİK)',
                    desc: 'Sinema salonuna beraber gidecek, festival filmlerini tartışacak ve zevkleri paylaşacak dostluklar.',
                    icon: CinemaFriendshipIcon,
                  },
                  {
                    id: 'dating',
                    title: 'SİNEMATİK FLÖRT (ROMANTİK)',
                    desc: 'Ortak film zevki üzerinden başlayan, sinema temalı romantik tanışmalar ve randevular.',
                    icon: CinemaRomanceIcon,
                  },
                  {
                    id: 'both',
                    title: 'HER İKİSİNE DE AÇIĞIM (ESNEK)',
                    desc: 'Uyumlu sinefillere göre hem arkadaşlık hem flört ihtimallerini değerlendirmek istiyorum.',
                    icon: CinemaDuoIntentIcon,
                  },
                ].map((item) => {
                  const isSelected = matchIntent === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMatchIntent(item.id as MatchIntent)}
                      className={`p-3.5 min-h-[56px] text-left border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#0A0A0A] text-white border-[#EF4444] shadow-[4px_4px_0px_#DC2626]'
                          : 'bg-[#171717] text-[#FAFAFA] border-[#404040] hover:border-neutral-500'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <Icon size={20} className={isSelected ? 'text-[#F59E0B]' : 'text-neutral-500'} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider">{item.title}</span>
                          {isSelected && <CinemaCheckIcon size={14} className="text-[#EF4444]" />}
                        </div>
                        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trust Pledge Agreement (Required, starts false unless already agreed) */}
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/60 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={intentAgreed}
                  onChange={(e) => {
                    setIntentAgreed(e.target.checked);
                    if (e.target.checked) setErrorMsg(null);
                  }}
                  className="mt-0.5 w-4 h-4 accent-[#DC2626] cursor-pointer shrink-0"
                />
                <span className="text-xs text-neutral-200 font-sans leading-relaxed">
                  <strong className="text-white font-mono">TOPLULUK GÜVEN TAAHHÜDÜ (ZORUNLU):</strong> Niyetimi dürüstçe beyan ettiğimi, diğer üyelerin sınırlarına ve tercihlerine saygı duyacağımı, taciz ve aldatıcı davranışlardan kaçınacağımı taahhüt ediyorum.
                </span>
              </label>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#404040]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 min-h-[44px] bg-neutral-800 hover:bg-neutral-300 hover:text-black text-xs font-black uppercase border border-[#404040] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Next}
                className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#000000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>DEVAM ET: BAŞYAPITLAR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: TOP 4 MASTERPIECES & CINEMA BIO (S11 — final step)               */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top 4 Reels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#EF4444]" />
                  <span>BANA GÖRE TÜM ZAMANLARIN EN İYİ 4 BAŞYAPITI (EN AZ 1 TANE):</span>
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {validTop4ForBio.length}/4 SEÇİLDİ
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Profilinizde ve İzdaş kartınızda sergilenecek favori başyapıtlarınızı seçin.
              </p>

              {/* 4 Celluloid Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((index) => {
                  const item = top4Favorites[index];
                  const isActive = activeSlotIndex === index;

                  return (
                    <div
                      key={index}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (isActive) {
                          setActiveSlotIndex(null);
                          setSearchQuery('');
                          setSearchResults([]);
                        } else {
                          setActiveSlotIndex(index);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveSlotIndex(isActive ? null : index);
                        }
                      }}
                      className={`relative aspect-[2/3] border-2 flex flex-col justify-between p-2 cursor-pointer transition-all ${
                        item
                          ? 'bg-[#0A0A0A] text-white border-[#DC2626] shadow-[4px_4px_0px_#0A0A0A]'
                          : isActive
                          ? 'bg-amber-500/10 border-amber-500 shadow-[4px_4px_0px_#F59E0B]'
                          : 'bg-neutral-900 border-dashed border-[#404040] hover:border-[#DC2626]'
                      }`}
                    >
                      {/* Sprocket Holes */}
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                        <span>REEL {index + 1}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      </div>

                      {item ? (
                        <div className="relative flex-1 my-1 overflow-hidden group">
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSlot(index, e)}
                            className="absolute top-1 right-1 p-1.5 min-h-[36px] min-w-[36px] bg-[#DC2626] text-white border border-black flex items-center justify-center cursor-pointer shadow-sm hover:bg-[#B91C1C]"
                            title="Bu filmi kaldır"
                            aria-label={`Reel ${index + 1} filmini kaldır`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                          <Film className={`w-6 h-6 mb-1 ${isActive ? 'text-amber-500' : 'text-neutral-400'}`} />
                          <span className="text-[10px] font-black uppercase text-neutral-400">
                            {isActive ? 'AŞAĞIDAN SEÇİN' : '+ FİLM EKLE'}
                          </span>
                        </div>
                      )}

                      <div className="truncate text-center">
                        <span className="text-[10px] font-black uppercase truncate block">
                          {item ? item.title : `SLOT 0${index + 1}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Movie Search Drawer */}
              {activeSlotIndex !== null && (
                <div className="p-4 bg-neutral-900 border-2 border-[#404040] space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#EF4444] flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" />
                      <span>REEL {activeSlotIndex + 1} İÇİN BAŞYAPIT ARA:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlotIndex(null);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-xs font-bold text-neutral-500 hover:text-white cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Film veya dizi adı yazın (Örn: Interstellar, Godfather, Persona)..."
                      autoFocus
                      aria-label="Film arama"
                      className="w-full h-11 bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] px-3 text-xs font-bold focus:outline-none focus:border-[#DC2626]"
                    />
                    {searching && (
                      <Loader2 className="w-4 h-4 animate-spin text-[#DC2626] absolute right-3 top-3.5" />
                    )}
                  </div>

                  {/* Search Results Strip */}
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-neutral-700">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectMovieForSlot(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectMovieForSlot(item);
                            }
                          }}
                          className="flex items-center gap-2 p-1.5 bg-[#171717] border border-neutral-800 hover:border-[#DC2626] cursor-pointer"
                        >
                          <img
                            src={item.posterPath}
                            alt={item.title}
                            className="w-8 h-12 object-cover bg-black shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase truncate text-[#FAFAFA]">{item.title}</p>
                            <p className="text-[10px] text-neutral-500">{item.year || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cinema Bio (Mandatory, with Dynamic DNA recommendation based on Step 3 & 4) */}
            <div className="space-y-3 p-4 bg-neutral-900 border-2 border-[#333333]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-2">
                  <FilmReelIcon size={14} className="text-[#EF4444]" />
                  <span>SİNEMA BİYOGRAFİSİ & KÜNYE NOTU (ZORUNLU):</span>
                </label>
                <span className={`text-xs font-mono font-bold ${
                  bio.length > 240 ? 'text-[#DC2626]' : 'text-neutral-500'
                }`}>
                  {bio.length}/280
                </span>
              </div>

              {/* Dynamic Cinema DNA Quick Recommendation */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[#171717] border border-[#404040]">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#EF4444] block tracking-wider font-mono">
                    ÖNERİLEN SİNEMA DNA NOTU (SEÇİMLERİNİZE GÖRE)
                  </span>
                  <p className="text-xs font-mono text-neutral-300 truncate mt-0.5">
                    {suggestedBioText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBio(suggestedBioText)}
                  className="px-3 py-1.5 bg-[#262626] hover:bg-[#EF4444] hover:text-black text-white text-[11px] font-black uppercase tracking-wider border border-[#404040] shadow-[2px_2px_0px_#000000] cursor-pointer shrink-0 transition-colors font-mono"
                >
                  Kullan
                </button>
              </div>

              {/* Cinematic Prompt Starters Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider font-mono">
                  VEYA BİR SİNEMATİK ŞABLON SEÇİN:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {CINEMA_PROMPT_STARTERS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!bio.trim()) {
                          setBio(prompt);
                        } else {
                          setBio(`${bio.trim()} ${prompt}`.slice(0, 280));
                        }
                      }}
                      className="text-left text-[11px] font-mono px-2 py-1 bg-[#171717] hover:bg-[#262626] text-neutral-300 hover:text-white border border-[#404040] hover:border-[#EF4444] transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                maxLength={280}
                placeholder="Sinema tutkunu, karanlık salon müdavimi, Tarkovski ve Denis Villeneuve hayranı..."
                rows={3}
                aria-label="Sinema Biyografisi"
                className="w-full bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] p-3 text-xs font-mono font-bold focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            {/* Step 3 Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#404040]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 min-h-[44px] bg-neutral-800 hover:bg-neutral-300 hover:text-black text-xs font-black uppercase border border-[#404040] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="px-6 py-3.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#000000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>MÜHÜRLENİYOR...</span>
                  </>
                ) : (
                  <>
                    <CinemaVerifiedSeal size={16} className="text-[#F59E0B]" />
                    <span>SİNEMA DNA&apos;SINI MÜHÜRLE & TAMAMLA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
