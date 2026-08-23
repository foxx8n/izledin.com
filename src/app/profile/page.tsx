'use client';

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Film, 
  Star, 
  MapPin, 
  Calendar,
  LogIn, 
  Edit3, 
  Check, 
  Plus, 
  Loader2,
  Trash2,
  ArrowRight,
  BookOpen,
  Heart,
  Share2,
  X
} from 'lucide-react';
import { 
  CinemaStarIcon, 
  FilmReelIcon, 
  MasterpieceLaurelIcon, 
  ClapperboardIcon,
  CinemaProjectorIcon,
  FilmStripIcon,
  CinemaTicketIcon,
  CinemaDnaHelixIcon
} from '@/components/icons/CinemaIcons';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TasteProfilerModal } from '@/components/onboarding/TasteProfilerModal';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { SearchModal } from '@/components/media/SearchModal';
import { QuickLogModal } from '@/components/media/QuickLogModal';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { InboxModal } from '@/components/inbox/InboxModal';
import { ChatModal } from '@/components/matches/ChatModal';
import { SharePassportModal } from '@/components/profile/SharePassportModal';

import { useAuth } from '@/context/AuthContext';
import { LocationSelector } from '@/components/common/LocationSelector';
import { BirthDateSelector } from '@/components/ui/BirthDateSelector';
import { getUserWatchLogs } from '@/lib/services/watch-logs.service';
import { getOMDBDetails } from '@/lib/omdb';
import { WatchLog, MediaItem, Profile, MovieMateMatch } from '@/types';
import { generateDynamicBio } from '@/lib/cinema-bio-generator';

