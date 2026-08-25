"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Flame,
  Star,
  Plus,
  ArrowRight,
  Heart,
  Calendar,
  MessageSquare,
  Bookmark,
  Check,
  Loader2,
  Shuffle,
  Info,
  Search,
  X,
  Crown,
  Undo2,
} from "lucide-react";
import {
  MasterpieceLaurelIcon,
  FilmReelIcon,
  ClapperboardIcon,
  CinemaStarIcon,
  CinemaFlameIcon,
  CinemaPopcornIcon,
  IzledinPlusBadge,
  CinemaRadarScannerIllustration,
} from "@/components/icons/CinemaIcons";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MediaCard } from "@/components/media/MediaCard";
import { MatchCard } from "@/components/matches/MatchCard";
import { SwipeMatchCard } from "@/components/matches/SwipeMatchCard";

const QuickLogModal = dynamic(
  () => import("@/components/media/QuickLogModal").then((mod) => mod.QuickLogModal),
  { ssr: false }
);
const LogDetailModal = dynamic(
  () => import("@/components/community/LogDetailModal").then((mod) => mod.LogDetailModal),
  { ssr: false }
);
const MediaDetailModal = dynamic(
  () => import("@/components/media/MediaDetailModal").then((mod) => mod.MediaDetailModal),
  { ssr: false }
);
const SearchModal = dynamic(
  () => import("@/components/media/SearchModal").then((mod) => mod.SearchModal),
  { ssr: false }
);
const ChatModal = dynamic(
  () => import("@/components/matches/ChatModal").then((mod) => mod.ChatModal),
  { ssr: false }
);
const InboxModal = dynamic(
  () => import("@/components/inbox/InboxModal").then((mod) => mod.InboxModal),
  { ssr: false }
);
const TasteProfilerModal = dynamic(
  () => import("@/components/onboarding/TasteProfilerModal").then((mod) => mod.TasteProfilerModal),
  { ssr: false }
);
const CinemaDnaModal = dynamic(
  () => import("@/components/profile/CinemaDnaModal").then((mod) => mod.CinemaDnaModal),
  { ssr: false }
);
const PremiumModal = dynamic(
  () => import("@/components/premium/PremiumModal").then((mod) => mod.PremiumModal),
  { ssr: false }
);
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false }
);

import { useAuth } from "@/context/AuthContext";
import {
  getTrendingMedia,
  getMasterpieceOfTheWeekSync,
  STATIC_MASTER_CATALOG,
  normalizeTurkishText,
} from "@/lib/omdb";
import {
  getCommunityWatchLogs,
  toggleWatchLogLike,
  getUserLikedLogIds,
  getUserWatchLogs,
  getWeeklyFeaturedMasterpiece,
  toggleWatchlistItem,
} from "@/lib/services/watch-logs.service";
import {
  computeDiscoverMatches,
  createOrUpdateMatch,
  requestMatch,
} from "@/lib/services/matches.service";
import { POPULAR_GENRES } from "@/lib/constants";
import {
  sortMediaCatalog,
  getOrCreateDiscoverySeed,
  DiscoverySortOption,
} from "@/lib/algorithms/discovery";
import { MediaItem, MovieMateMatch, WatchLog, Profile } from "@/types";
import { useSwipeDeck, type DeckHistoryEntry } from "@/hooks/useSwipeDeck";

