"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Star,
  Heart,
  Repeat,
  Plus,
  Filter,
  Loader2,
  Search,
  Film,
  Tv,
  Calendar,
  MessageSquare,
  Flame,
  Check,
  X,
  Crown,
  TrendingUp,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  CinemaStarIcon,
  MasterpieceLaurelIcon,
  FilmReelIcon,
} from "@/components/icons/CinemaIcons";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QuickLogModal } from "@/components/media/QuickLogModal";
import { SearchModal } from "@/components/media/SearchModal";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { TasteProfilerModal } from "@/components/onboarding/TasteProfilerModal";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { InboxModal } from "@/components/inbox/InboxModal";
import { ChatModal } from "@/components/matches/ChatModal";
import { LogDetailModal } from "@/components/community/LogDetailModal";

import { useAuth } from "@/context/AuthContext";
import {
  getCommunityWatchLogs,
  getUserWatchLogs,
  toggleWatchLogLike,
  getUserLikedLogIds,
  CommunitySortMode,
} from "@/lib/services/watch-logs.service";
import { WatchLog, MediaItem, MovieMateMatch, MediaType } from "@/types";

export default function DiaryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WatchLog[]>([]);
  const [likedLogIds, setLikedLogIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");
  const [sortMode, setSortMode] = useState<CommunitySortMode>("trending");
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterMediaType, setFilterMediaType] = useState<
    "all" | "movie" | "tv"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(
    new Set(),
  );

  // Modals state
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMediaDetailOpen, setIsMediaDetailOpen] = useState(false);
  const [detailMediaItem, setDetailMediaItem] = useState<MediaItem | null>(
    null,
  );
  const [isTasteProfilerOpen, setIsTasteProfilerOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeChatMatch, setActiveChatMatch] = useState<MovieMateMatch | null>(
    null,
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [detailLog, setDetailLog] = useState<WatchLog | null>(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);

  const toggleExpandReview = (logId: string) => {
    setExpandedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const handleOpenMediaDetail = (log: WatchLog) => {
    const media: MediaItem = {
      id: log.mediaId,
      title: log.title,
      type: log.mediaType,
      year: log.year,
      posterPath: log.posterUrl || "",
      backdropPath: log.backdropUrl || "",
      genres: log.genres || [],
      voteAverage: undefined,
      overview:
        log.review ||
        (log.year
          ? `${log.title} (${log.year}) filminin detayları.`
          : `${log.title} filminin detayları.`),
    };
    setDetailMediaItem(media);
    setIsMediaDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const fetchLogs = async (overrideQuery?: string) => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    const queryToUse = overrideQuery !== undefined ? overrideQuery : searchQuery;
    try {
      if (user) {
        getUserLikedLogIds(user.id).then((likedSet) => {
          if (seq === fetchSeqRef.current) setLikedLogIds(likedSet);
        });
      }
      let result: WatchLog[];
      if (viewMode === "mine" && user) {
        result = await getUserWatchLogs(user.id, queryToUse);
      } else {
        result = await getCommunityWatchLogs(
          50,
          filterRating,
          sortMode,
          queryToUse,
        );
      }
      if (seq !== fetchSeqRef.current) return; // a newer fetch already landed
      setLogs(result);
    } catch (err) {
      console.warn('fetchLogs failed:', err);
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  // Stale-response guard: flipping filters quickly used to let the slower
  // earlier request overwrite results matching the PREVIOUS filter state.
  const fetchSeqRef = React.useRef(0);

  // Signing out while on the "mine" tab would leave it filled with community
  // logs under a personal-diary header.
  useEffect(() => {
    if (!user && viewMode === "mine") setViewMode("all");
  }, [user, viewMode]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filterRating, sortMode, user]);

  const handleLike = async (logId: string) => {
    if (!user) {
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
      setLikedLogIds((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(logId);
        else next.delete(logId);
        return next;
      });
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId ? { ...l, likesCount: res.newCount } : l,
        ),
      );
    } else {
      // Request failed — roll the optimistic state back instead of leaving a
      // heart that was never saved.
      setLikedLogIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.delete(logId);
        else next.add(logId);
        return next;
      });
      setLogs((prev) =>
        prev.map((l) => {
          if (l.id !== logId) return l;
          const count = l.likesCount || 0;
          return {
            ...l,
            likesCount: isCurrentlyLiked ? count + 1 : Math.max(0, count - 1),
          };
        }),
      );
    }
  };

  const handleSaveLog = (newLog: WatchLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleOpenSearchForLog = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsSearchOpen(true);
  };

  const handleSelectMediaForLog = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsSearchOpen(false);
    setIsQuickLogOpen(true);
  };

  // Filter logs by rating, media type and search term
  const filteredLogs = logs.filter((l) => {
    const matchesRating = (l.rating || 0) >= filterRating;
    const matchesType =
      filterMediaType === "all" || l.mediaType === filterMediaType;
    return matchesRating && matchesType;
  });

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white">
      <Navbar
        onOpenQuickLog={handleOpenSearchForLog}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Header Marquee Banner */}
        <div className=" bg-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="stamp-badge-solid px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono inline-block">
              35MM ARŞİV & DAKTİLO GÜNLÜĞÜ
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase  text-[#EF4444] font-sans tracking-tight leading-[0.95]">
              TOPLULUK İZLEME GÜNLÜĞÜ
            </h1>
            <p className="text-xs sm:text-sm text-[#D4D4D4] leading-relaxed max-w-xl font-mono">
              Sinemaseverlerin daktilo ile kaydettiği tüm izleme geçmişi, 1-10
              arası puanlar ve samimi film notları.
            </p>
          </div>

          <button
            onClick={handleOpenSearchForLog}
            className="px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#ffffff] flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-transform active:translate-x-0.5 active:translate-y-0.5 shrink-0 font-mono"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ YENİ İZLEME KAYDI YAZ</span>
          </button>
        </div>

        {/* Filter Bar & Feed Switcher */}
        <div className=" bg-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040] p-4 sm:p-5 flex flex-col gap-4  shadow-[6px_6px_0px_#000000] font-mono">
          {/* Tier 1: Feed Switcher & Quick Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Feed Mode Switcher */}
            <div
              className="grid grid-cols-2 gap-2 w-full md:w-auto"
              role="tablist"
              aria-label="Günlük Akış Modu"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "all"}
                onClick={() => setViewMode("all")}
                className={`px-2 sm:px-4 py-2.5 min-h-[44px] text-[10px] sm:text-xs text-center font-black uppercase border-2 transition-all cursor-pointer ${
                  viewMode === "all"
                    ? " bg-[#171717]  text-[#EF4444]  border-[#EF4444]  shadow-[2px_2px_0px_#000000]"
                    : " bg-[#171717]  text-[#A3A3A3]  border-[#262626] hover:border-[#0A0A0A]"
                }`}
              >
                TOPLULUK AKIŞI
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "mine"}
                onClick={() => {
                  if (!user) {
                    setIsAuthOpen(true);
                  } else {
                    setViewMode("mine");
                  }
                }}
                className={`px-2 sm:px-4 py-2.5 min-h-[44px] text-[10px] sm:text-xs text-center font-black uppercase border-2 transition-all cursor-pointer ${
                  viewMode === "mine"
                    ? " bg-[#171717]  text-[#EF4444]  border-[#EF4444]  shadow-[2px_2px_0px_#000000]"
                    : " bg-[#171717]  text-[#A3A3A3]  border-[#262626] hover:border-[#0A0A0A]"
                }`}
              >
                BENİM GÜNLÜĞÜM
                {(() => {
                  // Real total of MY logs — the community feed is only a 50-row
                  // window, so counting inside it showed wrong (or empty)
                  // numbers. Hidden entirely while there are none.
                  if (!user) return null;
                  const mineInFeed = logs.filter(
                    (l) => l.userId === user.id,
                  ).length;
                  return viewMode === "mine" && logs.length > 0
                    ? ` (${logs.length})`
                    : mineInFeed > 0
                      ? ` (${mineInFeed})`
                      : null;
                })()}
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#737373] absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchLogs();
                    }
                  }}
                  placeholder="Film veya inceleme ara..."
                  aria-label="Günlükte film veya inceleme ara"
                  className="w-full h-11  bg-[#171717]  text-[#FAFAFA] text-xs font-bold pl-9 pr-8 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none placeholder-[#737373]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      fetchLogs("");
                    }}
                    aria-label="Aramayı temizle"
                    className="absolute right-2.5 top-2.5 p-1 text-[#737373]  hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchLogs()}
                className="h-11 px-4   bg-[#EF4444] hover:bg-[#DC2626]  text-[#0A0A0A] text-xs font-black uppercase border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex-shrink-0"
              >
                Ara
              </button>
            </div>
          </div>

          {/* Tier 2: Streamlined Controls Bar (Sort, Puan, Tür, Reset) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2  border-[#262626]">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Sort Selector */}
              {viewMode === "all" && (
                <div className="flex items-center gap-1.5  bg-[#171717] border  border-[#404040] px-2.5 py-1">
                  <span className="text-[11px] font-black text-[#737373] uppercase shrink-0">
                    Sırala:
                  </span>
                  <select
                    value={sortMode}
                    onChange={(e) =>
                      setSortMode(e.target.value as CommunitySortMode)
                    }
                    aria-label="Sıralama Modu"
                    className="bg-transparent text-xs font-black uppercase  text-[#FAFAFA] focus:outline-none cursor-pointer"
                  >
                    <option value="trending">Öne Çıkanlar</option>
                    <option value="top">En Çok Beğenilenler</option>
                    <option value="recent">En Yeniler</option>
                    <option value="premium">İzledin+ Kulübü</option>
                  </select>
                </div>
              )}

              {/* Rating Selector */}
              <div className="flex items-center gap-1.5  bg-[#171717] border  border-[#404040] px-2.5 py-1">
                <span className="text-[11px] font-black text-[#737373] uppercase shrink-0">
                  Puan:
                </span>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                  aria-label="Puan Filtresi"
                  className="bg-transparent text-xs font-black uppercase  text-[#FAFAFA] focus:outline-none cursor-pointer"
                >
                  <option value={0}>Tüm Puanlar</option>
                  <option value={9}>9.0+ Başyapıt</option>
                  <option value={8}>8.0+ Çok İyi</option>
                  <option value={7}>7.0+ İyi Film</option>
                </select>
              </div>

              {/* Media Type Selector */}
              <div className="flex items-center gap-1.5  bg-[#171717] border  border-[#404040] px-2.5 py-1">
                <span className="text-[11px] font-black text-[#737373] uppercase shrink-0">
                  Tür:
                </span>
                <select
                  value={filterMediaType}
                  onChange={(e) => setFilterMediaType(e.target.value as any)}
                  aria-label="Medya Türü Filtresi"
                  className="bg-transparent text-xs font-black uppercase  text-[#FAFAFA] focus:outline-none cursor-pointer"
                >
                  <option value="all">Tüm Yapımlar</option>
                  <option value="movie">Sadece Filmler</option>
                  <option value="tv">Sadece Diziler</option>
                </select>
              </div>

              {/* Reset Filters Button */}
              {(filterRating > 0 ||
                filterMediaType !== "all" ||
                sortMode !== "trending" ||
                searchQuery.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterRating(0);
                    setFilterMediaType("all");
                    setSortMode("trending");
                    setSearchQuery("");
                    setTimeout(() => fetchLogs(""), 0);
                  }}
                  className="px-2.5 py-1  bg-neutral-800   hover:bg-[#EF4444] hover:text-[#0A0A0A] border  border-[#404040] text-xs font-black uppercase transition-colors cursor-pointer flex items-center gap-1"
                  title="Tüm filtreleri sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sıfırla</span>
                </button>
              )}
            </div>

            <div className="text-xs font-black text-[#737373] uppercase tracking-wider">
              {filteredLogs.length} İNCELEME LİSTELENDİ
            </div>
          </div>
        </div>

        {/* Diary Timeline Grid */}
        <section aria-labelledby="diary-feed-heading">
          <h2 id="diary-feed-heading" className="sr-only">
            {viewMode === "mine"
              ? "Kişisel İzleme Günlüğüm"
              : "Topluluk Sinefil Günlüğü Akışı"}
          </h2>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 font-mono">
              <Loader2 className="w-10 h-10  text-[#EF4444] animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest text-[#737373]">
                GÜNLÜK KAYITLARI YÜKLENİYOR...
              </span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className=" bg-[#0A0A0A]  text-[#FAFAFA] border-2  border-[#404040] p-12 text-center  shadow-[6px_6px_0px_#000000] space-y-4 font-mono">
              <BookOpen className="w-14 h-14  text-[#EF4444] mx-auto stroke-[1.5]" />
              <h3 className="text-lg font-black uppercase tracking-tight">
                {viewMode === "mine"
                  ? "HENÜZ GÜNLÜĞE FİLM EKLENMEDİ"
                  : "UYGUN GÜNLÜK KAYDI BULUNAMADI"}
              </h3>
              <p className="text-xs text-[#737373] max-w-md mx-auto leading-relaxed">
                {viewMode === "mine"
                  ? "Henüz günlüğe film eklenmedi. İlk başyapıtını kaydet! İzlediğin filmi puanlayıp daktilo notunu ekle."
                  : "Seçilen filtrelere veya arama kriterine uygun izleme kaydı bulunamadı. Filtreleri sıfırlayabilir veya yeni bir kayıt ekleyebilirsiniz."}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenSearchForLog}
                  className="px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A]  shadow-[4px_4px_0px_#000000] cursor-pointer inline-flex items-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ İLK BAŞYAPITINI KAYDET</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
              {filteredLogs.map((log) => {
                const isAuthorPremium = Boolean(log.user?.isPremium);
                const isExpanded = expandedReviewIds.has(log.id);
                const isLongReview = (log.review || "").length > 110;

                return (
                  <article
                    key={log.id}
                    onClick={() => {
                      setDetailLog(log);
                      setIsLogDetailOpen(true);
                    }}
                    aria-label={`${log.title} daktilo incelemesi by @${log.user?.username || "kullanici"}`}
                    className={`cursor-pointer  bg-[#171717]  text-[#FAFAFA] p-5 flex flex-col justify-between space-y-4 relative group hover:-translate-y-1 transition-all overflow-hidden ${
                      isAuthorPremium
                        ? "border-2 sm:border-3  border-amber-400/80  shadow-[6px_6px_0px_#D97706]"
                        : "border-2  border-[#404040]  shadow-[6px_6px_0px_#000000]"
                    }`}
                  >
                    {/* Top Premium Film Strip Accent Bar */}
                    {isAuthorPremium && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                    )}

                    {/* Vintage Tape Mark */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4  bg-[#404040]/80 border  border-[#404040] transform -rotate-1 shadow-sm" />

                    {/* Author Strip */}
                    <div className="flex items-center justify-between gap-2 border-b  border-[#262626] pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`relative shrink-0 ${isAuthorPremium ? "p-0.5 border-2 border-amber-500 bg-amber-500/10" : ""}`}
                        >
                          <img
                            src={
                              log.user?.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(log.user?.fullName || "S")}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`
                            }
                            alt={log.user?.fullName || "Kullanıcı"}
                            className="w-8 h-8 object-cover border  border-[#404040] bg-black"
                          />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5">
                            <h3
                              className="text-xs font-black uppercase truncate"
                              title={log.user?.fullName || "Sinemasever"}
                            >
                              {log.user?.fullName || "Sinemasever"}
                            </h3>
                            {isAuthorPremium && (
                              <span
                                className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/50  text-amber-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 shrink-0"
                                title="İzledin+ Kulüp Üyesi"
                              >
                                <Crown className="w-2.5 h-2.5 text-amber-500 fill-current" />
                                <span>İZLEDİN+</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#737373] truncate">
                            @{log.user?.username || "kullanici"} •{" "}
                            {formatDate(log.watchedDate)}
                          </p>
                        </div>
                      </div>

                      {log.rating !== undefined && (
                        <div className="px-2 py-0.5 bg-[#DC2626]/10  text-[#EF4444] text-xs font-black whitespace-nowrap border border-[#DC2626]/30 flex items-center gap-1">
                          <CinemaStarIcon
                            size={11}
                            className="text-[#D97706]"
                          />
                          <span>{log.rating.toFixed(1)}/10</span>
                        </div>
                      )}
                    </div>

                    {/* Movie Detail & Poster Trigger */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMediaDetail(log);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenMediaDetail(log);
                        }
                      }}
                      className="flex gap-3 cursor-pointer group/card p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                      title={`${log.title} detaylarını incele`}
                      aria-label={`${log.title} detaylarını incele`}
                    >
                      <img
                        src={log.posterUrl}
                        alt={log.title}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (!img.dataset.fallbackApplied) {
                            img.dataset.fallbackApplied = "1";
                            img.src =
                              "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop";
                          }
                        }}
                        className="w-16 h-24 object-cover border-2  border-[#404040] shrink-0 bg-black group-hover/card:scale-105 transition-transform duration-150"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4
                          className="text-xs sm:text-sm font-black uppercase  text-[#EF4444] truncate group-hover/card:underline"
                          title={log.title}
                        >
                          {log.title}
                        </h4>
                        <p className="text-xs text-neutral-500 font-bold">
                          {log.year || "—"} •{" "}
                          {log.genres?.slice(0, 2).join(" / ") || "Sinema"}
                        </p>
                        {log.isFavorite && (
                          <span className="inline-block px-1.5 py-0.5 bg-[#DC2626]/15  text-[#EF4444] border border-[#DC2626]/40 text-[10px] font-black uppercase">
                            ★ FAVORİ BAŞYAPIT
                          </span>
                        )}
                        {log.isRewatch && (
                          <span className="inline-block ml-1 px-1.5 py-0.5  bg-neutral-800  text-[#FAFAFA] border  border-[#404040] text-[10px] font-black uppercase">
                            ↺ TEKRAR
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Typewriter Review Text & Accordion */}
                    <div className="bg-neutral-50 bg-neutral-900/60 p-3 border-l-2  border-[#EF4444] space-y-1.5">
                      {log.review ? (
                        <p
                          className={`text-xs  text-[#FAFAFA] font-mono leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}
                        >
                          "{log.review}"
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 font-mono italic leading-relaxed">
                          (puanladı, not yazmadı)
                        </p>
                      )}
                      {isLongReview && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandReview(log.id);
                          }}
                          className="text-[11px] font-black uppercase  text-[#EF4444] hover:underline cursor-pointer flex items-center gap-1 pt-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              <span>DAKTİLO NOTUNU KÜÇÜLT</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              <span>+ DEVAMINI OKU</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t  border-[#262626] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(log.id);
                        }}
                        className={`min-h-[44px] px-2 flex items-center gap-1.5 font-black transition-all cursor-pointer ${
                          likedLogIds.has(log.id)
                            ? " text-[#EF4444]"
                            : "text-[#737373]  hover:text-[#EF4444]"
                        }`}
                        title="İncelemeyi Beğen"
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform active:scale-125 ${
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
                          handleSelectMediaForLog({
                            id: log.mediaId,
                            type: log.mediaType,
                            title: log.title,
                            year: log.year,
                            posterPath: log.posterUrl || "",
                            backdropPath: log.backdropUrl || "",
                            genres: log.genres || [],
                            voteAverage: undefined,
                            overview: log.review || "",
                          });
                        }}
                        className="min-h-[44px] px-3 py-2  bg-neutral-800   hover:bg-[#EF4444] hover:text-[#0A0A0A] border  border-[#404040] text-xs font-black uppercase transition-colors cursor-pointer flex items-center gap-1"
                        title="Sen de bu filmi puanla ve günlüğüne ekle"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>PUANLA</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Modals */}
      <QuickLogModal
        item={selectedMedia}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveLog={handleSaveLog}
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

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={handleSelectMediaForLog}
      />

      <TasteProfilerModal
        isOpen={isTasteProfilerOpen}
        onClose={() => setIsTasteProfilerOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

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

      {/* Bug fix: card clicks set detailLog/isLogDetailOpen but the modal was
          never rendered here, so diary feed clicks silently did nothing. */}
      <LogDetailModal
        log={detailLog}
        isOpen={isLogDetailOpen}
        onClose={() => {
          setIsLogDetailOpen(false);
          setDetailLog(null);
        }}
      />
    </div>
  );
}
