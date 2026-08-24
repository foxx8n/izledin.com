'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Search, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  AlertCircle,
  Film,
  MapPin,
  ShieldCheck,
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
import { POPULAR_GENRES } from '@/lib/constants';
import { searchCatalog } from '@/lib/omdb';
import { MediaItem, MatchIntent } from '@/types';
import { generateDynamicBio, CINEMA_PROMPT_STARTERS } from '@/lib/cinema-bio-generator';
import { LocationSelector } from '@/components/common/LocationSelector';
import { BirthDateSelector } from '@/components/ui/BirthDateSelector';

interface TasteProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onOpenAuth?: () => void;
}

export function TasteProfilerModal({ isOpen, onClose, onComplete, onOpenAuth }: TasteProfilerModalProps) {
  const { user, profile, updateUserProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [top4Favorites, setTop4Favorites] = useState<(any | null)[]>([null, null, null, null]);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Kadıköy, İstanbul');
  const [birthDate, setBirthDate] = useState('');
  const [matchIntent, setMatchIntent] = useState<MatchIntent>('friend');
  const [intentAgreed, setIntentAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search state for Step 4 (Top 4)
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
    
    if (profile?.favoriteGenres && profile.favoriteGenres.length > 0) {
      setSelectedGenres(profile.favoriteGenres);
    } else {
      setSelectedGenres([]);
    }

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
        setStep(Math.min(4, Math.max(1, Math.trunc(draft.step))) as 1 | 2 | 3 | 4);
      }
      if (Array.isArray(draft.selectedGenres)) setSelectedGenres(draft.selectedGenres);
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
          selectedGenres,
          top4Favorites,
          bio,
          location,
          birthDate,
          matchIntent,
          intentAgreed,
        }),
      );
    } catch {}
  }, [isOpen, user?.id, step, selectedGenres, top4Favorites, bio, location, birthDate, matchIntent, intentAgreed]);

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

  const toggleGenre = (g: string) => {
    setErrorMsg(null);
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter((item) => item !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
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

  const handleStep1Next = () => {
    // If birth date is already locked on user profile, it's valid
    if (!profile?.birthDate) {
      const err = validateBirthDate(birthDate);
      if (err) {
        setErrorMsg(err);
        return;
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

  const handleStep3Next = () => {
    if (selectedGenres.length === 0) {
      setErrorMsg('Lütfen en az 1 favori sinema türü seçin.');
      return;
    }
    setErrorMsg(null);
    setStep(4);
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
    if (selectedGenres.length === 0) {
      setErrorMsg('Lütfen en az bir film/dizi türü seçin.');
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
        favoriteGenres: selectedGenres,
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
  const suggestedBioText = generateDynamicBio({ favoriteGenres: selectedGenres, top4Favorites: validTop4ForBio });

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
                <span>ADIM {step} / 4</span>
              </span>
            </div>
            <h2 id="taste-profiler-title" className="text-base sm:text-xl font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
              {step === 1 && '1. SİNEMA KİMLİĞİ & DOĞUM TARİHİ'}
              {step === 2 && '2. İZDAŞ NİYETİ & GÜVENLİK SÖZLEŞMESİ'}
              {step === 3 && '3. FAVORİ SİNEMA TÜRLERİNİZ'}
              {step === 4 && '4. 4 BAŞYAPIT & SİNEMA BİYOGRAFİSİ'}
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
            <span className={step >= 3 ? 'text-[#EF4444]' : ''}>3. Türler</span>
            <span className={step >= 4 ? 'text-[#EF4444]' : ''}>4. Başyapıt & Biyo</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-800 border border-[#404040] overflow-hidden flex">
            <div className={`h-full bg-[#EF4444] transition-all duration-300 ${
              step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
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
                className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#000000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>DEVAM ET: İZDAŞ NİYETİ</span>
                <ArrowRight className="w-4 h-4" />
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
                <span>DEVAM ET: FAVORİ TÜRLER</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: FAVORITE GENRES & DNA SPECTRUM                                    */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Sinema zevkinizi en iyi yansıtan türleri seçin (En az 1 adet). Seçtiğiniz türler, İzdaş Radarı&apos;nda diğer sinefillerle olan uyum yüzdenizi belirler.
              </p>
              <div className="text-xs font-bold text-[#EF4444]">
                SEÇİLEN TÜRLER ({selectedGenres.length}): {selectedGenres.slice(0, 4).join(', ') || 'Henüz seçilmedi'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {POPULAR_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`p-3 min-h-[48px] text-xs font-black uppercase border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 select-none ${
                      isSelected
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-[3px_3px_0px_#000000]'
                        : 'bg-neutral-900 text-[#FAFAFA] border-[#404040] hover:border-neutral-500'
                    }`}
                  >
                    <span className="truncate">{genre}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                  </button>
                );
              })}
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
                onClick={handleStep3Next}
                className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#000000] flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>DEVAM ET: 4 BAŞYAPIT & KÜNYE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: TOP 4 MASTERPIECES & CINEMA BIO                                   */}
        {/* ========================================================================= */}
        {step === 4 && (
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

            {/* Step 4 Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-[#404040]">
              <button
                type="button"
                onClick={() => setStep(3)}
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