export default function ProfilePage() {
  const { user, profile, updateUserProfile, isLoading } = useAuth();
  const [userLogs, setUserLogs] = useState<WatchLog[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'logs' | 'dna'>('favorites');
  const [isTasteProfilerOpen, setIsTasteProfilerOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isMediaDetailOpen, setIsMediaDetailOpen] = useState(false);
  const [detailMediaItem, setDetailMediaItem] = useState<MediaItem | null>(null);
  const [selectedLogMedia, setSelectedLogMedia] = useState<MediaItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeChatMatch, setActiveChatMatch] = useState<MovieMateMatch | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSharePassportOpen, setIsSharePassportOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [selectingTop4Index, setSelectingTop4Index] = useState<number | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  // Transient honest-lookup notice (e.g. 'Detay bulunamadı')
  const [detailNotice, setDetailNotice] = useState<string | null>(null);

  const showDetailNotice = (msg: string) => {
    setDetailNotice(msg);
    setTimeout(() => setDetailNotice(null), 3000);
  };

  useEffect(() => {
    if (user?.id) {
      setLoadingLogs(true);
      getUserWatchLogs(user.id)
        .then((logs) => {
          setUserLogs(logs);
        })
        .finally(() => {
          setLoadingLogs(false);
        });
    }
  }, [user]);

  // Künye inputs are seeded ON OPEN (see handleToggleBioEditor), not via an
  // effect on `profile` — an effect-driven re-seed silently reverted in-progress
  // edits whenever another surface (e.g. TasteProfilerModal) saved concurrently
  // and refreshed the context profile.

  const handleToggleBioEditor = () => {
    if (!isEditingBio && profile) {
      setBioInput(profile.bio || '');
      setLocationInput(profile.location || 'İstanbul, TR');
      setBirthDateInput(profile.birthDate || '');
    }
    setIsEditingBio(!isEditingBio);
  };

  const handleSaveBio = async () => {
    if (isSavingBio) return;
    setIsSavingBio(true);
    try {
      await updateUserProfile({
        bio: bioInput.slice(0, 280),
        location: locationInput.slice(0, 60),
        // Empty string intentionally clears the birth date (mapper writes NULL)
        birthDate: birthDateInput,
      });
      setIsEditingBio(false);
    } catch (err) {
      console.error('Failed to save bio:', err);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleSelectMedia = async (item: MediaItem) => {
    if (selectingTop4Index !== null && profile) {
      const currentTop4 = [...(profile.top4Favorites || [])];
      const newEntry = {
        id: item.id,
        title: item.title,
        posterUrl: item.posterPath,
        type: item.type,
        year: item.year,
      };

      if (selectingTop4Index < currentTop4.length) {
        currentTop4[selectingTop4Index] = newEntry;
      } else {
        currentTop4.push(newEntry);
      }

      await updateUserProfile({ top4Favorites: currentTop4 });
      setSelectingTop4Index(null);
      setIsSearchOpen(false);
    } else {
      setSelectedLogMedia(item);
      setIsSearchOpen(false);
      setIsQuickLogOpen(true);
    }
  };

  const handleRemoveTop4Slot = async (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    const currentTop4 = [...(profile.top4Favorites || [])];
    currentTop4.splice(slotIdx, 1);
    await updateUserProfile({ top4Favorites: currentTop4 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] font-mono items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10  text-[#EF4444] animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-[#737373]">SİNEMA PROFİLİ YÜKLENİYOR...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPremium={() => setIsPremiumOpen(true)}
        />

        <main className="flex-1 max-w-2xl mx-auto px-4 py-20 w-full text-center space-y-8">
          <div className="bg-[#0A0A0A] text-[#FAFAFA] border-2  border-[#404040]  shadow-[8px_8px_0px_#000000] p-8 sm:p-12 space-y-6">
            <span className="stamp-badge-solid px-3 py-1 text-xs font-black inline-block">
              SİNEMA KİMLİK KARTI
            </span>
            <h1 className="text-2xl sm:text-4xl font-black uppercase  text-[#EF4444] font-sans tracking-tight">
              SİNEMA DNA PROFİLİNİZİ OLUŞTURUN
            </h1>
            <p className="text-xs sm:text-sm text-[#D4D4D4] leading-relaxed max-w-lg mx-auto">
              İzleme geçmişinizi daktilo ile kaydetmek, favori 4 başyapıtınızı sergilemek ve sinema zevkinize uyan kişilerle eşleşmek için giriş yapın veya ücretsiz üye olun.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#ffffff] cursor-pointer inline-flex items-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5"
              >
                <LogIn className="w-4 h-4 stroke-[3]" />
                <span>GİRİŞ YAP / HESAP OLUŞTUR</span>
              </button>
            </div>
          </div>
        </main>

        <Footer />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectMedia={() => {}} />
        <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
      </div>
    );
  }

  // Calculated Stats & Real Cinema DNA
  const totalWatched = userLogs.length || profile?.totalWatchedCount || 0;
  // Average over RATED logs only — counting unrated entries as 0 dragged the
  // score down for anyone who logs without rating.
  const ratedLogs = userLogs.filter((l) => typeof l.rating === 'number');
  const avgRating = ratedLogs.length > 0
    ? (ratedLogs.reduce((acc, l) => acc + (l.rating || 0), 0) / ratedLogs.length).toFixed(1)
    : '0.0';
  const totalReviews = userLogs.filter((l) => Boolean(l.review)).length;
  const top4List = profile?.top4Favorites || [];

  // Compute Real Genre DNA distribution based on watch logs + profile favorite genres
  const computeGenreDNA = (): { genre: string; percentage: number; weight: number }[] => {
    const genreCounts: Record<string, number> = {};
    
    // Base weight for explicitly selected profile favorite genres
    (profile?.favoriteGenres || ['Bilim Kurgu', 'Psikolojik Gerilim', 'Anime & Shonen']).forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 6;
    });

    // Frequency & rating weight from actual user watch logs
    userLogs.forEach((log) => {
      (log.genres || []).forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + (log.rating ? Math.round(log.rating) : 3);
      });
    });

    const maxWeight = Math.max(...Object.values(genreCounts), 1);

    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([genre, weight]) => ({
        genre,
        percentage: Math.min(100, Math.max(30, Math.round((weight / maxWeight) * 100))),
        weight,
      }));
  };

  // İNCELE opens the detail modal with the title's REAL catalog data — never
  // an invented stand-in. If OMDB/catalog lookup fails we say so plainly
  // instead of opening a modal padded with fabricated metadata.
  const handleOpenPosterDetail = async (fav: any) => {
    try {
      const realItem = await getOMDBDetails(fav.id);
      if (!realItem) {
        showDetailNotice('Detay bulunamadı.');
        return;
      }
      setDetailMediaItem(realItem);
      setIsMediaDetailOpen(true);
    } catch (err) {
      console.warn('handleOpenPosterDetail failed:', err);
      showDetailNotice('Detay bulunamadı.');
    }
  };

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white">
      <Navbar
        onOpenQuickLog={() => setIsSearchOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        
        {/* Profile Card Banner */}
        <div className="bg-[#0A0A0A] text-[#FAFAFA] border-2  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-10 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#262626]">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 overflow-hidden border-2  border-[#404040] bg-black shadow-[4px_4px_0px_#DC2626] shrink-0">
                <img 
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.fullName || user.email || 'U')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`} 
                  alt={profile?.fullName || 'Profil'} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black uppercase text-white font-sans truncate" title={profile?.fullName || 'Sinemasever'}>
                    {profile?.fullName || user.user_metadata?.full_name || 'Sinemasever'}
                  </h1>
                  <span className="stamp-badge-solid px-2 py-0.5 text-[10px] font-black">
                    SİNEFİL ÜYE
                  </span>
                </div>
                <p className="text-xs text-[#A3A3A3] font-mono truncate">
                  @{profile?.username || 'kullanici'} • {profile?.age ? `${profile.age} Yaşında • ` : ''}{profile?.location || 'Türkiye'}
                </p>
              </div>
            </div>

            {/* Profile Action Buttons (Custom Neobrutalist Cinema Badges) */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono shrink-0 flex-wrap">
              {/* 1. SİNEMA DNA KALİBRATÖRÜ BUTONU */}
              <button
                onClick={() => setIsTasteProfilerOpen(true)}
                className="group relative cursor-pointer overflow-hidden border-2 border-[#F59E0B] bg-[#0A0A0A] p-0.5 text-[#FAFAFA] shadow-[4px_4px_0px_#F59E0B] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#F59E0B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#F59E0B]"
                title="Sinema zevk profilinizi, favori türlerinizi ve film seçimlerinizi yeniden kalibre edin"
              >
                <div className="flex items-center bg-[#171717] px-3 py-2 border border-[#262626] group-hover:border-[#F59E0B]/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center border border-[#F59E0B]/60 bg-[#F59E0B]/15 text-[#F59E0B] shadow-[1px_1px_0px_#000000] shrink-0">
                      <FilmReelIcon size={14} className="group-hover:rotate-45 transition-transform duration-300" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                        <span>TASTE PROFILER</span>
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider text-white mt-0.5 font-sans">
                        DNA DÜZENLE
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 pl-2.5 border-l border-[#333333] flex items-center">
                    <span className="px-1.5 py-0.5 bg-[#F59E0B] text-[#0A0A0A] text-[10px] font-black uppercase tracking-tighter">
                      DNA
                    </span>
                  </div>
                </div>
              </button>

              {/* 2. DAKTİLO KÜNYE & BİYO BUTONU */}
              <button
                onClick={handleToggleBioEditor}
                className={`group relative cursor-pointer overflow-hidden border-2 p-0.5 text-[#FAFAFA] transition-all duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 ${
                  isEditingBio 
                    ? ' border-[#EF4444] bg-[#0A0A0A]  shadow-[4px_4px_0px_#EF4444]' 
                    : ' border-[#525252] bg-[#0A0A0A]  shadow-[4px_4px_0px_#404040] hover:border-[#DC2626] hover:shadow-[5px_5px_0px_#DC2626]'
                }`}
                title={isEditingBio ? 'Düzenleme modunu kapat' : 'Biyografi, şehir ve doğum tarihinizi düzenleyin'}
              >
                <div className={`flex items-center px-3 py-2 border transition-colors ${
                  isEditingBio 
                    ? 'bg-[#2A0E0E] border-[#DC2626]/60' 
                    : 'bg-[#171717] border-[#262626] group-hover:border-[#DC2626]/50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center border shadow-[1px_1px_0px_#000000] shrink-0 ${
                      isEditingBio 
                        ? 'border-[#DC2626] bg-[#DC2626] text-white' 
                        : 'border-[#404040] bg-[#262626] text-[#D4D4D4] group-hover:text-[#DC2626] group-hover:border-[#DC2626]/60'
                    }`}>
                      {isEditingBio ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <ClapperboardIcon size={14} />
                      )}
                    </div>
                    <div className="text-left leading-none">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#A3A3A3] group-hover:text-[#D4D4D4]">
                        <span>DAKTİLO KÜNYE</span>
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider text-white mt-0.5 font-sans">
                        {isEditingBio ? 'DÜZENLEMEYİ KAPAT' : 'BİYO DÜZENLE'}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 pl-2.5 border-l border-[#333333] flex items-center">
                    <span className={`px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter ${
                      isEditingBio 
                        ? 'bg-[#DC2626] text-white' 
                        : 'bg-[#262626] text-[#A3A3A3] group-hover:bg-[#DC2626] group-hover:text-white'
                    }`}>
                      {isEditingBio ? 'AÇIK' : 'KÜNYE'}
                    </span>
                  </div>
                </div>
              </button>

              {/* 3. 35MM PASAPORT PAYLAŞ BUTONU */}
              <button
                type="button"
                onClick={() => setIsSharePassportOpen(true)}
                className="group relative cursor-pointer overflow-hidden border-2  border-[#525252] bg-[#0A0A0A] p-0.5 text-[#FAFAFA]  shadow-[4px_4px_0px_#404040] hover:border-[#DC2626] hover:shadow-[5px_5px_0px_#DC2626] transition-all duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
                title="35mm Sinema Pasaportunuzu ve Zevk Kartınızı Paylaşın"
              >
                <div className="flex items-center bg-[#171717] px-3 py-2 border border-[#262626] group-hover:border-[#DC2626]/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center border border-[#404040] bg-[#262626] text-[#D4D4D4] group-hover:text-[#DC2626] group-hover:border-[#DC2626]/60 shadow-[1px_1px_0px_#000000] shrink-0">
                      <Share2 size={14} />
                    </div>
                    <div className="text-left leading-none">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#A3A3A3]">
                        <span>SOSYAL KART</span>
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider text-white mt-0.5 font-sans">
                        PAYLAŞ
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Bio Edit Mode */}
          {isEditingBio ? (
            <div className="bg-[#171717] p-5 border border-[#404040] space-y-4 font-mono">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-black uppercase text-[#D4D4D4]">
                  <label>BİYOGRAFİ:</label>
                  <span className="text-[10px] text-[#737373]">{bioInput.length}/280</span>
                </div>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value.slice(0, 280))}
                  rows={2}
                  maxLength={280}
                  className="w-full bg-[#0A0A0A] text-white border border-[#404040] focus:border-[#DC2626] p-3 text-xs font-mono placeholder-[#737373] focus:outline-none leading-relaxed"
                  placeholder="Sinema zevkinizi, favori yönetmenlerinizi ve film izleme alışkanlıklarınızı anlatın..."
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-[#D4D4D4] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5  text-[#EF4444]" />
                    <span>DOĞUM TARİHİ SEÇİMİ:</span>
                  </label>
                  <BirthDateSelector
                    value={birthDateInput}
                    onChange={(val) => setBirthDateInput(val)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-[#D4D4D4] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5  text-[#EF4444]" />
                    <span>ŞEHİR / BÖLGE:</span>
                  </label>
                  <LocationSelector
                    value={locationInput || 'Kadıköy, İstanbul'}
                    onChange={(loc) => setLocationInput(loc.slice(0, 60))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveBio}
                  disabled={isSavingBio}
                  className="px-5 py-2.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[3px_3px_0px_#ffffff] cursor-pointer flex items-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  {isSavingBio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>KAYDEDİLİYOR...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>KÜNYEYİ KAYDET</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-black uppercase text-[#A3A3A3] hover:text-white border border-[#404040] bg-[#262626] cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              <p className="text-xs sm:text-sm text-[#D4D4D4] leading-relaxed italic max-w-3xl">
                &ldquo;{profile?.bio || generateDynamicBio(profile)}&rdquo;
              </p>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-[#262626] font-mono">
            <div className="bg-[#171717] p-3.5 border border-[#333333] shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-black uppercase text-[#A3A3A3] block mb-1">TOPLAM İZLENEN</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white font-sans">{totalWatched}</span>
                <span className="text-[10px] text-[#DC2626] font-bold">FİLM</span>
              </div>
            </div>

            <div className="bg-[#171717] p-3.5 border border-[#333333] shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-black uppercase text-[#A3A3A3] block mb-1">ORTALAMA PUAN</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#F59E0B] font-sans">{avgRating}</span>
                <span className="text-[10px] text-[#A3A3A3]">/10</span>
              </div>
            </div>

            <div className="bg-[#171717] p-3.5 border border-[#333333] shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-black uppercase text-[#A3A3A3] block mb-1">FAVORİ TÜR</span>
              <div className="truncate">
                <span className="text-xs sm:text-sm font-black text-white font-sans truncate block">
                  {profile?.favoriteGenres?.[0] || 'Bilim Kurgu'}
                </span>
              </div>
            </div>

            <div className="bg-[#171717] p-3.5 border border-[#333333] shadow-[2px_2px_0px_#000000]">
              <span className="text-[10px] font-black uppercase text-[#A3A3A3] block mb-1">DAKTİLO İNCELEME</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white font-sans">{totalReviews}</span>
                <span className="text-[10px] text-[#DC2626] font-bold">YAZI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 border-b-4  border-[#404040] pb-2 font-mono overflow-x-auto scrollbar-none" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
            className={`px-5 py-2.5 min-h-[44px] text-xs font-black uppercase border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'favorites'
                ? ' bg-[#171717]  text-[#EF4444]  border-[#EF4444] shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717] text-[#737373]  hover:text-white border-transparent'
            }`}
          >
            <MasterpieceLaurelIcon size={14} className="text-current" />
            <span>BANA GÖRE EN İYİ 4</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dna'}
            onClick={() => setActiveTab('dna')}
            className={`px-5 py-2.5 min-h-[44px] text-xs font-black uppercase border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dna'
                ? ' bg-[#171717]  text-[#EF4444]  border-[#EF4444] shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717] text-[#737373]  hover:text-white border-transparent'
            }`}
          >
            <CinemaDnaHelixIcon size={16} className="text-current" />
            <span>SİNEMA DNA SPEKTRUMU</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-2.5 min-h-[44px] text-xs font-black uppercase border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'logs'
                ? ' bg-[#171717]  text-[#EF4444]  border-[#EF4444] shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717] text-[#737373]  hover:text-white border-transparent'
            }`}
          >
            <Film className="w-4 h-4 text-current" />
            <span>GÜNLÜĞÜM ({userLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Top 4 Favorites (35mm Celluloid Frame Reels) */}
        {activeTab === 'favorites' && (
          <section className="space-y-6">
            <div className="bg-[#0A0A0A] text-[#FAFAFA] border-2  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-6">
              
              {/* Header Section */}
              <div className="space-y-2 border-b border-[#262626] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#F59E0B] uppercase tracking-wider border border-[#F59E0B]/50 px-2 py-0.5 bg-[#F59E0B]/10 inline-flex items-center gap-1 font-mono">
                    <MasterpieceLaurelIcon size={12} className="text-[#F59E0B]" />
                    <span>FAVORİ 4 SEÇKİ</span>
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black uppercase text-white font-sans tracking-tight">
                  BANA GÖRE TÜM ZAMANLARIN EN İYİ 4 BAŞYAPITI
                </h2>
                <p className="text-xs text-[#D4D4D4] font-mono leading-relaxed">
                  Kişisel sinema estetiğimi, damak zevkimi ve sinematik kimliğimi temsil eden 4 başyapıtlık seçki.
                </p>
              </div>

              {/* 4 Celluloid Film Frame Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const fav = top4List[slotIdx];
                  const reelLabels = ['REEL I', 'REEL II', 'REEL III', 'REEL IV'];
                  const frameNumbers = ['#001', '#002', '#003', '#004'];

                  return (
                    <div
                      key={slotIdx}
                      className="group space-y-2 bg-[#121212] p-2.5 border-2 border-[#262626]  hover:border-[#EF4444] transition-all shadow-[3px_3px_0px_#000000] relative flex flex-col justify-between"
                    >
                      {/* Top Film Sprocket Row */}
                      <div className="flex items-center justify-between px-1 py-0.5 bg-[#0A0A0A] border-b border-[#262626] text-[10px] font-black text-[#A3A3A3] font-mono">
                        <span>{reelLabels[slotIdx]}</span>
                        <div className="flex items-center gap-1" aria-hidden="true">
                          <span className="w-1.5 h-1 bg-[#404040] group-hover:bg-[#DC2626] transition-colors inline-block" />
                          <span className="w-1.5 h-1 bg-[#404040] group-hover:bg-[#DC2626] transition-colors inline-block" />
                          <span className="w-1.5 h-1 bg-[#404040] group-hover:bg-[#DC2626] transition-colors inline-block" />
                        </div>
                        <span>35MM</span>
                      </div>

                      {/* Poster & Celluloid Frame */}
                      <div className="aspect-[2/3] overflow-hidden border border-[#333333] bg-[#050505] relative flex items-center justify-center group-hover:border-[#DC2626]/80 transition-colors">
                        {fav ? (
                          <>
                            <img 
                              src={fav.posterUrl} 
                              alt={fav.title} 
                              className="w-full h-full object-cover" 
                            />
                            
                            {/* Year Badge */}
                            {fav.year && (
                              <div className="absolute top-1.5 left-1.5 bg-black/90 text-[10px] font-black text-[#FAFAFA] px-1.5 py-0.5 border border-[#404040]">
                                {fav.year}
                              </div>
                            )}

                            {/* Masterpiece Star Stamp */}
                            <div className="absolute top-1.5 right-1.5 bg-[#F59E0B] text-black p-1 shadow-[1px_1px_0px_#000000]">
                              <CinemaStarIcon size={10} className="text-black" />
                            </div>

                            {/* Persistent / Hover Action Overlay */}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center space-y-1.5">
                              <p className="text-xs font-black text-white uppercase line-clamp-2 font-sans px-1">{fav.title}</p>
                              
                              <button
                                type="button"
                                onClick={() => handleOpenPosterDetail(fav)}
                                className="w-full py-1.5 min-h-[36px] bg-[#FFFFFF] hover:bg-neutral-200 text-black text-[10px] font-black uppercase tracking-wider border border-black cursor-pointer shadow-sm"
                              >
                                İNCELE
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectingTop4Index(slotIdx);
                                  setIsSearchOpen(true);
                                }}
                                className="w-full py-1.5 min-h-[36px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-black uppercase tracking-wider border border-black cursor-pointer shadow-sm"
                              >
                                DEĞİŞTİR
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleRemoveTop4Slot(slotIdx, e)}
                                className="w-full py-1 min-h-[32px] bg-[#262626] hover:bg-red-900 text-[#D4D4D4] hover:text-white text-[10px] font-black uppercase border border-[#404040] flex items-center justify-center gap-1 cursor-pointer"
                                title="Bu slotu boşalt"
                                aria-label={`${fav.title} filmini kaldır`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>KALDIR</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div 
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectingTop4Index(slotIdx);
                              setIsSearchOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectingTop4Index(slotIdx);
                                setIsSearchOpen(true);
                              }
                            }}
                            className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#A3A3A3]  hover:text-[#EF4444] transition-colors space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                            aria-label={`Reel ${frameNumbers[slotIdx]} için başyapıt seç`}
                          >
                            <div className="w-10 h-10 border-2 border-dashed border-[#404040] hover:border-[#DC2626] flex items-center justify-center transition-all">
                              <Plus className="w-5 h-5 stroke-[3]" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase font-mono block text-white hover:text-[#DC2626] transition-colors">
                                + REEL EKLE
                              </span>
                              <span className="text-[10px] text-[#A3A3A3] uppercase block font-mono">
                                BAŞYAPIT SEÇ
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Film Sprocket Row & Meta */}
                      <div className="pt-1 text-center font-mono">
                        <div className="flex items-center justify-between text-[10px] font-black text-[#A3A3A3] uppercase mb-0.5 px-0.5">
                          <span>FRAME {frameNumbers[slotIdx]}</span>
                          <span className={fav ? 'text-[#F59E0B]' : 'text-neutral-500'}>
                            {fav ? 'KANON' : 'BOŞ'}
                          </span>
                        </div>
                        <h3 className="text-xs font-black uppercase text-white truncate px-0.5" title={fav ? fav.title : `Slot ${frameNumbers[slotIdx]}`}>
                          {fav ? fav.title : 'BOŞ KANON SLOTU'}
                        </h3>
                        <div className="mt-1.5 flex items-center justify-center">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            fav 
                              ? ' text-[#EF4444] border-[#DC2626]/40 bg-[#DC2626]/10' 
                              : 'text-[#A3A3A3] border-[#333333] bg-[#171717]'
                          }`}>
                            {fav ? 'MASTERPIECE' : '+ SEÇİM YAP'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sub-notice */}
              <div className="pt-3 border-t border-[#262626] flex items-center gap-1.5 text-xs font-mono text-[#A3A3A3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                <span>Bu 4 film profilinizde ve İzdaşlar (Eşleşme) radarında ana sinematik vitrininiz olarak sergilenir.</span>
              </div>

            </div>
          </section>
        )}

        {/* Tab 2: Cinema DNA Radar (Computed from Real Watch Logs) */}
        {activeTab === 'dna' && (
          <section className=" bg-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040] p-6 sm:p-8  shadow-[6px_6px_0px_#000000] space-y-6 font-mono">
            <div className="flex items-center justify-between border-b-2  border-[#404040] pb-3">
              <div>
                <span className="text-xs font-black uppercase  text-[#EF4444] tracking-wider block">
                  GERÇEK VERİTABANI & VEKTÖR ANALİZİ
                </span>
                <h2 className="text-base sm:text-xl font-black uppercase  text-[#FAFAFA] font-sans">
                  SİNEMA DNA VE TÜR SPEKTRUMU
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTasteProfilerOpen(true)}
                className="text-xs font-black uppercase  text-[#EF4444] hover:underline cursor-pointer flex items-center gap-1 min-h-[44px]"
              >
                <span>Türleri Yeniden Belirle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {computeGenreDNA().map(({ genre, percentage, weight }) => (
                <div key={genre} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black uppercase">
                    <span className=" text-[#FAFAFA]">{genre}</span>
                    <span className=" text-[#EF4444]">%{percentage} AFİNİTE ({weight} Ağırlık)</span>
                  </div>
                  <div className="h-4  bg-[#171717] border  border-[#404040] p-0.5">
                    <div
                      className="h-full  bg-[#EF4444] transition-all duration-500 shadow-sm"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4  bg-[#171717] border  border-neutral-800 text-xs  text-neutral-400 space-y-1">
              <p>
                <strong>Not:</strong> Bu spektrum, izleme günlüğünüze eklediğiniz filmlerin tür ağırlıkları ve verdiğiniz puanların birleşik sinir ağı formülü ile anlık hesaplanır.
              </p>
            </div>
          </section>
        )}

        {/* Tab 3: Recent Logs */}
        {activeTab === 'logs' && (
          <div>
            {userLogs.length === 0 ? (
              <div className=" bg-[#0A0A0A] border-2  border-[#404040] p-12 text-center  shadow-[6px_6px_0px_#000000] space-y-4 font-mono">
                <BookOpen className="w-12 h-12  text-[#EF4444] mx-auto stroke-[1.5]" />
                <h2 className="text-base font-black uppercase  text-[#FAFAFA]">
                  HENÜZ GÜNLÜĞE FİLM EKLENMEDİ
                </h2>
                <p className="text-xs  text-neutral-400 max-w-md mx-auto leading-relaxed">
                  İzlediğiniz filmleri puanlayarak ve daktilo ile notlar ekleyerek sinema günlüğünüzü oluşturmaya başlayın.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="px-6 py-3.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A]  shadow-[4px_4px_0px_#000000] cursor-pointer inline-flex items-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ İLK FİLMİNİ GÜNLÜĞE YAZ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {userLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className=" bg-[#171717]  text-[#FAFAFA] border-2  border-[#404040] p-4 flex gap-4  shadow-[4px_4px_0px_#000000] relative group hover:-translate-y-0.5 transition-transform"
                  >
                    <img 
                      src={log.posterUrl} 
                      alt={log.title} 
                      className="w-16 h-24 object-cover border  border-[#404040] shrink-0 bg-black" 
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-black uppercase  text-[#EF4444] truncate" title={log.title}>
                          {log.title}
                        </h3>
                        {log.rating !== undefined && (
                          <span className="px-1.5 py-0.5 bg-[#DC2626]/10  text-[#EF4444] text-[11px] font-black whitespace-nowrap border border-[#DC2626]/30 flex items-center gap-1">
                            <CinemaStarIcon size={10} className="text-[#D97706]" />
                            <span>{log.rating.toFixed(1)}/10</span>
                          </span>
                        )}
                      </div>
                      {log.review ? (
                        <p className="text-xs  text-[#FAFAFA] font-medium line-clamp-2 leading-relaxed italic">
                          &ldquo;{log.review}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                          (puanladı, not yazmadı)
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t  border-neutral-800 text-xs text-neutral-500">
                        <span>{log.watchedDate}</span>
                        {log.isFavorite && (
                          <span className=" text-[#EF4444] font-black uppercase flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-current" />
                            <span>FAVORİ</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Transient honest-lookup notice (e.g. 'Detay bulunamadı') */}
      {detailNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#EF4444] px-4 py-3 shadow-[6px_6px_0px_#000000] animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-3 font-mono text-xs font-bold max-w-sm"
        >
          <Film className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span className="truncate">{detailNotice}</span>
          <button
            type="button"
            onClick={() => setDetailNotice(null)}
            className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A3A3A3] hover:text-white cursor-pointer"
            aria-label="Bildirimi kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Footer />

      {/* Modals */}
      <TasteProfilerModal
        isOpen={isTasteProfilerOpen}
        onClose={() => setIsTasteProfilerOpen(false)}
      />

      <MediaDetailModal
        item={detailMediaItem}
        isOpen={isMediaDetailOpen}
        onClose={() => setIsMediaDetailOpen(false)}
        onOpenLog={(item) => {
          setSelectedLogMedia(item);
          setIsMediaDetailOpen(false);
          setIsQuickLogOpen(true);
        }}
        onOpenTasteProfiler={() => {
          setIsMediaDetailOpen(false);
          setIsTasteProfilerOpen(true);
        }}
      />

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
      />

      <QuickLogModal
        item={selectedLogMedia}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onChangeMovie={() => {
          setSelectingTop4Index(null);
          setIsSearchOpen(true);
        }}
        onSaveLog={(newLog) => {
          setUserLogs((prev) => [newLog, ...prev]);
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSelectingTop4Index(null);
        }}
        onSelectMedia={handleSelectMedia}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onOpenChat={(match) => {
          setActiveChatMatch(match);
          setIsChatOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <ChatModal
        match={activeChatMatch}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <SharePassportModal
        isOpen={isSharePassportOpen}
        onClose={() => setIsSharePassportOpen(false)}
        profile={profile || {
          id: user?.id || 'guest',
          username: user?.user_metadata?.user_name || 'sinefil',
          fullName: user?.user_metadata?.full_name || 'Sinefil Üye',
          avatarUrl: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Sinefil&backgroundColor=0A0A0A&textColor=DC2626&fontWeight=900',
          favoriteGenres: ['Bilim Kurgu', 'Psikolojik Gerilim', 'Anime & Shonen'],
          top4Favorites: [],
          streamingServices: ['Netflix', 'MUBI', 'BluTV'],
        }}
        watchCount={userLogs.length}
      />
    </div>
  );
}
