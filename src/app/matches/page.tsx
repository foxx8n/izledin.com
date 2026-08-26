'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  RotateCcw,
  Undo2,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  CinemaRadarScannerIllustration,
  CinemaFriendshipIcon,
  CinemaRomanceIcon,
  CinemaDuoIntentIcon,
  CinemaTrustShieldIcon,
  CinemaDnaHelixIcon
} from '@/components/icons/CinemaIcons';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchCard } from '@/components/matches/MatchCard';
import { ChatModal } from '@/components/matches/ChatModal';
import { InboxModal } from '@/components/inbox/InboxModal';
import { TasteProfilerModal } from '@/components/onboarding/TasteProfilerModal';
import { CinemaDnaModal } from '@/components/profile/CinemaDnaModal';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { SearchModal } from '@/components/media/SearchModal';
import { QuickLogModal } from '@/components/media/QuickLogModal';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { AuthModal } from '@/components/auth/AuthModal';

import { useAuth } from '@/context/AuthContext';
import { computeDiscoverMatches, createOrUpdateMatch, requestMatch } from '@/lib/services/matches.service';
import { useSwipeDeck, type DeckHistoryEntry } from '@/hooks/useSwipeDeck';
import { SwipeMatchCard } from '@/components/matches/SwipeMatchCard';
import { trackEvent, TELEMETRY_EVENTS } from '@/lib/telemetry';
import { getInboxSummary, type InboxItem } from '@/lib/services/inbox.service';
import { searchCatalog } from '@/lib/omdb';
import { isOnboarded } from '@/lib/onboarding';
import { getAllProvinces, getDistricts } from '@/data/locations';
import { POPULAR_GENRES } from '@/lib/constants';
import { MovieMateMatch, MediaItem, MatchIntent } from '@/types';

