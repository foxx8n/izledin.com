'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Bell, 
  Film, 
  Clock, 
  Check, 
  Loader2, 
  Plus, 
  Star, 
  Search, 
  Filter, 
  X, 
  ArrowRight, 
  Flame, 
  Ticket, 
  Tv, 
  CheckCircle2, 
  Clapperboard, 
  RotateCcw,
  Download,
  Users
} from 'lucide-react';
import { 
  CinemaFlameIcon, 
  CinemaCalendarIcon, 
  CinemaStarIcon, 
  FilmReelIcon, 
  MasterpieceLaurelIcon,
  CinemaCheckIcon,
  CinemaTicketIcon,
  CinemaFrequencyIcon
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

import { getUpcomingReleases, formatTurkishReleaseDate, trDateToISO, STATIC_UPCOMING_CATALOG } from '@/lib/omdb';
import { MediaItem, MovieMateMatch } from '@/types';

// Helper to compute countdown & release status badge. A countdown is only
// ever computed from a REAL full date (ISO or Turkish-formatted). Entries
// whose date is genuinely unknown get an honest "Tarih belirsiz" state — no
// mid-year approximation, no invented June-15 defaults feeding badges or
// calendar exports.
function getReleaseStatusBadge(dateStr?: string, year?: number): {
  label: string;
  badgeClass: string;
  iconType: 'now' | 'flame' | 'calendar' | 'star' | 'unknown';
  isUrgent: boolean;
  daysRemaining: number;
  dateUnknown: boolean;
} {
  const now = new Date();
  let targetDate: Date | null = null;

  // trDateToISO understands both "YYYY-MM-DD" and live-OMDB Turkish strings
  // like "20 Mart 2026"; pure year-only values ("2027") return undefined.
  const isoDate = trDateToISO(dateStr);
  if (isoDate) {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  // No real full date → never fabricate one. Year alone (if we even have it)
  // is all we can honestly claim.
  if (!targetDate) {
    if (year) {
      return {
        label: year === 2026 ? '2026 VİZYONU' : `${year} PRÖMİYERİ`,
        badgeClass: ' bg-[#262626] text-[#A3A3A3]  border-[#404040]',
        iconType: 'star',
        isUrgent: false,
        daysRemaining: Number.POSITIVE_INFINITY,
        dateUnknown: true,
      };
    }
    return {
      label: 'TARİH BELİRSİZ',
      badgeClass: ' bg-[#262626] text-[#A3A3A3]  border-[#404040]',
      iconType: 'unknown',
      isUrgent: false,
      daysRemaining: Number.POSITIVE_INFINITY,
      dateUnknown: true,
    };
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: 'ŞİMDİ VİZYONDA',
      badgeClass: 'bg-[#DC2626] text-white border-[#DC2626]',
      iconType: 'now',
      isUrgent: true,
      daysRemaining: 0,
      dateUnknown: false
    };
  }

  if (diffDays <= 60) {
    return {
      label: `${diffDays} GÜN KALDI`,
      badgeClass: ' bg-[#EF4444] text-white  border-[#EF4444]',
      iconType: 'flame',
      isUrgent: true,
      daysRemaining: diffDays,
      dateUnknown: false
    };
  }

  if (diffDays <= 180) {
    const months = Math.ceil(diffDays / 30);
    return {
      label: `~${months} AY KALDI`,
      badgeClass: 'bg-[#F59E0B] text-[#0A0A0A] border-[#F59E0B]',
      iconType: 'calendar',
      isUrgent: false,
      daysRemaining: diffDays,
      dateUnknown: false
    };
  }

  if (year === 2026) {
    return {
      label: `2026 VİZYONU`,
      badgeClass: ' bg-[#262626] text-[#FAFAFA]  border-[#404040]',
      iconType: 'star',
      isUrgent: false,
      daysRemaining: diffDays,
      dateUnknown: false
    };
  }

  return {
    label: year ? `${year} PRÖMİYERİ` : 'VİZYON TAKVİMİNDE',
    badgeClass: ' bg-[#262626] text-[#A3A3A3]  border-[#404040]',
    iconType: 'star',
    isUrgent: false,
    daysRemaining: diffDays,
    dateUnknown: false
  };
}

// 1-Click .ICS Calendar Generator — only for titles with a REAL release date.
// An unknown date never gets exported onto an invented one.
function downloadICS(item: MediaItem) {
  const isoDate = trDateToISO(item.releaseDate);
  if (!isoDate) return; // caller disables the button for dateless entries

  const title = item.title;
  const description = `${title} filminin Türkiye prömiyeri ve vizyon tarihi. izledin.com 35mm Sinema Takvimi hatırlatıcısı.`;
  const location = 'Sinema Salonu';

  const [year, month, day] = isoDate.split('-');

  // Floating local time (no Z suffix): a premiere is a local-evening event,
  // not 19:00Z which lands at 22:00+ in Istanbul.
  const startDate = `${year}${month}${day}T190000`;
  const endDate = `${year}${month}${day}T213000`;
  const dtStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const uidSource = item.id || title.replace(/[^a-zA-Z0-9]/g, "");
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//izledin.com//Sinefil Vizyon Takvimi//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uidSource}@izledin.com`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${title} Vizyon Prömiyeri`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}_pramiyer.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function UpcomingPage() {
  const [upcomingItems, setUpcomingItems] = useState<MediaItem[]>(STATIC_UPCOMING_CATALOG);
  const [reminders, setReminders] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'anime' | 'reminders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isTasteProfilerOpen, setIsTasteProfilerOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isMediaDetailOpen, setIsMediaDetailOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeChatMatch, setActiveChatMatch] = useState<MovieMateMatch | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    getUpcomingReleases().then((items) => {
      setUpcomingItems(items);
      setLoading(false);
    });

    // Load stored reminders from localStorage
    try {
      const saved = localStorage.getItem('izledin_reminders');
      if (saved) {
        setReminders(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const toggleReminder = (id: string, title: string) => {
    let updated: string[];
    if (reminders.includes(id)) {
      updated = reminders.filter((r) => r !== id);
      showToast(`"${title}" hatırlatıcısı kaldırıldı.`);
    } else {
      updated = [...reminders, id];
      // Honest scope: reminders live in this browser's localStorage only —
      // no notification is ever delivered.
      showToast(
        `"${title}" hatırlatıcısı bu cihaza kaydedildi (bildirim gönderilmez).`,
      );
    }
    setReminders(updated);
    try {
      localStorage.setItem('izledin_reminders', JSON.stringify(updated));
    } catch {}
  };

  // Smart Device-Aware Calendar Integration (Apple Calendar & Google Calendar)
  // — gated on a REAL release date; dateless entries never hit invented dates.
  const handleAddToCalendar = (item: MediaItem) => {
    const isoDate = trDateToISO(item.releaseDate);
    if (!isoDate) {
      showToast(`"${item.title}" için vizyon tarihi henüz açıklanmadı.`);
      return;
    }

    const title = item.title;
    const description = `${title} filminin Türkiye prömiyeri ve vizyon tarihi. izledin.com 35mm Sinema Takvimi.`;
    const location = 'Sinema Salonu';

    const [year, month, day] = isoDate.split('-');

    // Local-evening event, not 19:00Z (22:00+ in Istanbul). gCal interprets
    // Z-less datetimes in the viewer's own timezone, which is what we want.
    const startDate = `${year}${month}${day}T190000`;
    const endDate = `${year}${month}${day}T213000`;

    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title + ' Vizyon Prömiyeri')}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(gCalUrl, '_blank', 'noopener');
      showToast(`"${item.title}" Android takviminize aktarılıyor...`);
    } else if (isIOS) {
      downloadICS(item);
      showToast(`"${item.title}" Apple Takvim'e aktarıldı!`);
    } else {
      const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title + ' Vizyon Prömiyeri')}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(gCalUrl, '_blank', 'noopener');
      showToast(`"${item.title}" takviminize aktarılıyor...`);
    }
  };

  const filteredItems = useMemo(() => {
    return upcomingItems.filter((item) => {
      // Type filter
      if (activeFilter === 'movies' && item.type !== 'movie') return false;
      if (activeFilter === 'anime' && item.type !== 'anime' && item.type !== 'tv') return false;
      if (activeFilter === 'reminders' && !reminders.includes(item.id)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q) || item.originalTitle?.toLowerCase().includes(q);
        const matchDirector = item.director?.toLowerCase().includes(q);
        const matchActors = item.actors?.toLowerCase().includes(q);
        const matchGenres = item.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchTitle && !matchDirector && !matchActors && !matchGenres) {
          return false;
        }
      }

      return true;
    });
  }, [upcomingItems, activeFilter, searchQuery, reminders]);

  // Seasonal Timeline Grouping
  const seasonalGroups = useMemo(() => {
    const groups = [
      {
        id: 'near',
        title: 'ŞU AN VİZYONDA & ÖNÜMÜZDEKİ 60 GÜN',
        subtitle: 'En Yakın Beyaz Perde Prömiyerleri',
        badge: 'YAKIN VİZYON',
        items: [] as MediaItem[],
      },
      {
        id: 'summer',
        title: '2026 YAZ & BLOCKBUSTER SEZONU',
        subtitle: 'Haziran — Ağustos 2026 Prömiyerleri',
        badge: 'YAZ SEZONU',
        items: [] as MediaItem[],
      },
      {
        id: 'autumn',
        title: '2026 SONBAHAR & KIŞ FESTİVALLERİ',
        subtitle: 'Eylül — Aralık 2026 Festival ve Ödül Sezonu',
        badge: 'FESTİVAL SEZONU',
        items: [] as MediaItem[],
      },
      {
        id: 'horizon',
        title: '2027 VE GELECEK SİNEMA UFUKLARI',
        subtitle: 'Uzun Vadeli Beklenen Kült Projeler',
        badge: '2027+',
        items: [] as MediaItem[],
      },
      {
        id: 'undated',
        title: 'VİZYON TARİHİ BEKLENEN YAPIMLAR',
        subtitle: 'Tarihi henüz açıklanmamış yapımlar — kesin gün açıklandığında takvime eklenebilir',
        badge: 'TARİH BELİRSİZ',
        items: [] as MediaItem[],
      },
    ];

    filteredItems.forEach((item) => {
      // Dateless entries are grouped honestly instead of being dropped into a
      // season bucket derived from an invented mid-year date.
      const status = getReleaseStatusBadge(item.releaseDate, item.year);
      if (status.dateUnknown) {
        groups[4].items.push(item);
        return;
      }
      const { daysRemaining } = status;
      if (daysRemaining <= 60) {
        groups[0].items.push(item);
      } else if (daysRemaining <= 180) {
        groups[1].items.push(item);
      } else if (item.year === 2026) {
        groups[2].items.push(item);
      } else {
        groups[3].items.push(item);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredItems]);

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white font-mono">
      <Navbar
        onOpenQuickLog={() => setIsSearchOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#0A0A0A] text-[#FAFAFA] border-2  border-[#EF4444] px-4 py-3 shadow-[6px_6px_0px_#000000] animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-3 font-mono text-xs font-bold max-w-sm"
        >
          <CinemaCheckIcon size={16} className=" text-[#EF4444] flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A3A3A3] hover:text-white cursor-pointer"
            aria-label="Bildirimi kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        
        {/* Header Marquee Masthead */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono inline-block">
              CANLI VİZYON TAKVİMİ
            </span>
            <span className="text-[10px] sm:text-xs text-[#F59E0B] font-black uppercase font-mono tracking-wider flex items-center gap-1.5">
              <FilmReelIcon size={13} className="text-[#F59E0B]" />
              <span>2026 — 2027 SİNEMA SEZONU AJANDASI</span>
            </span>
            {reminders.length > 0 && (
              <span className="ml-auto px-2.5 py-1 bg-[#171717] border border-[#404040] text-xs font-mono text-[#F59E0B] font-bold">
                {reminders.length} Hatırlatıcı Aktif
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black uppercase font-sans tracking-tight leading-[0.95] text-[#FAFAFA]">
              GELECEK YAPIMLAR <span className=" text-[#EF4444]">RADARI</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#D4D4D4] leading-relaxed max-w-2xl font-sans font-medium">
              Beyaz perdeye ve dijital platformlara gelecek en çok beklenen kült yapımlar, salon filmleri ve anime prömiyerleri. 1-tıkla takviminize kaydedin ve izdaşlarınızın heyecanını takip edin.
            </p>
          </div>

          {/* Search Bar & Category Tabs */}
          <div className="pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-[#262626]">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Takvim Filtreleri">
              {[
                { id: 'all', label: 'TÜMÜ (2026-2027)', icon: Clapperboard },
                { id: 'movies', label: 'SİNEMA FİLMLERİ', icon: Film },
                { id: 'anime', label: 'ANİME & DİZİLER', icon: Tv },
                { id: 'reminders', label: `HATIRLATICILARIM (${reminders.length})`, icon: Bell },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`px-3.5 py-2.5 min-h-[44px] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 font-mono ${
                      isActive
                        ? 'bg-[#DC2626] text-white shadow-[2px_2px_0px_#000000] border border-[#DC2626]'
                        : 'bg-[#171717] text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#262626] border border-[#262626]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Search Input */}
            <div className="relative min-w-[220px] sm:min-w-[280px]">
              <Search className="w-4 h-4  text-[#EF4444] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Film, yönetmen veya tür ara..."
                aria-label="Vizyon filmleri arama"
                className="w-full pl-9 pr-10 py-2.5 min-h-[44px] bg-[#171717] text-[#FAFAFA] placeholder-[#737373] text-xs font-mono border border-[#262626] focus:border-[#DC2626] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[#A3A3A3] hover:text-white cursor-pointer"
                  aria-label="Aramayı temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </header>

        {/* Results Counter & Reset Controls */}
        <div className="flex items-center justify-between px-1 text-xs font-mono font-bold  text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span>
              {loading ? 'TAKVİM YÜKLENİYOR...' : `${filteredItems.length} GELECEK YAPIM LİSTELENDİ`}
            </span>
          </div>

          {(searchQuery || activeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className=" text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Filtreleri Sıfırla</span>
            </button>
          )}
        </div>

        {/* Releases Timeline / Seasonal Groups */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4  bg-[#171717] border-2  border-[#404040]  shadow-[6px_6px_0px_#000000]">
            <Loader2 className="w-10 h-10  text-[#EF4444] animate-spin" />
            <div className="text-center space-y-1 font-mono">
              <p className="text-xs font-black uppercase  text-[#FAFAFA]">
                VİZYON TAKVİMİ ARŞİVDEN YÜKLENİYOR...
              </p>
              <p className="text-xs text-[#A3A3A3]">
                2026 - 2027 vizyon prömiyerleri taranıyor.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Graceful Empty State */
          <div className="py-16 px-6 text-center  bg-[#171717] border-2  border-[#404040]  shadow-[6px_6px_0px_#000000] space-y-4 font-mono">
            <div className="w-14 h-14 bg-[#0A0A0A]  text-[#EF4444] border-2  border-[#404040] mx-auto flex items-center justify-center shadow-[3px_3px_0px_#000000]">
              <Film className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black uppercase  text-[#FAFAFA]">
                ARADIĞINIZ KRİTERDE VİZYON YAPIMI BULUNAMADI
              </h2>
              <p className="text-xs  text-neutral-400 max-w-md mx-auto leading-relaxed">
                {activeFilter === 'reminders'
                  ? 'Henüz hiçbir yapım için vizyon hatırlatıcısı kurmadınız. Kartların üzerindeki "Hatırlatıcı Kur" butonuna tıklayarak listenizi oluşturabilirsiniz.'
                  : `"${searchQuery}" araması ile eşleşen bir vizyon filmi veya anime bulunamadı.`}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="px-5 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase font-mono border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#000000] cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tüm Vizyon Takvimini Göster</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {seasonalGroups.map((group) => (
              <section key={group.id} className="space-y-5" aria-labelledby={`season-${group.id}`}>
                
                {/* Season Section Header */}
                <div className="flex items-center justify-between border-b-2  border-[#404040] pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black  text-[#EF4444] uppercase tracking-wider block">
                      {group.badge}
                    </span>
                    <h2 id={`season-${group.id}`} className="text-base sm:text-lg font-black uppercase  text-[#FAFAFA] font-sans">
                      {group.title}
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-[#A3A3A3] font-bold">
                    {group.items.length} Yapım
                  </span>
                </div>

                {/* Season Cards Grid */}
                <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
                  {group.items.map((item, idx) => {
                    const hasReminder = reminders.includes(item.id);
                    const countdown = getReleaseStatusBadge(item.releaseDate, item.year);

                    return (
                      <li key={item.id} className="flex">
                        <article
                          className="w-full  bg-[#171717]  text-[#FAFAFA] border-2  border-[#404040] p-5 flex flex-col justify-between space-y-4  shadow-[6px_6px_0px_#000000]  hover:shadow-[8px_8px_0px_#EF4444] hover:-translate-y-0.5 transition-all duration-150 group"
                        >
                          <div className="space-y-4">
                            
                            {/* Header Strip: Release Date & Countdown Badge */}
                            <div className="flex items-center justify-between gap-2 border-b-2  border-[#404040] pb-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Calendar className="w-3.5 h-3.5  text-[#EF4444] flex-shrink-0" aria-hidden="true" />
                                <span className="text-xs font-black font-mono truncate">
                                  {formatTurkishReleaseDate(item.releaseDate, item.year)}
                                </span>
                              </div>

                              {/* Dynamic Countdown Badge */}
                              <span className={`px-2 py-0.5 text-[10px] font-black uppercase font-mono border flex items-center gap-1 ${countdown.badgeClass}`}>
                                {countdown.iconType === 'flame' && <CinemaFlameIcon size={12} className="text-white" />}
                                {countdown.iconType === 'calendar' && <CinemaCalendarIcon size={12} className="text-[#0A0A0A]" />}
                                {countdown.iconType === 'star' && <CinemaStarIcon size={11} className="text-[#F59E0B]" />}
                                {countdown.iconType === 'now' && <FilmReelIcon size={11} className="text-white" />}
                                {countdown.iconType === 'unknown' && <Calendar className="w-3 h-3  text-[#A3A3A3]" aria-hidden="true" />}
                                <span>{countdown.label}</span>
                              </span>
                            </div>

                            {/* Poster + Info */}
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMedia(item);
                                  setIsMediaDetailOpen(true);
                                }}
                                className="relative w-24 h-36 flex-shrink-0 overflow-hidden border-2  border-[#404040] bg-black  shadow-[2px_2px_0px_#000000] cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                                aria-label={`${item.title} detaylarını aç`}
                              >
                                <img
                                  src={item.posterPath}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                                <div className="absolute top-1 left-1">
                                  <span className="px-1 py-0.2 bg-[#0A0A0A] text-white text-[10px] font-mono font-black uppercase border border-[#404040]">
                                    {item.type === 'anime' ? 'ANİME' : item.type === 'tv' ? 'DİZİ' : 'SİNEMA'}
                                  </span>
                                </div>
                              </button>

                              <div className="space-y-1.5 min-w-0 flex-1">
                                <h3 
                                  onClick={() => {
                                    setSelectedMedia(item);
                                    setIsMediaDetailOpen(true);
                                  }}
                                  className="text-sm font-black uppercase  text-[#FAFAFA] font-sans tracking-tight line-clamp-2 leading-snug  hover:text-[#EF4444] cursor-pointer"
                                >
                                  {item.title}
                                </h3>

                                {item.genres && item.genres.length > 0 && (
                                  <p className="text-[10px] font-mono font-black  text-[#EF4444] uppercase truncate">
                                    #{item.genres.slice(0, 2).join(' • ')}
                                  </p>
                                )}
                                
                                {item.director && (
                                  <p className="text-[11px]  text-[#A3A3A3] font-mono font-bold truncate">
                                    YÖN: <span className=" text-[#FAFAFA]">{item.director}</span>
                                  </p>
                                )}

                                {/* Social İzdaş Counter Badge — removed: the
                                    count was a deterministic fake presented
                                    as real community data. */}

                                <p className="text-xs  text-neutral-300 line-clamp-2 leading-relaxed font-sans pt-0.5">
                                  {item.overview || 'Yakında sinemalarda ve dijital platformlarda prömiyer yapacak.'}
                                </p>
                              </div>
                            </div>

                          </div>

                          {/* Actions Bottom Strip */}
                          <div className="pt-3 border-t-2  border-[#404040] space-y-2 font-mono">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleReminder(item.id, item.title)}
                                aria-pressed={hasReminder}
                                className={`flex-1 min-h-[44px] py-2.5 px-3 text-xs font-black uppercase border-2  border-[#404040] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  hasReminder
                                    ? ' text-[#F59E0B] shadow-[2px_2px_0px_#000000] bg-[#262626]'
                                    : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5'
                                }`}
                              >
                                {hasReminder ? (
                                  <>
                                    <Check className="w-4 h-4 stroke-[3] text-[#F59E0B]" aria-hidden="true" />
                                    <span>HATIRLATICI AKTİF</span>
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-4 h-4" aria-hidden="true" />
                                    <span>HATIRLATICI KUR</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddToCalendar(item)}
                                disabled={countdown.dateUnknown}
                                className="min-h-[44px] px-3  bg-[#262626]   text-[#FAFAFA] border-2  border-[#404040] shadow-[2px_2px_0px_#000000] text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 enabled:hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed"
                                title={countdown.dateUnknown ? 'Vizyon tarihi henüz açıklanmadı' : 'Telefon Takvimine Ekle (Apple / Google Calendar)'}
                                aria-label={countdown.dateUnknown ? `${item.title} için vizyon tarihi henüz açıklanmadı` : `${item.title} vizyon tarihini telefon takvimine ekle`}
                              >
                                <Calendar className={`w-3.5 h-3.5 ${countdown.dateUnknown ? 'text-neutral-500' : ' text-[#EF4444]'}`} aria-hidden="true" />
                                <span>TAKVİME EKLE</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMedia(item);
                                  setIsQuickLogOpen(true);
                                }}
                                className="min-h-[44px] min-w-[44px] p-2.5  bg-[#262626]  hover:bg-[#404040]  text-[#FAFAFA] border-2  border-[#404040] shadow-[2px_2px_0px_#000000] transition-all cursor-pointer font-black flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
                                title="Günlüğe Ekle / Bekleme Listesi"
                                aria-label={`${item.title} günlüğe ekle`}
                              >
                                <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

      </main>

      <Footer />

      {/* Modals */}
      <TasteProfilerModal
        isOpen={isTasteProfilerOpen}
        onClose={() => setIsTasteProfilerOpen(false)}
      />

      <MediaDetailModal
        item={selectedMedia}
        isOpen={isMediaDetailOpen}
        onClose={() => setIsMediaDetailOpen(false)}
        onOpenLog={(item) => {
          setSelectedMedia(item);
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <QuickLogModal
        item={selectedMedia}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onChangeMovie={() => setIsSearchOpen(true)}
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

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item) => {
          setSelectedMedia(item);
          setIsQuickLogOpen(true);
        }}
      />
    </div>
  );
}