export default function HomePage() {
  const { user, profile } = useAuth();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    STATIC_MASTER_CATALOG,
  );
  const [discoverySeed, setDiscoverySeed] = useState<string>(() =>
    typeof window !== "undefined" ? getOrCreateDiscoverySeed() : "default_seed"
  );
  const [logs, setLogs] = useState<WatchLog[]>([]);
  const [likedLogIds, setLikedLogIds] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<MovieMateMatch[]>([]);
  const DISCOVERY_PAGE_SIZE = 15;
  const [selectedGenre, setSelectedGenre] = useState<string>("Hepsi");
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv" | "anime">(
    "all",
  );
  const [sortBy, setSortBy] = useState<DiscoverySortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(DISCOVERY_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Modals state
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [quickLogItem, setQuickLogItem] = useState<MediaItem | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [detailLog, setDetailLog] = useState<WatchLog | null>(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTasteProfilerOpen, setIsTasteProfilerOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeChatMatch, setActiveChatMatch] = useState<MovieMateMatch | null>(
    null,
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('izledin_cached_featured_masterpiece');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id && parsed?.title) return parsed;
        }
      } catch {}
    }
    return getMasterpieceOfTheWeekSync();
  });

  // Real watchlist state for the discovery grid (media_ids the user has
  // watchlisted) + transient toast feedback for card actions.
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const watchlistPendingRef = React.useRef<Set<string>>(new Set());
  const [cardToast, setCardToast] = useState<string | null>(null);
  const cardToastTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const showCardToast = (msg: string) => {
    setCardToast(msg);
    if (cardToastTimerRef.current) clearTimeout(cardToastTimerRef.current);
    cardToastTimerRef.current = setTimeout(() => setCardToast(null), 3000);
  };

  // 1. Fetch real media catalog for selected active tab
  useEffect(() => {
    setLoading(true);
    getTrendingMedia(activeTab)
      .then((items) => {
        setMediaItems(items);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTab]);

  // 1b. On client mount: fetch live featured masterpiece and update cache seamlessly
  useEffect(() => {
    getWeeklyFeaturedMasterpiece().then((masterpiece) => {
      if (masterpiece && masterpiece.id) {
        setFeaturedMedia((prev) => {
          if (
            prev?.id === masterpiece.id &&
            prev?.title === masterpiece.title
          ) {
            return prev;
          }
          return masterpiece;
        });
        try {
          localStorage.setItem(
            'izledin_cached_featured_masterpiece',
            JSON.stringify(masterpiece),
          );
        } catch {}
      }
    });
  }, []);

  // 2. Fetch real Community Watch Logs from Supabase with Social Ranking Algorithm
  useEffect(() => {
    getCommunityWatchLogs(6, 0, "trending").then((fetchedLogs) => {
      setLogs(fetchedLogs);
    });
  }, []);

  // 3. Compute Real-time Movie-Mate Matches
  useEffect(() => {
    if (!user || !profile) {
      setMatches([]);
      return;
    }

    // Don't compute matches if they haven't completed their DNA/Onboarding
    if (!profile.favoriteGenres?.length || !profile.top4Favorites?.length) {
      setMatches([]);
      return;
    }

    computeDiscoverMatches(profile, "all", 6).then((computed) => {
      setMatches(computed.slice(0, 3));
    });
  }, [profile, user]);

  // 4. Auto-trigger Onboarding for new or incomplete profiles
  useEffect(() => {
    if (user) {
      getUserLikedLogIds(user.id).then((likedSet) => setLikedLogIds(likedSet));
    } else {
      setLikedLogIds(new Set());
    }

    if (user && profile) {
      try {
        const isCompleted = localStorage.getItem(
          `izledin_onboarded_${user.id}`,
        );
        if (
          !isCompleted &&
          (!profile.favoriteGenres?.length || !profile.top4Favorites?.length)
        ) {
          const timer = setTimeout(() => {
            setIsTasteProfilerOpen(true);
          }, 700);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [user, profile]);

  // 4b. Load the signed-in user's real watchlist ids so the grid's bookmark
  // buttons reflect actual state instead of a local guess.
  useEffect(() => {
    if (!user) {
      setWatchlistIds(new Set());
      return;
    }
    let cancelled = false;
    getUserWatchLogs(user.id).then((logs) => {
      if (cancelled) return;
      setWatchlistIds(
        new Set(
          logs
            .filter((l) => l.status === "watchlist")
            .map((l) => l.mediaId),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleToggleWatchlist = async (item: MediaItem) => {
    if (!user) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }
    // Ignore re-clicks while the same item's request is in flight.
    if (watchlistPendingRef.current.has(item.id)) return;

    const wasWatchlisted = watchlistIds.has(item.id);
    const nextSet = new Set(watchlistIds);
    if (wasWatchlisted) nextSet.delete(item.id);
    else nextSet.add(item.id);
    setWatchlistIds(nextSet); // optimistic flip
    watchlistPendingRef.current.add(item.id);

    try {
      await toggleWatchlistItem(user.id, item);
      showCardToast(
        wasWatchlisted
          ? `"${item.title}" izleme listenden çıkarıldı.`
          : `"${item.title}" izleme listene eklendi.`,
      );
    } catch (err) {
      console.warn("toggleWatchlistItem failed:", err);
      // Roll the optimistic flip back — never show state that was not saved.
      setWatchlistIds(watchlistIds);
      showCardToast(
        "İzleme listesi güncellenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      watchlistPendingRef.current.delete(item.id);
    }
  };

  const activeFeatured: MediaItem = featuredMedia || mediaItems[0];

  const filteredMedia = React.useMemo(() => {
    const filtered = mediaItems.filter((item) => {
      if (activeTab !== "all" && item.type !== activeTab) return false;
      if (selectedGenre !== "Hepsi") {
        const match = item.genres.some(
          (g) =>
            g.toLowerCase() === selectedGenre.toLowerCase() ||
            g.toLowerCase().includes(selectedGenre.toLowerCase()) ||
            selectedGenre.toLowerCase().includes(g.toLowerCase()),
        );
        if (!match) return false;
      }
      if (catalogSearch.trim()) {
        const q = normalizeTurkishText(catalogSearch);
        const matchQuery =
          normalizeTurkishText(item.title).includes(q) ||
          (item.originalTitle && normalizeTurkishText(item.originalTitle).includes(q)) ||
          (item.director && normalizeTurkishText(item.director).includes(q)) ||
          (item.actors && normalizeTurkishText(item.actors).includes(q)) ||
          (item.year && item.year.toString().includes(q)) ||
          item.genres.some((g) => normalizeTurkishText(g).includes(q));
        if (!matchQuery) return false;
      }
      return true;
    });

    return sortMediaCatalog(filtered, sortBy, profile, discoverySeed);
  }, [mediaItems, activeTab, selectedGenre, catalogSearch, sortBy, profile, discoverySeed]);

  const displayedMedia = filteredMedia.slice(0, visibleCount);

  const handleOpenLog = (item: MediaItem) => {
    setQuickLogItem(item);
    setIsQuickLogOpen(true);
  };

  const handleOpenDetail = (item: MediaItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 500);
    const newSeed = getOrCreateDiscoverySeed(user?.id, true);
    setDiscoverySeed(newSeed);
    setVisibleCount(DISCOVERY_PAGE_SIZE);
  };

  const handleSaveLog = (newLog: WatchLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleLike = async (logId: string) => {
    if (!user) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }

    const isCurrentlyLiked = likedLogIds.has(logId);
    const newLikedSet = new Set(likedLogIds);
    if (isCurrentlyLiked) {
      newLikedSet.delete(logId);
    } else {
      newLikedSet.add(logId);
    }
    setLikedLogIds(newLikedSet);

    // Optimistic counter update
    setLogs((prev) =>
      prev.map((l) => {
        if (l.id === logId) {
          const count = l.likesCount || 0;
          return {
            ...l,
            likesCount: isCurrentlyLiked ? Math.max(0, count - 1) : count + 1,
          };
        }
        return l;
      }),
    );

    const res = await toggleWatchLogLike(logId, user.id);
    if (res) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId ? { ...l, likesCount: res.newCount } : l,
        ),
      );
    }
  };

  const handleOpenChat = (match: MovieMateMatch) => {
    if (!user) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }
    setActiveChatMatch(match);
    setIsChatOpen(true);
  };

  const handleMatchLike = async (match: MovieMateMatch) => {
    if (!user) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }

    // requestMatch distinguishes sticky rejections (the OTHER person passed
    // earlier; only they can revive the pair). No dead-end chat modal — calm
    // Turkish feedback instead (same pattern as the matches page).
    const result = await requestMatch(
      user.id,
      match.user.id,
      "pending",
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles,
    );
    if (!result.ok || !result.matchId) {
      showCardToast(
        result.rejected
          ? `@${match.user.username} bu eşleşmeye daha önce pas geçmiş. Yeni bir mesaj isteği gönderilemedi.`
          : "Eşleşme talebi gönderilemedi. Lütfen tekrar deneyin.",
      );
      return;
    }
    match.id = result.matchId;
    match.status = "pending";
    match.initiatorId = user.id;

    setActiveChatMatch(match);
    setIsChatOpen(true);
  };

  const handleMatchPass = async (match: MovieMateMatch) => {
    if (user) {
      await createOrUpdateMatch(
        user.id,
        match.user.id,
        "passed",
        match.compatibilityScore,
        match.sharedGenres,
        match.sharedTitles,
      );
    }
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
  };

  // ---------------------------------------------------------------------------
  // S3: home deck persistence moved behind useSwipeDeck's undo window (4s).
  // Swipes are local until the window closes, so GERİ AL truly reverses —
  // no 'passed' row or pending request survives an undone swipe. This also
  // fixes the old pass handler's skipped card (it removed the card AND
  // advanced the index). Commit-time likes intentionally do NOT auto-open
  // chat; mutual matches announce via the global MatchAcceptedToast.
  // ---------------------------------------------------------------------------
  const commitHomeDeckLike = async (match: MovieMateMatch) => {
    if (!user) return;
    const result = await requestMatch(
      user.id,
      match.user.id,
      "pending",
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles,
    );
    if (!result.ok || !result.matchId) {
      showCardToast(
        result.rejected
          ? `@${match.user.username} bu eşleşmeye daha önce pas geçmiş. Yeni bir mesaj isteği gönderilemedi.`
          : "Eşleşme talebi gönderilemedi. Lütfen tekrar deneyin.",
      );
      return;
    }
    match.id = result.matchId;
    match.status = "pending";
    match.initiatorId = user.id;
  };

  const commitHomeDeckPass = async (match: MovieMateMatch) => {
    if (!user || !match.user?.id) return;
    await createOrUpdateMatch(
      user.id,
      match.user.id,
      "passed",
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles,
    );
  };

  const removeCardFromRadar = (match: MovieMateMatch) => {
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
  };

  const reinsertPassedCard = (entry: DeckHistoryEntry) => {
    setMatches((prev) => {
      if (prev.some((m) => m.id === entry.match.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(entry.index, next.length), 0, entry.match);
      return next;
    });
  };

  const homeDeck = useSwipeDeck({
    onLikeCommit: commitHomeDeckLike,
    onPassGesture: removeCardFromRadar,
    onPassCommit: commitHomeDeckPass,
    onPassUndo: reinsertPassedCard,
  });
  const { index: activeHomeDeckIndex } = homeDeck;

  const handleHomeDeckLike = (match: MovieMateMatch) => homeDeck.swipeLike(match);
  const handleHomeDeckPass = (match: MovieMateMatch) => homeDeck.swipePass(match);
  const handleHomeDeckUndo = () => {
    homeDeck.undo();
  };
  const handleHomeDeckReset = () => homeDeck.reset();

  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      {/* Top Navigation */}
      <Navbar
        onOpenQuickLog={() => handleOpenLog(activeFeatured)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-16">
        {/* ========================================================================= */}
        {/* 1. CINEMA MARQUEE DOUBLE-FEATURE HERO (2:3 VERTICAL POSTER MASTERPIECE)   */}
        {/* ========================================================================= */}
        <section className=" bg-[#0A0A0A]  text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-5 sm:p-7 md:p-9 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center relative z-10">
            {/* 2:3 Vertical Masterpiece Poster Frame (Mobile centered, Desktop Left) */}
            <div className="lg:col-span-4 xl:col-span-4 flex justify-center lg:justify-start">
              <div
                role="button"
                tabIndex={0}
                aria-label={`${activeFeatured.title} - Haftanın Başyapıtı Detayları`}
                onClick={() => handleOpenDetail(activeFeatured)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenDetail(activeFeatured);
                  }
                }}
                className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none aspect-[2/3] border-4  border-[#FAFAFA] bg-black  shadow-[6px_6px_0px_#EF4444] overflow-hidden cursor-pointer group select-none focus:outline-none focus:ring-4 focus:ring-[#DC2626]"
              >
                <img
                  src={activeFeatured.posterPath || activeFeatured.backdropPath}
                  alt={activeFeatured.title}
                  width={400}
                  height={600}
                  fetchPriority="high"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (
                      activeFeatured.backdropPath &&
                      target.src !== activeFeatured.backdropPath
                    ) {
                      target.src = activeFeatured.backdropPath;
                    }
                  }}
                  className="w-full h-full object-cover object-center filter contrast-105 brightness-95 group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                  decoding="sync"
                />

                {/* Subtle cinematic gradient vignette for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Vintage Stamped Marks */}
                <div className="absolute top-3 left-3 stamp-badge-solid px-2.5 py-1 text-[11px] font-black  bg-[#0A0A0A]  text-[#EF4444] border-2  border-white flex items-center gap-1.5  shadow-[2px_2px_0px_#000000]">
                  <MasterpieceLaurelIcon
                    size={14}
                    className=" text-[#EF4444]"
                  />
                  <span>HAFTANIN BAŞYAPITI</span>
                </div>

                {/* Sleek Bespoke IMDb Rating Badge */}
                <div className="absolute bottom-3 right-3 flex items-center border-2 border-black shadow-[3px_3px_0px_#000000] overflow-hidden select-none">
                  <span className="bg-[#F5C518] text-black font-black text-[11px] px-2 py-0.5 tracking-tight font-sans uppercase">
                    IMDb
                  </span>
                  {typeof activeFeatured.voteAverage === "number" && (
                    <span className="bg-[#121212] text-white font-mono font-black text-xs px-2 py-0.5 tracking-tight flex items-center gap-0.5">
                      <span className="text-[#F5C518]">
                        {activeFeatured.voteAverage.toFixed(1)}
                      </span>
                      <span className="text-neutral-400 text-[10px]">/10</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Editorial Copy & Actions */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4 sm:space-y-5 font-mono text-left">
              <div className="flex items-center gap-2 flex-wrap">
                {activeFeatured.director && (
                  <span className="px-2.5 py-1  bg-neutral-900  text-neutral-300 text-xs font-bold border  border-neutral-700">
                    YÖNETMEN: {activeFeatured.director.toUpperCase()}
                  </span>
                )}
                {activeFeatured.year && (
                  <span className="px-2.5 py-1  bg-neutral-900  text-neutral-300 text-xs font-bold border  border-neutral-700">
                    {activeFeatured.year}{" "}
                    {activeFeatured.duration
                      ? `• ${activeFeatured.duration}`
                      : ""}
                  </span>
                )}
                {activeFeatured.genres && activeFeatured.genres.length > 0 && (
                  <span className="px-2.5 py-1 bg-[#DC2626]/20  text-[#EF4444] text-xs font-black border border-[#DC2626]/40 uppercase">
                    {activeFeatured.genres.slice(0, 2).join(" / ")}
                  </span>
                )}
              </div>

              <h1
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDetail(activeFeatured)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenDetail(activeFeatured);
                  }
                }}
                className="text-3xl sm:text-4xl md:text-5xl font-black  text-white tracking-tight uppercase leading-none font-sans cursor-pointer  hover:text-[#EF4444] transition-colors focus:outline-none focus:underline"
              >
                {activeFeatured.title}
              </h1>

              {activeFeatured.awards && (
                <div className="text-xs font-black text-[#F59E0B] flex items-center gap-1.5 font-mono">
                  <MasterpieceLaurelIcon size={14} className="text-[#F59E0B]" />
                  <span>{activeFeatured.awards}</span>
                </div>
              )}

              {activeFeatured.actors && (
                <p className="text-xs  text-neutral-300 font-medium font-mono">
                  <span className=" text-[#A3A3A3] font-bold">
                    KADRO:{" "}
                  </span>
                  {activeFeatured.actors}
                </p>
              )}

              <p className="text-xs sm:text-sm  text-neutral-300 leading-relaxed line-clamp-3 sm:line-clamp-4 font-sans font-medium">
                &ldquo;{activeFeatured.overview}&rdquo;
              </p>

              {/* Action Buttons: Full width on mobile, inline on tablet/desktop */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => handleOpenLog(activeFeatured)}
                  className="min-h-[48px] px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2  border-white  shadow-[3px_3px_0px_#FFFFFF]  hover:shadow-[1px_1px_0px_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>İzledim & Günlüğe Yaz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDetail(activeFeatured)}
                  className="min-h-[48px] px-5 py-3.5   bg-neutral-900 hover:bg-neutral-800  text-white text-xs font-black uppercase tracking-wider border-2  border-neutral-700  shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  <span>Filmi İncele</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SANA ÖZEL İZDAŞLAR                                                    */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-4  border-[#404040] pb-3">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black  text-[#FAFAFA] uppercase tracking-tight font-sans">
                SANA ÖZEL İZDAŞLAR
              </h2>
              <p className="text-xs sm:text-sm  text-neutral-400 font-mono mt-1">
                Film zevkine yakın insanları keşfet. Ortak filmler, favori 4
                başyapıt ve yönetmen frekansı ile eşleşen sinefiller.
              </p>
            </div>

            <Link
              href="/matches"
              className="font-mono text-xs font-black  text-[#EF4444]  hover:text-white uppercase underline decoration-2 self-start sm:self-auto"
            >
              TÜM İZDAŞLARI GÖR →
            </Link>
          </div>

          {/* 3 Matches Grid */}
          {matches.length === 0 ? (
            <div className=" bg-[#141414] border-2 sm:border-4  border-[#333333] p-6 sm:p-8 font-mono  shadow-[6px_6px_0px_#000000]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Radar Optic + Signal */}
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <CinemaRadarScannerIllustration size={68} />
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest  text-[#EF4444]">
                        İZDAŞ RADARI AKTİF
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                      ZEVKİNE EN YAKIN İZDAŞLARINI KEŞFET
                    </h3>
                    <p className="text-xs  text-[#A3A3A3] max-w-lg leading-relaxed">
                      Sinema DNA profilinizi kalibre edin, favori 4
                      başyapıtınızı belirleyin ve sizinle aynı frekanstaki
                      İzdaşlar ile anında eşleşin.
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        setAuthMode("login");
                        setIsAuthOpen(true);
                      } else {
                        setIsTasteProfilerOpen(true);
                      }
                    }}
                    className="flex-1 md:flex-initial px-5 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A]  shadow-[3px_3px_0px_#000000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
                  >
                    İZDAŞINI BUL →
                  </button>
                  <Link
                    href="/matches"
                    className="px-4 py-3  bg-[#262626] hover:bg-[#E5E5E5]  text-white text-xs font-black uppercase border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] cursor-pointer transition-all text-center"
                  >
                    KEŞFET
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* MOBILE VIEW: SINGLE-CARD SWIPE DECK */}
              <div className="block md:hidden max-w-md mx-auto w-full font-mono space-y-3">
                {activeHomeDeckIndex < matches.length ? (
                  <>
                    {/* Deck Progress & Undo Bar */}
                    <div className="flex items-center justify-between gap-3 bg-[#0A0A0A] text-white p-2.5 border-2  border-[#404040]  shadow-[3px_3px_0px_#000000]">
                      <span className="text-[11px] font-black uppercase  text-[#EF4444]">
                        SİNEFİL KARTI {activeHomeDeckIndex + 1} /{" "}
                        {matches.length}
                      </span>
                      <div className="flex-1 max-w-[120px] h-1.5 bg-neutral-800 border border-neutral-700 overflow-hidden">
                        <div
                          className="h-full bg-[#DC2626] transition-all duration-300"
                          style={{
                            width: `${((activeHomeDeckIndex + 1) / matches.length) * 100}%`,
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleHomeDeckUndo}
                        disabled={!homeDeck.canUndo}
                        aria-label="Önceki Profile Dön (Geri Al)"
                        className="px-2.5 py-1.5 min-h-[36px] text-xs font-black uppercase border border-neutral-600 bg-neutral-900 text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                        title="Önceki Profile Dön"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Geri Al</span>
                      </button>
                    </div>

                    {/* Single Swipeable Card */}
                    <div className="w-full">
                      <SwipeMatchCard
                        key={matches[activeHomeDeckIndex].id}
                        match={matches[activeHomeDeckIndex]}
                        nextMatch={matches[activeHomeDeckIndex + 1]}
                        onChatClick={handleOpenChat}
                        onLike={handleHomeDeckLike}
                        onPass={handleHomeDeckPass}
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-6  bg-[#171717] border-4  border-[#404040]  shadow-[5px_5px_0px_#000000] text-center space-y-3 font-mono">
                    <CinemaRadarScannerIllustration
                      size={56}
                      className="mx-auto"
                    />
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      TÜM ÖNERİLERİ İNCELEDİNİZ
                    </h3>
                    <p className="text-xs  text-neutral-400 font-bold">
                      Daha fazla sinemaseverle tanışmak için tüm radarı
                      keşfetmeye devam edin.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleHomeDeckReset}
                        className="px-4 py-2 bg-[#DC2626] text-white text-xs font-black uppercase border-2 border-[#0A0A0A] cursor-pointer"
                      >
                        Baştan Tara
                      </button>
                      <Link
                        href="/matches"
                        className="px-4 py-2 bg-[#F59E0B] text-[#0A0A0A] text-xs font-black uppercase border-2 border-[#0A0A0A]"
                      >
                        Tüm Radara Git →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* TABLET & DESKTOP VIEW: MULTI-COLUMN EQUAL-HEIGHT GRID */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {matches.map((match, index) => (
                  <div key={match.id} className="h-full flex flex-col">
                    <SwipeMatchCard
                      match={match}
                      nextMatch={matches[index + 1]}
                      onChatClick={handleOpenChat}
                      onLike={handleMatchLike}
                      onPass={handleMatchPass}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. VİZYONDAKİLER & KEŞİF */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4  border-[#404040] pb-3">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black  text-[#FAFAFA] uppercase tracking-tight font-sans">
                VİZYONDAKİLER & KEŞİF
              </h2>
              <p className="text-xs sm:text-sm  text-neutral-400 font-mono mt-1">
                Kulüp üyelerinin puanladığı ve tartıştığı kült yapımlar.
              </p>
            </div>

            {/* Discovery Controls: Live Search Box, Shuffle Action & Media Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto font-mono">
              {/* Live Catalog Search Input Box */}
              <div className="relative flex items-center  bg-[#171717] border-2  border-[#404040]  shadow-[3px_3px_0px_#000000]  focus-within:border-[#EF4444] transition-all">
                <Search className="w-3.5 h-3.5  text-[#EF4444] stroke-[2.5] shrink-0 ml-2.5 select-none" />
                <input
                  type="text"
                  placeholder="FİLTRELE..."
                  aria-label="Katalogda başlık veya yönetmen filtrele"
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    setVisibleCount(DISCOVERY_PAGE_SIZE);
                  }}
                  className="appearance-none rounded-none shadow-none w-36 sm:w-44 md:w-56 px-2 py-1.5 text-xs font-mono font-black bg-transparent  text-[#FAFAFA]  placeholder:text-neutral-500 focus:outline-none uppercase tracking-wide"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch("");
                      setVisibleCount(DISCOVERY_PAGE_SIZE);
                    }}
                    className="p-1 mr-1 text-neutral-400  hover:text-[#EF4444] transition-colors cursor-pointer"
                    title="Aramayı temizle"
                    aria-label="Aramayı temizle"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                )}
              </div>

              {/* Shuffle Button */}
              <button
                type="button"
                onClick={handleShuffle}
                className="group flex items-center gap-2 px-3 py-2   bg-[#171717] hover:bg-[#262626]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 text-xs font-black uppercase transition-all cursor-pointer select-none"
                title="Kataloğu rastgele karıştır"
              >
                <Shuffle
                  className={`w-3.5 h-3.5  text-[#EF4444] stroke-[2.5] transition-transform duration-300 ${isShuffling ? "rotate-180 scale-110" : "group-hover:rotate-45"}`}
                />
                <span className="hidden sm:inline">Karıştır</span>
              </button>

              <div className="flex items-center  bg-[#171717] p-1 border-2  border-[#404040]  shadow-[3px_3px_0px_#000000]">
                {[
                  { key: "all", label: "TÜMÜ" },
                  { key: "movie", label: "FİLMLER" },
                  { key: "tv", label: "DİZİLER" },
                  { key: "anime", label: "ANİME" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key as any);
                      setVisibleCount(DISCOVERY_PAGE_SIZE);
                    }}
                    className={`px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? " bg-[#DC2626] text-white  shadow-[2px_2px_0px_#000000]"
                        : " text-[#A3A3A3]  hover:text-[#FAFAFA]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Genre Carousel Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-mono">
            <button
              type="button"
              onClick={() => {
                setSelectedGenre("Hepsi");
                setVisibleCount(DISCOVERY_PAGE_SIZE);
              }}
              className={`px-3 py-1.5 text-xs font-black uppercase border-2  border-[#404040] whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === "Hepsi"
                  ? "  shadow-[2px_2px_0px_#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A]"
                  : " bg-neutral-800  text-[#FAFAFA]  hover:bg-neutral-700"
              }`}
            >
              TÜM TÜRLER
            </button>
            {POPULAR_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => {
                  setSelectedGenre(genre);
                  setVisibleCount(DISCOVERY_PAGE_SIZE);
                }}
                className={`px-3 py-1.5 text-xs font-black uppercase border-2  border-[#404040] whitespace-nowrap transition-all cursor-pointer ${
                  selectedGenre === genre
                    ? "  shadow-[2px_2px_0px_#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A]"
                    : " bg-neutral-800  text-[#FAFAFA]  hover:bg-neutral-700"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Discovery Sort Mode Bar */}
          <div className="flex items-center justify-between gap-3 text-xs font-mono border-t border-neutral-800 pt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-bold flex-wrap">
              <span className="text-neutral-400 font-black">SIRALA:</span>
              {[
                { key: 'recommended', label: 'ÖNERİLEN (CINESCORE)' },
                { key: 'rating', label: 'EN YÜKSEK PUAN' },
                { key: 'popular', label: 'EN POPÜLER' },
                { key: 'newest', label: 'EN YENİ' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.key as DiscoverySortOption);
                    setVisibleCount(DISCOVERY_PAGE_SIZE);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase transition-all cursor-pointer border ${
                    sortBy === opt.key
                      ? "bg-[#DC2626] text-white border-white shadow-[2px_2px_0px_#000000]"
                      : "bg-[#171717] text-neutral-300 border-neutral-700 hover:text-white hover:border-neutral-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-neutral-500 font-bold">
              {filteredMedia.length} BAŞYAPIT
            </span>
          </div>

          {/* Media Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 font-mono">
              <Loader2 className="w-8 h-8  text-[#EF4444] animate-spin" />
              <span className="text-xs font-black uppercase  text-[#FAFAFA]">
                KATALOG YÜKLENİYOR...
              </span>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className=" bg-neutral-900 border-4  border-[#404040] p-8 text-center font-mono space-y-3  shadow-[6px_6px_0px_#000000]">
              <Film className="w-10 h-10  text-[#EF4444] mx-auto" />
              <h3 className="text-sm font-black uppercase  text-[#FAFAFA]">
                {catalogSearch
                  ? `"${catalogSearch.toUpperCase()}" İÇİN SONUÇ BULUNAMADI`
                  : "BU TÜRDE FİLM BULUNAMADI"}
              </h3>
              <p className="text-xs  text-neutral-400 font-bold">
                {catalogSearch
                  ? "Farklı bir anahtar kelime, yönetmen adı veya orijinal başlık ile aramayı deneyebilirsiniz."
                  : `"${selectedGenre}" türüne ait başyapıtlar hazırlanıyor. Diğer popüler türlere göz atabilirsiniz.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCatalogSearch("");
                  setSelectedGenre("Hepsi");
                  setActiveTab("all");
                  setVisibleCount(DISCOVERY_PAGE_SIZE);
                }}
                className="px-4 py-2  hover:bg-[#B91C1C] bg-[#DC2626] text-white text-xs font-black uppercase border-2  border-[#404040] cursor-pointer  shadow-[2px_2px_0px_#000000]"
              >
                ARAMAYI VE FİLTRELERİ SIFIRLA
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 sm:gap-5">
                {displayedMedia.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onLogClick={handleOpenLog}
                    onSelect={handleOpenDetail}
                    onOpenLog={handleOpenLog}
                    onToggleWatchlist={handleToggleWatchlist}
                    isWatchlisted={watchlistIds.has(item.id)}
                  />
                ))}
              </div>

              {/* Show More Button (Expands +15 items) */}
              {filteredMedia.length > visibleCount && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + DISCOVERY_PAGE_SIZE)
                    }
                    className="px-8 py-3.5    hover:text-white bg-neutral-100 hover:bg-white text-[#0A0A0A] font-mono text-xs font-black uppercase border-2  border-[#404040]  shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>
                      DAHA FAZLA FİLM GÖSTER (+
                      {Math.min(
                        DISCOVERY_PAGE_SIZE,
                        filteredMedia.length - visibleCount,
                      )}
                      )
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. TAPED COMMUNITY DIARY & REVIEWS DISPATCH */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-4  border-[#404040] pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[10px] font-black uppercase font-mono tracking-wider inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>ÖNE ÇIKAN AKIŞ ALGORİTMASI</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black  text-[#FAFAFA] uppercase tracking-tight font-sans">
                TOPLULUK GÜNLÜĞÜ
              </h2>
              <p className="text-xs sm:text-sm  text-neutral-400 font-mono mt-1">
                Beğeni, sinefil derinliği ve İzledin+ etkileşimiyle sıralanan
                canlı topluluk daktilo notları.
              </p>
            </div>

            <Link
              href="/diary"
              className="font-mono text-xs font-black  text-[#EF4444]  hover:text-white uppercase underline decoration-2"
            >
              GÜNLÜĞÜN TAMAMINA GİT →
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className=" bg-neutral-900 border-4  border-[#404040] p-8 text-center font-mono space-y-2  shadow-[6px_6px_0px_#000000]">
              <p className="text-xs font-bold  text-neutral-400">
                Henüz izleme kaydı eklenmedi.
              </p>
              <button
                type="button"
                onClick={() => handleOpenLog(activeFeatured)}
                className="px-4 py-2  hover:bg-[#B91C1C] bg-[#DC2626] text-white text-xs font-black uppercase border-2  border-[#404040] cursor-pointer"
              >
                + İlk Günlük Kaydını Sen Yaz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              {logs.map((log) => {
                const isAuthorPremium = Boolean(log.user?.isPremium);

                return (
                  <article
                    key={log.id}
                    onClick={() => {
                      setDetailLog(log);
                      setIsLogDetailOpen(true);
                    }}
                    className={` bg-[#171717]  text-[#FAFAFA] p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all cursor-pointer hover:-translate-y-1 ${
                      isAuthorPremium
                        ? "border-2 sm:border-4  border-amber-400/85  shadow-[5px_5px_0px_#D97706]  hover:shadow-[8px_8px_0px_#D97706]"
                        : "border-2 sm:border-4  border-[#404040]  shadow-[5px_5px_0px_#000000]  hover:shadow-[8px_8px_0px_#EF4444]"
                    }`}
                  >
                    {/* Top Premium Film Strip Accent Bar */}
                    {isAuthorPremium && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                    )}

                    {/* Author Info */}
                    <div className="flex items-center justify-between gap-2 border-b-2  border-[#404040] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`relative shrink-0 ${isAuthorPremium ? "p-0.5 border-2 border-amber-500 bg-amber-500/10" : ""}`}
                        >
                          <img
                            src={
                              log.user?.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(log.user?.fullName || "S")}&backgroundColor=0A0A0A&textColor=F59E0B&fontWeight=900`
                            }
                            alt={log.user?.fullName || "Kullanıcı"}
                            className="w-8 h-8 object-cover border-2  border-[#404040]"
                          />
                        </div>
                        <div className="max-w-[140px] truncate">
                          <div className="flex items-center gap-1">
                            <h3 className="text-xs font-black uppercase truncate  text-[#FAFAFA]">
                              {log.user?.fullName || "Sinemasever"}
                            </h3>
                            {isAuthorPremium && (
                              <span
                                className="px-1 py-0.2 bg-amber-500/15 border border-amber-500/50  text-amber-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 shrink-0"
                                title="İzledin+ Kulüp Üyesi"
                              >
                                <Crown className="w-2.5 h-2.5 text-amber-500 fill-current" />
                                <span>+</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px]  text-neutral-400 truncate">
                            @{log.user?.username || "kullanici"} •{" "}
                            {log.watchedDate}
                          </p>
                        </div>
                      </div>

                      {log.rating !== undefined && (
                        <div className="marker-highlight text-xs font-black whitespace-nowrap  text-[#FAFAFA]">
                          {log.rating.toFixed(1)}/10
                        </div>
                      )}
                    </div>

                    {/* Review Body & Media */}
                    <div className="flex gap-3">
                      <img
                        src={log.posterUrl}
                        alt={log.title}
                        className="w-16 h-22 object-cover border-2  border-[#404040] flex-shrink-0 bg-neutral-900"
                      />
                      <div>
                        <h4 className="text-xs font-black uppercase  text-[#EF4444] line-clamp-1">
                          {log.title}
                        </h4>
                        {log.review ? (
                          <p className="text-xs  text-neutral-200 mt-1 font-bold leading-relaxed line-clamp-3">
                            "{log.review}"
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-500 mt-1 italic font-medium line-clamp-3">
                            (puanladı, not yazmadı)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t-2  border-[#404040] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(log.id);
                        }}
                        className={`flex items-center gap-1.5 font-black transition-all cursor-pointer ${
                          likedLogIds.has(log.id)
                            ? " text-[#EF4444]"
                            : " text-neutral-400  hover:text-[#EF4444]"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                            likedLogIds.has(log.id)
                              ? " fill-[#EF4444]  text-[#EF4444]"
                              : "fill-none text-current stroke-[2.5]"
                          }`}
                        />
                        <span>{log.likesCount || 0} BEĞENİ</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailLog(log);
                          setIsLogDetailOpen(true);
                        }}
                        className=" text-[#EF4444] hover:underline font-black text-xs uppercase cursor-pointer"
                      >
                        YORUMLAR →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Card action feedback toast (watchlist add/remove, failures) */}
      {cardToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#EF4444] px-4 py-3 shadow-[6px_6px_0px_#000000] animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-3 font-mono text-xs font-bold max-w-sm"
        >
          <Bookmark className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span className="truncate">{cardToast}</span>
          <button
            type="button"
            onClick={() => setCardToast(null)}
            className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A3A3A3] hover:text-white cursor-pointer"
            aria-label="Bildirimi kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Modals */}
      <MediaDetailModal
        item={detailItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenLog={handleOpenLog}
        onOpenTasteProfiler={() => {
          if (!user) {
            setAuthMode("register");
            setIsAuthOpen(true);
          } else {
            setIsTasteProfilerOpen(true);
          }
        }}
      />

      <QuickLogModal
        item={quickLogItem}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveLog={handleSaveLog}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
        onChangeMovie={() => setIsSearchOpen(true)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item) => {
          handleOpenDetail(item);
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
          onComplete={() => {
            setIsTasteProfilerOpen(false);
          }}
          onOpenAuth={() => {
            setAuthMode("login");
            setIsAuthOpen(true);
          }}
        />
      )}

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
      />

      <ChatModal
        match={activeChatMatch}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
      />

      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onOpenChat={(match) => {
          setActiveChatMatch(match);
          setIsChatOpen(true);
        }}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
      />

      <LogDetailModal
        log={detailLog}
        isOpen={isLogDetailOpen}
        onClose={() => setIsLogDetailOpen(false)}
      />
    </div>
  );
}