export default function MatchesPage() {
  const { user, profile } = useAuth();
  // S8 İZDAŞ GÜVENCESİ: Sinematik Flört is opt-in. Members whose own intent
  // is friend never see dating-intent profiles or the Flört tab.
  const viewerIntent = (profile?.matchIntent as MatchIntent | undefined) || 'friend';
  const datingVisible = viewerIntent === 'dating' || viewerIntent === 'both';
  const intentOf = (m: MovieMateMatch): MatchIntent =>
    ((m.user.matchIntent || m.intent || 'friend') as MatchIntent);
  const [matches, setMatches] = useState<MovieMateMatch[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'friend' | 'dating' | 'both'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('Hepsi');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('Hepsi');
  const [selectedCity, setSelectedCity] = useState<string>('Hepsi');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Hepsi');
  const [loading, setLoading] = useState(true);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  // "Seni Beğenenler" strip — pending requests surfaced Tinder-style instead
  // of hiding behind the inbox icon.
  const [incomingRequests, setIncomingRequests] = useState<InboxItem[]>([]);
  const [inboxInitialTab, setInboxInitialTab] = useState<'messages' | 'requests'>('messages');

  // S6: /matches is a people DIRECTORY (filters/grid/manage). The swipe deck
  // lives at `/` (PERDE) — this page no longer renders one.

  const provinces = getAllProvinces();
  const cityDistricts = selectedCity !== 'Hepsi' ? getDistricts(selectedCity) : [];

  // Modals state
  const [activeChatMatch, setActiveChatMatch] = useState<MovieMateMatch | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTasteProfilerOpen, setIsTasteProfilerOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isMediaDetailOpen, setIsMediaDetailOpen] = useState(false);
  const [detailMediaItem, setDetailMediaItem] = useState<MediaItem | null>(null);
  const [gridUndoToast, setGridUndoToast] = useState<MovieMateMatch | null>(null);
  // Calm Turkish feedback for failed likes (sticky rejection / RPC failure)
  const [deckNotice, setDeckNotice] = useState<string | null>(null);
  const deckNoticeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-match undo timers live in gridUndoTimersRef (see handleGridPass)
  // Stale-response guard for rapid profile changes / refetches
  const matchesFetchSeqRef = React.useRef(0);

  // S8: if the viewer loses dating visibility (intent change), fall back out
  // of the hidden Flört tab.
  useEffect(() => {
    if (!datingVisible && selectedIntent === 'dating') setSelectedIntent('all');
  }, [datingVisible, selectedIntent]);

  const fetchMatches = async (forceRefresh = false) => {
    const seq = ++matchesFetchSeqRef.current;
    setLoading(true);
    try {
      // Always fetch the full radar ('all') — per-tab counts were computed
      // from the already-intent-filtered dataset, so TÜMÜ/Flört counts were
      // wrong outside their own tab. The client-side filter handles tabs.
      // _v2: S12 scoring changed (taste-vector term + resurface rows) — old
      // cached payloads must never paint over fresh-shape results.
      const cacheKey = user ? `izledin_matches_${user.id}_all_v2` : null;

      // Stale-while-revalidate: paint the cached radar instantly so there is no
      // spinner flash, but ALWAYS recompute below so taste changes propagate
      // (Bug #5 — previously a cache hit returned early forever).
      if (cacheKey && !forceRefresh) {
        try {
          const cachedMatches = JSON.parse(
            localStorage.getItem(cacheKey) || "null",
          );
          if (Array.isArray(cachedMatches) && cachedMatches.length > 0) {
            setMatches(cachedMatches);
            setLoading(false);
          }
        } catch {
          // Invalid cache — fall through to a fresh fetch
        }
      }

      const currentProfile = profile || {
        id: user?.id || 'guest',
        username: user?.user_metadata?.user_name || 'misafir',
        fullName: user?.user_metadata?.full_name || 'Sinemasever',
        avatarUrl: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Sinemasever&backgroundColor=0A0A0A&textColor=DC2626&fontWeight=900',
        favoriteGenres: ['Bilim Kurgu', 'Psikolojik Gerilim', 'Anime & Shonen'],
        top4Favorites: [],
        streamingServices: ['Netflix', 'BluTV', 'MUBI'],
      };

      const computed = await computeDiscoverMatches(currentProfile, "all");
      if (seq !== matchesFetchSeqRef.current) return; // a newer fetch landed
      setMatches(computed);

      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(computed));
        } catch {}
      }

      if (user) {
        try {
          const inboxSummary = await getInboxSummary(user.id);
          setUnreadInboxCount(inboxSummary.totalUnreadCount);
          setIncomingRequests(inboxSummary.items.filter((i) => i.isPendingForMe));
        } catch {}
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  // Filter drawer: Escape closes (backdrop click handled inline).
  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    if (user && profile) {
      try {
        const isCompleted = localStorage.getItem(`izledin_onboarded_${user.id}`);
        // S11: single canonical onboarding predicate (top-4 presence).
        if (!isCompleted && !isOnboarded(profile)) {
          const timer = setTimeout(() => {
            setIsTasteProfilerOpen(true);
          }, 700);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [user, profile]);

  const filteredMatches = matches.filter((m) => {
    if (selectedIntent !== 'all') {
      const intent = m.user.matchIntent || m.intent || 'friend';
      // 'both' members are open to every intent
      if (intent !== selectedIntent && intent !== 'both') return false;
    } else if (!datingVisible && intentOf(m) === 'dating') {
      return false;
    }
    // Filter on the candidate's OWN genres — sharedGenres is the pairwise
    // intersection, so searching a genre you don't personally have always
    // returned zero results.
    if (
      selectedGenre !== 'Hepsi' &&
      !(m.user.favoriteGenres || []).includes(selectedGenre)
    )
      return false;
    if (selectedAgeRange !== 'Hepsi') {
      if (!m.user.age) return false;
      if (selectedAgeRange === '18-24' && (m.user.age < 18 || m.user.age > 24)) return false;
      if (selectedAgeRange === '25-34' && (m.user.age < 25 || m.user.age > 34)) return false;
      if (selectedAgeRange === '35-44' && (m.user.age < 35 || m.user.age > 44)) return false;
      if (selectedAgeRange === '45+' && m.user.age < 45) return false;
    }
    if (selectedCity !== 'Hepsi') {
      // Turkish-aware casing: 'İstanbul'.toLowerCase() produces i̇stanbul
      // (i + combining dot) and never matches plain 'istanbul'.
      const trLower = (s: string) => s.toLocaleLowerCase('tr-TR');
      const userLoc = trLower(m.user.location || '');
      if (!userLoc.includes(trLower(selectedCity))) return false;
      if (
        selectedDistrict !== 'Hepsi' &&
        !userLoc.includes(trLower(selectedDistrict))
      )
        return false;
    }
    return true;
  });

  const showDeckNotice = (message: string) => {
    setDeckNotice(message);
    if (deckNoticeTimerRef.current) clearTimeout(deckNoticeTimerRef.current);
    deckNoticeTimerRef.current = setTimeout(() => setDeckNotice(null), 6000);
  };

  const handleLikeMatch = async (match: MovieMateMatch) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const result = await requestMatch(
      user.id,
      match.user.id,
      'pending',
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles
    );

    if (!result.ok || !result.matchId) {
      // Sticky rejection / S8 daily cap: calm Turkish feedback, no dead-end chat.
      showDeckNotice(
        result.rejected
          ? `@${match.user.username} bu eşleşmeye daha önce pas geçmiş. Yeni bir istek gönderilemedi.`
          : result.limitReached
            ? 'Günlük izdaş isteği sınırına ulaştın. Yarın tekrar dene.'
            : 'İstek gönderilemedi. Tekrar dene.'
      );
      return;
    }

    match.id = result.matchId;
    match.status = 'pending';
    match.initiatorId = user.id;

    setActiveChatMatch(match);
    setIsChatOpen(true);
  };

  // S15 BİLET: super-like with DB-side quota (free 1/day). Same flow as a
  // like, but flagged so the receiver sees the request came with a BİLET.
  const handleBiletMatch = async (match: MovieMateMatch) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const result = await requestMatch(
      user.id,
      match.user.id,
      'pending',
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles,
      true
    );

    if (!result.ok || !result.matchId) {
      showDeckNotice(
        result.rejected
          ? `@${match.user.username} bu eşleşmeye daha önce pas geçmiş. BİLET gönderilemedi.`
          : result.limitReached
            ? 'Günlük BİLET sınırına ulaştın (1). Kulüp üyeliği ile sınırsız.'
            : 'BİLET gönderilemedi. Tekrar dene.'
      );
      return;
    }

    showDeckNotice(`BİLET gönderildi — @${match.user.username} onayladığında sohbet açılır.`);
  };

  // ── Mobile swipe stack (< lg): the directory rendered as a single-card
  // deck over the FILTERED pool. Desktop keeps the grid — one consistent
  // experience per device: gestures where touch lives, scanning where the
  // pointer lives. Same S3 delayed-commit machinery as the home deck.
  const stackCommitPass = async (match: MovieMateMatch) => {
    if (!user || !match.user?.id) return;
    await createOrUpdateMatch(
      user.id,
      match.user.id,
      'passed',
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles
    );
  };
  const reinsertStackCard = (entry: DeckHistoryEntry) => {
    setMatches((prev) => {
      if (prev.some((m) => m.id === entry.match.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(entry.index, next.length), 0, entry.match);
      return next;
    });
  };
  const stackDeck = useSwipeDeck({
    onLikeCommit: (m) => handleLikeMatch(m),
    onPassGesture: (m) =>
      setMatches((prev) => prev.filter((x) => x.id !== m.id)),
    onPassCommit: (m) => stackCommitPass(m),
    onPassUndo: reinsertStackCard,
  });

  // Pool definition changed (tabs/filters/refetch) -> deal from the top.
  useEffect(() => {
    stackDeck.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedIntent,
    selectedGenre,
    selectedCity,
    selectedDistrict,
    selectedAgeRange,
    loading,
  ]);

  const stackCurrent = filteredMatches[stackDeck.index];

  // The match cards hand over only (title, posterUrl), so resolve the REAL
  // catalog entry by title before opening the detail modal. No invented
  // stand-in item — if the lookup finds nothing we say so plainly.
  const handleMovieClick = async (title: string, posterUrl: string) => {
    try {
      const results = await searchCatalog(title);
      const normalized = title.trim().toLocaleLowerCase('tr-TR');
      const realItem =
        results.find(
          (r) =>
            r.title.toLocaleLowerCase('tr-TR') === normalized ||
            r.originalTitle?.toLocaleLowerCase('tr-TR') === normalized,
        ) || null;
      if (!realItem) {
        showDeckNotice(`"${title}" için detay bulunamadı.`);
        return;
      }
      setDetailMediaItem(realItem);
      setIsMediaDetailOpen(true);
    } catch (err) {
      console.warn('handleMovieClick failed:', err);
      showDeckNotice(`"${title}" için detay bulunamadı.`);
    }
  };

  // Per-match undo timers — a single shared ref silently dropped every pass
  // except the most recent one when users passed several cards in a row.
  const gridUndoTimersRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleGridPass = (match: MovieMateMatch) => {
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
    setGridUndoToast(match);
    const existingTimer = gridUndoTimersRef.current.get(match.id);
    if (existingTimer) clearTimeout(existingTimer);
    const timer = setTimeout(() => {
      gridUndoTimersRef.current.delete(match.id);
      setGridUndoToast((current) => (current?.id === match.id ? null : current));
      if (user && !match.id.startsWith('prospective_')) {
        createOrUpdateMatch(
          user.id,
          match.user.id,
          'passed',
          match.compatibilityScore,
          match.sharedGenres,
          match.sharedTitles
        );
      }
    }, 4000);
    gridUndoTimersRef.current.set(match.id, timer);
  };

  const handleGridUndo = () => {
    if (!gridUndoToast) return;
    const timer = gridUndoTimersRef.current.get(gridUndoToast.id);
    if (timer) {
      clearTimeout(timer);
      gridUndoTimersRef.current.delete(gridUndoToast.id);
    }
    setMatches((prev) => [gridUndoToast, ...prev]);
    setGridUndoToast(null);
  };

  // S2 telemetry: fire ONCE per empty-radar transition so exhaustion rate can
  // gate future deck decisions (MATCHING-PIVOT-PLAN.md §S2).
  const radarEmpty = !loading && matches.length === 0;
  const exhaustedNotifiedRef = React.useRef(false);
  React.useEffect(() => {
    if (!radarEmpty) {
      exhaustedNotifiedRef.current = false;
      return;
    }
    if (exhaustedNotifiedRef.current) return;
    exhaustedNotifiedRef.current = true;
    trackEvent(TELEMETRY_EVENTS.RADAR_EXHAUSTED, {
      kind: 'empty_radar',
      pool_size: filteredMatches.length,
    });
  }, [radarEmpty, filteredMatches.length]);

  const resetFilters = () => {
    setSelectedCity('Hepsi');
    setSelectedDistrict('Hepsi');
    setSelectedGenre('Hepsi');
    setSelectedAgeRange('Hepsi');
  };

  const hasActiveFilters = 
    selectedCity !== 'Hepsi' || 
    selectedDistrict !== 'Hepsi' || 
    selectedGenre !== 'Hepsi' || 
    selectedAgeRange !== 'Hepsi';

  return (
    <div className="min-h-screen with-sidebar  bg-[#0A0A0A]  text-[#FAFAFA] flex flex-col justify-between selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar
        onOpenQuickLog={() => {
          setSelectedMedia(null);
          setIsQuickLogOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-5">

        {/* Compact masthead — the grid is the hero, chrome stays out of the way */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-sans text-white leading-none flex items-center gap-2.5">
            <span className="stamp-badge-solid px-2 py-1 text-xs font-black bg-[#EF4444] text-[#0A0A0A] shadow-[2px_2px_0px_#000000]">
              İZDAŞ
            </span>
            RADARI
          </h1>
          <p className="text-[11px] font-mono text-neutral-500 hidden sm:block">
            Aynı frekansı paylaşanları tara · BİLET'le öne çıkar
          </p>
        </div>

        {/* Seni Beğenenler — incoming requests surface Tinder-style */}
        {user && incomingRequests.length > 0 && (
          <div className="bg-[#171717] border-2 border-[#404040] p-3 flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#EF4444] shrink-0">
              SENİ BEĞENENLER ({incomingRequests.length})
            </span>
            <div className="flex items-center -space-x-2">
              {incomingRequests.slice(0, 8).map((item) => (
                <button
                  key={item.matchId}
                  type="button"
                  onClick={() => {
                    setInboxInitialTab('requests');
                    setIsInboxOpen(true);
                  }}
                  title={`@${item.partner.username}${item.isBiletForMe ? ' — BİLETLE geldi' : ''}`}
                  aria-label={`@${item.partner.username} profilini gelen kutusunda aç`}
                  className="relative shrink-0 cursor-pointer hover:z-10 hover:-translate-y-0.5 transition-transform"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.partner.avatarUrl}
                    alt={item.partner.fullName}
                    width={40}
                    height={40}
                    loading="lazy"
                    className="w-10 h-10 object-cover border-2 border-[#404040] hover:border-[#EF4444] bg-black"
                  />
                  {item.isBiletForMe && (
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0 bg-[#F59E0B] text-[#0A0A0A] text-[9px] font-black border border-[#0A0A0A] leading-tight">
                      BİLET
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setInboxInitialTab('requests');
                setIsInboxOpen(true);
              }}
              className="ml-auto text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white shrink-0 cursor-pointer"
            >
              TÜMÜ →
            </button>
          </div>
        )}

        {/* Intent Tabs Navigation Bar (Film Arkadaşlığı vs Sinematik Flört) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3  bg-[#171717] p-2 border-2 sm:border-4  border-[#404040]  shadow-[5px_5px_0px_#000000] font-mono">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedIntent('all')}
              className={`px-2 sm:px-3.5 py-2.5 min-h-[44px] text-[10px] sm:text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center text-center ${
                selectedIntent === 'all'
                  ? ' bg-[#EF4444] text-white  shadow-[2px_2px_0px_#000000]'
                  : '  text-neutral-400 hover:text-[#FAFAFA]'
              }`}
            >
              TÜMÜ ({matches.filter((m) => datingVisible || intentOf(m) !== 'dating').length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedIntent('friend')}
              className={`px-2 sm:px-3.5 py-2.5 min-h-[44px] text-[10px] sm:text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
                selectedIntent === 'friend'
                  ? 'bg-[#10B981] text-[#0A0A0A]  shadow-[2px_2px_0px_#000000]'
                  : '  text-neutral-400 hover:text-[#10B981]'
              }`}
            >
              <CinemaFriendshipIcon size={14} className="shrink-0" />
              <span className="truncate">Film Arkadaşı ({matches.filter(m => (m.user.matchIntent || m.intent || 'friend') === 'friend').length})</span>
            </button>

            {datingVisible && (
            <button
              type="button"
              onClick={() => setSelectedIntent('dating')}
              className={`px-2 sm:px-3.5 py-2.5 min-h-[44px] text-[10px] sm:text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
                selectedIntent === 'dating'
                  ? 'bg-[#E11D48] text-white  shadow-[2px_2px_0px_#000000]'
                  : '  text-neutral-400 hover:text-[#E11D48]'
              }`}
            >
              <CinemaRomanceIcon size={14} className="shrink-0" />
              <span className="truncate">Sinematik Flört ({matches.filter(m => (m.user.matchIntent || m.intent) === 'dating').length})</span>
            </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedIntent('both')}
              className={`px-2 sm:px-3.5 py-2.5 min-h-[44px] text-[10px] sm:text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
                selectedIntent === 'both'
                  ? 'bg-[#F59E0B] text-[#0A0A0A]  shadow-[2px_2px_0px_#000000]'
                  : '  text-neutral-400 hover:text-[#F59E0B]'
              }`}
            >
              <CinemaDuoIntentIcon size={14} className="shrink-0" />
              <span className="truncate">Fark etmez ({matches.filter(m => (m.user.matchIntent || m.intent) === 'both').length})</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar — Distilled & Ergonomic */}
        <div className=" bg-[#171717]  text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3  shadow-[6px_6px_0px_#000000] font-mono">
          
          {/* Left: Quick Genre & Detailed Filter Trigger */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Genre Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase  text-[#EF4444] hidden sm:inline">TÜR:</span>
              <select
                aria-label="Film Türü Filtresi"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="h-11 min-h-[44px]  bg-[#262626] border-2  border-[#404040] px-3 py-2 text-xs font-black uppercase  text-[#FAFAFA] focus:outline-none  focus:border-[#EF4444] cursor-pointer"
              >
                <option value="Hepsi">TÜM TÜRLER</option>
                {POPULAR_GENRES.map((g) => (
                  <option key={g} value={g}>{g.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Detailed Filter Button Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-label="Detaylı Filtreleri Aç"
              className={`h-11 min-h-[44px] px-3.5 border-2  border-[#404040] text-xs font-black uppercase flex items-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                (selectedCity !== 'Hepsi' || selectedDistrict !== 'Hepsi' || selectedAgeRange !== 'Hepsi')
                  ? 'bg-[#DC2626] text-white shadow-[2px_2px_0px_#000000]'
                  : ' bg-[#262626]  hover:bg-[#333333]  text-[#FAFAFA]  shadow-[2px_2px_0px_#000000]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>DETAYLI FİLTRE</span>
              {(selectedCity !== 'Hepsi' || selectedDistrict !== 'Hepsi' || selectedAgeRange !== 'Hepsi') && (
                <span className="px-1.5 py-0.5 text-[10px] font-black bg-white text-[#0A0A0A]">
                  {(selectedCity !== 'Hepsi' ? 1 : 0) + (selectedDistrict !== 'Hepsi' ? 1 : 0) + (selectedAgeRange !== 'Hepsi' ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                aria-label="Filtreleri Sıfırla"
                className="h-11 min-h-[44px] px-3  bg-[#262626]  hover:bg-[#333333] border-2  border-[#404040] text-xs font-black uppercase  text-[#EF4444] cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Filtreleri Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sıfırla</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-between md:justify-end flex-wrap">
            <div className="flex items-center gap-2">
              {profile?.isPremium && (
                <span className="px-2 py-1 text-[11px] font-black uppercase font-mono border bg-amber-500/10 text-amber-500 border-amber-500">
                  İZLEDİN+ KULÜP
                </span>
              )}
              <span className="text-xs font-black uppercase  text-[#A3A3A3]">
                {filteredMatches.length} İZDAŞ
              </span>
            </div>

            <button
              onClick={() => fetchMatches(true)}
              disabled={loading}
              aria-label="Radarı Yenile"
              className="h-11 min-h-[44px] px-3  bg-[#262626]  hover:bg-[#333333] border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] text-xs font-black uppercase  text-[#FAFAFA] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Radarı Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin  text-[#EF4444]' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>

        </div>

        {/* Matches Grid / Single Deck & Rich Hardened Empty States */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 font-mono">
            <Loader2 className="w-10 h-10  text-[#EF4444] animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest  text-[#FAFAFA]">
              RADAR TARANIYOR...
            </span>
          </div>
        ) : matches.length === 0 ? (
          /* STATE B: EMPTY RADAR — no daily-limit framing, no upsell: no
             discovery cap exists that could have been "completed". */
          <div className="py-12 text-center  bg-[#171717]  text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[6px_6px_0px_#EF4444] p-6 sm:p-8 font-mono space-y-5">
            <CinemaRadarScannerIllustration size={64} className="mx-auto" />
            
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight  text-[#FAFAFA] pt-2">
                ŞU AN RADARDA İZDAŞ YOK
              </h3>
              <p className="text-xs  text-[#A3A3A3] font-bold leading-relaxed">
                Sinema DNA'nla eşleşen bir profil bulunamadı. DNA'nı güncelleyerek yeni türler ekleyebilir veya radarı yeniden tarayabilirsin.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthOpen(true);
                  } else {
                    setIsTasteProfilerOpen(true);
                  }
                }}
                className="h-11 min-h-[44px] px-5   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              >
                <CinemaDnaHelixIcon size={16} className=" text-[#0A0A0A]" />
                <span>SİNEMA DNA'SINI GÜNCELLE</span>
              </button>

              <button
                onClick={() => fetchMatches(true)}
                className="h-11 min-h-[44px] px-4  bg-[#262626]  hover:bg-[#333333]  text-[#FAFAFA] text-xs font-black uppercase border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Radarı Yeniden Tara</span>
              </button>

              {/* Discovery loop: empty radar sends you back to the deck */}
              <Link
                href="/"
                className="h-11 min-h-[44px] px-4 bg-[#171717] hover:bg-[#262626] text-[#FAFAFA] text-xs font-black uppercase border-2 border-[#404040] shadow-[2px_2px_0px_#000000] transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                PERDEYE DÖN
              </Link>
            </div>
          </div>
        ) : filteredMatches.length === 0 ? (
          /* STATE A: FILTER MISMATCH EMPTY STATE */
          <div className="py-12 text-center  bg-[#171717]  text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[6px_6px_0px_#000000] p-6 sm:p-8 font-mono space-y-4">
            <CinemaRadarScannerIllustration size={64} className="mx-auto" />

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight  text-[#FAFAFA]">
                BU KRİTERLERE UYGUN İZDAŞ BULUNAMADI
              </h3>
              <p className="text-xs  text-[#A3A3A3] font-bold">
                Şehir, yaş veya tür filtrelerini sıfırlayarak daha fazla İzdaş keşfedebilirsin.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={resetFilters}
                className="h-11 min-h-[44px] px-5   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>FİLTRELERİ SIFIRLA</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ≥lg: directory grid — pointer-native scanning */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                {filteredMatches.map((match) => (
                  <div key={match.id} className="h-full flex flex-col">
                    <MatchCard
                      match={match}
                      onLike={handleLikeMatch}
                      onPass={handleGridPass}
                      onBilet={handleBiletMatch}
                      onMovieClick={handleMovieClick}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* <lg: single-card swipe stack over the filtered pool —
                gesture-native, same delayed-commit machinery as PERDE */}
            <div className="lg:hidden max-w-md mx-auto w-full pb-24">
              {stackCurrent ? (
                <>
                  <SwipeMatchCard
                    match={stackCurrent}
                    nextMatch={filteredMatches[stackDeck.index + 1]}
                    onLike={(m) => stackDeck.swipeLike(m)}
                    onPass={(m) => stackDeck.swipePass(m)}
                    onChatClick={() => {}}
                  />
                  <div className="flex items-center justify-between font-mono text-[11px] font-black uppercase mt-3">
                    <span className="text-neutral-500">
                      KART {Math.min(stackDeck.index + 1, filteredMatches.length)} /{' '}
                      {filteredMatches.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => stackDeck.undo()}
                      disabled={!stackDeck.canUndo}
                      className="text-[#EF4444] disabled:text-neutral-600 hover:text-white transition-colors cursor-pointer disabled:cursor-default"
                    >
                      ⟲ GERİ AL
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center bg-[#171717] border-2 border-[#404040] p-6 font-mono space-y-4">
                  <p className="text-xs font-black uppercase text-[#FAFAFA] tracking-wider">
                    BU HAVUZDA KART KALMADI
                  </p>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Filtreleri sıfırlayarak havuzu genişlet veya radarı yenile.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-11 min-h-[44px] px-5 bg-[#EF4444] hover:bg-[#DC2626] text-[#0A0A0A] text-xs font-black uppercase border-2 border-[#404040] shadow-[3px_3px_0px_#000000] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>FİLTRELERİ SIFIRLA</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Transient Grid Mode Undo Toast (P3 harden) */}
        {gridUndoToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white border-2 border-white shadow-[4px_4px_0px_#DC2626] px-4 py-3 font-mono text-xs flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-150">
            <span className="font-bold truncate max-w-[200px]">
              @{gridUndoToast.user.username} pas geçildi.
            </span>
            <button
              type="button"
              onClick={handleGridUndo}
              className="px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black uppercase border border-white text-[11px] cursor-pointer flex items-center gap-1"
            >
              <Undo2 className="w-3 h-3" />
              <span>Geri Al</span>
            </button>
          </div>
        )}

        {/* Failed-like notice (sticky rejection / RPC failure) */}
        {deckNotice && (
          <div
            role="status"
            className="fixed bottom-6 left-6 z-50 bg-[#0A0A0A] text-white border-2 border-[#404040] shadow-[4px_4px_0px_#DC2626] px-4 py-3 font-mono text-xs flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-150 max-w-sm"
          >
            <CinemaTrustShieldIcon size={14} className="text-[#EF4444] shrink-0 mt-0.5" />
            <span className="font-bold leading-snug">{deckNotice}</span>
            <button
              type="button"
              onClick={() => setDeckNotice(null)}
              aria-label="Bildirimi kapat"
              className="text-neutral-400 hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </main>

      <Footer />

      {/* Detaylı Filtre Modal / Drawer */}
      {isFilterDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div 
            className="w-full max-w-md  bg-[#171717]  text-[#FAFAFA] border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2  border-[#404040]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5  text-[#EF4444]" />
                <h3 className="text-sm font-black uppercase tracking-tight font-sans">
                  DETAYLI SİNEFİL FİLTRESİ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Filtreleri Kapat"
                className="w-9 h-9 flex items-center justify-center border-2  border-[#404040] hover:bg-[#DC2626] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Şehir */}
              <div className="space-y-1.5">
                <label className="font-black uppercase  text-[#A3A3A3] block">
                  Şehir:
                </label>
                <select
                  aria-label="Şehir Seçimi"
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedDistrict('Hepsi');
                  }}
                  className="w-full h-11  bg-[#262626] border-2  border-[#404040] px-3 font-bold uppercase  text-[#FAFAFA] focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="Hepsi">TÜM ŞEHİRLER</option>
                  {provinces.map((city) => (
                    <option key={city} value={city}>{city.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* İlçe */}
              {selectedCity !== 'Hepsi' && cityDistricts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-black uppercase  text-[#A3A3A3] block">
                    İlçe:
                  </label>
                  <select
                    aria-label="İlçe Seçimi"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-11  bg-[#262626] border-2  border-[#404040] px-3 font-bold uppercase  text-[#FAFAFA] focus:outline-none focus:border-[#DC2626]"
                  >
                    <option value="Hepsi">TÜM İLÇELER</option>
                    {cityDistricts.map((d) => (
                      <option key={d} value={d}>{d.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Yaş Aralığı */}
              <div className="space-y-1.5">
                <label className="font-black uppercase  text-[#A3A3A3] block">
                  Yaş Aralığı:
                </label>
                <select
                  aria-label="Yaş Grubu Seçimi"
                  value={selectedAgeRange}
                  onChange={(e) => setSelectedAgeRange(e.target.value)}
                  className="w-full h-11  bg-[#262626] border-2  border-[#404040] px-3 font-bold uppercase  text-[#FAFAFA] focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="Hepsi">TÜM YAŞLAR</option>
                  <option value="18-24">18 - 24 YAŞ</option>
                  <option value="25-34">25 - 34 YAŞ</option>
                  <option value="35-44">35 - 44 YAŞ</option>
                  <option value="45+">45+ YAŞ</option>
                </select>
                {selectedAgeRange !== 'Hepsi' && (
                  <p className="text-[10px] text-neutral-500 leading-snug">
                    Yaşını gizleyen üyeler bu filtrede görünmez.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t-2  border-[#404040]">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2.5  bg-[#262626] hover:bg-[#E5E5E5]  text-[#EF4444] text-xs font-black uppercase border  border-[#404040] cursor-pointer"
              >
                Sıfırla
              </button>
              {/* Filters apply live — this is just an honest close. */}
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-2.5   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                TAMAM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ChatModal
        match={activeChatMatch}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onRequestSent={(sentMatch) => {
          setIsChatOpen(false);
          setMatches((prev) =>
            prev.filter(
              (m) =>
                m.id !== sentMatch.id && m.user.id !== sentMatch.user.id,
            ),
          );
          showDeckNotice(
            `@${sentMatch.user.username} kullanıcısına İzdaşlık isteğiniz iletildi.`,
          );
        }}
      />

      {user ? (
        <CinemaDnaModal
          isOpen={isTasteProfilerOpen}
          onClose={() => setIsTasteProfilerOpen(false)}
        />
      ) : (
        <TasteProfilerModal
          isOpen={isTasteProfilerOpen}
          onClose={() => setIsTasteProfilerOpen(false)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

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

      <MediaDetailModal
        item={detailMediaItem}
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

      <InboxModal
        isOpen={isInboxOpen}
        initialTab={inboxInitialTab}
        onClose={() => {
          setIsInboxOpen(false);
          if (user) {
            getInboxSummary(user.id).then((summary) => setUnreadInboxCount(summary.totalUnreadCount)).catch(() => {});
          }
        }}
        onOpenChat={(match) => {
          setActiveChatMatch(match);
          setIsChatOpen(true);
        }}
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

