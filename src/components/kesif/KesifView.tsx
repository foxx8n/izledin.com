"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowRight,
  Info,
  Search,
  X,
  Film,
  Loader2,
  Shuffle,
} from "lucide-react";
import { MasterpieceLaurelIcon } from "@/components/icons/CinemaIcons";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MediaCard } from "@/components/media/MediaCard";
import { POPULAR_GENRES } from "@/lib/constants";
import {
  STATIC_MASTER_CATALOG,
  getTrendingMedia,
  getMasterpieceOfTheWeekSync,
  normalizeTurkishText,
} from "@/lib/omdb";
import {
  getUserWatchLogs,
  getWeeklyFeaturedMasterpiece,
  toggleWatchlistItem,
} from "@/lib/services/watch-logs.service";
import {
  sortMediaCatalog,
  getOrCreateDiscoverySeed,
  DiscoverySortOption,
} from "@/lib/algorithms/discovery";
import { useAuth } from "@/context/AuthContext";
import type { MediaItem } from "@/types";

const QuickLogModal = dynamic(
  () => import("@/components/media/QuickLogModal").then((m) => m.QuickLogModal),
  { ssr: false },
);
const MediaDetailModal = dynamic(
  () =>
    import("@/components/media/MediaDetailModal").then(
      (m) => m.MediaDetailModal,
    ),
  { ssr: false },
);
const SearchModal = dynamic(
  () => import("@/components/media/SearchModal").then((m) => m.SearchModal),
  { ssr: false },
);
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((m) => m.AuthModal),
  { ssr: false },
);
const PremiumModal = dynamic(
  () =>
    import("@/components/premium/PremiumModal").then((m) => m.PremiumModal),
  { ssr: false },
);

const DISCOVERY_PAGE_SIZE = 15;

/**
 * KEŞİF — the catalog showcase surface (S4 / Push A).
 * Receives the old home page's masterpiece hero + Vizyondakiler explorer
 * (sections 1 & 3) so `/` can become the PERDE deck in S5/S7 without any
 * indexed content disappearing. Behavior-parity lift: same data services,
 * same CineScore ranking, same filters/sort/shuffle/watchlist flows.
 */
export function KesifView() {
  const { user, profile } = useAuth();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    STATIC_MASTER_CATALOG,
  );
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv" | "anime">(
    "all",
  );
  const [loading, setLoading] = useState(false);
  const [discoverySeed, setDiscoverySeed] = useState<string>(() =>
    typeof window !== "undefined" ? getOrCreateDiscoverySeed() : "default_seed",
  );
  const [sortBy, setSortBy] = useState<DiscoverySortOption>("recommended");
  const [selectedGenre, setSelectedGenre] = useState<string>("Hepsi");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(DISCOVERY_PAGE_SIZE);
  const [isShuffling, setIsShuffling] = useState(false);

  // Watchlist state (real persistence, optimistic flips w/ rollback).
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const watchlistPendingRef = React.useRef<Set<string>>(new Set());
  const [cardToast, setCardToast] = useState<string | null>(null);
  const cardToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showCardToast = (msg: string) => {
    setCardToast(msg);
    if (cardToastTimerRef.current) clearTimeout(cardToastTimerRef.current);
    cardToastTimerRef.current = setTimeout(() => setCardToast(null), 3000);
  };

  // Modals
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [quickLogItem, setQuickLogItem] = useState<MediaItem | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);

  const [featuredMedia, setFeaturedMedia] = useState<MediaItem>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("izledin_cached_featured_masterpiece");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id && parsed?.title) return parsed;
        }
      } catch {}
    }
    return getMasterpieceOfTheWeekSync();
  });

  // Fetch real media catalog for selected tab
  useEffect(() => {
    setLoading(true);
    getTrendingMedia(activeTab)
      .then((items) => setMediaItems(items))
      .finally(() => setLoading(false));
  }, [activeTab]);

  // Live featured masterpiece refresh (cache-first above)
  useEffect(() => {
    getWeeklyFeaturedMasterpiece().then((masterpiece) => {
      if (masterpiece && masterpiece.id) {
        setFeaturedMedia((prev) =>
          prev?.id === masterpiece.id && prev?.title === masterpiece.title
            ? prev
            : masterpiece,
        );
        try {
          localStorage.setItem(
            "izledin_cached_featured_masterpiece",
            JSON.stringify(masterpiece),
          );
        } catch {}
      }
    });
  }, []);

  // Real watchlist ids so bookmark buttons reflect actual persisted state
  useEffect(() => {
    if (!user) {
      setWatchlistIds(new Set());
      return;
    }
    let cancelled = false;
    getUserWatchLogs(user.id).then((logs) => {
      if (cancelled) return;
      setWatchlistIds(
        new Set(logs.filter((l) => l.status === "watchlist").map((l) => l.mediaId)),
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
      setWatchlistIds(watchlistIds); // roll back — never show unsaved state
      showCardToast("İzleme listesi güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      watchlistPendingRef.current.delete(item.id);
    }
  };

  const handleRefreshWatchlist = () => {
    if (!user) return;
    getUserWatchLogs(user.id).then((logs) => {
      setWatchlistIds(
        new Set(logs.filter((l) => l.status === "watchlist").map((l) => l.mediaId)),
      );
    });
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

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar
        onOpenQuickLog={() => handleOpenLog(activeFeatured)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-16">
        {/* ================================================================ */}
        {/* HAFTANIN BAŞYAPITI HERO                                          */}
        {/* ================================================================ */}
        <section className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4 border-[#404040] shadow-[8px_8px_0px_#000000] p-5 sm:p-7 md:p-9 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center relative z-10">
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
                className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none aspect-[2/3] border-4 border-[#FAFAFA] bg-black shadow-[6px_6px_0px_#EF4444] overflow-hidden cursor-pointer group select-none focus:outline-none focus:ring-4 focus:ring-[#DC2626]"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 stamp-badge-solid px-2.5 py-1 text-[11px] font-black bg-[#0A0A0A] text-[#EF4444] border-2 border-white flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
                  <MasterpieceLaurelIcon size={14} className="text-[#EF4444]" />
                  <span>HAFTANIN BAŞYAPITI</span>
                </div>
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

            <div className="lg:col-span-8 xl:col-span-8 space-y-4 sm:space-y-5 font-mono text-left">
              <div className="flex items-center gap-2 flex-wrap">
                {activeFeatured.director && (
                  <span className="px-2.5 py-1 bg-neutral-900 text-neutral-300 text-xs font-bold border border-neutral-700">
                    YÖNETMEN: {activeFeatured.director.toUpperCase()}
                  </span>
                )}
                {activeFeatured.year && (
                  <span className="px-2.5 py-1 bg-neutral-900 text-neutral-300 text-xs font-bold border border-neutral-700">
                    {activeFeatured.year}{" "}
                    {activeFeatured.duration ? `• ${activeFeatured.duration}` : ""}
                  </span>
                )}
                {activeFeatured.genres && activeFeatured.genres.length > 0 && (
                  <span className="px-2.5 py-1 bg-[#DC2626]/20 text-[#EF4444] text-xs font-black border border-[#DC2626]/40 uppercase">
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
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-none font-sans cursor-pointer hover:text-[#EF4444] transition-colors focus:outline-none focus:underline"
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
                <p className="text-xs text-neutral-300 font-medium font-mono">
                  <span className="text-[#A3A3A3] font-bold">KADRO: </span>
                  {activeFeatured.actors}
                </p>
              )}

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-3 sm:line-clamp-4 font-sans font-medium">
                &ldquo;{activeFeatured.overview}&rdquo;
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => handleOpenLog(activeFeatured)}
                  className="min-h-[48px] px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[3px_3px_0px_#FFFFFF] hover:shadow-[1px_1px_0px_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>İzledim & Günlüğe Yaz</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDetail(activeFeatured)}
                  className="min-h-[48px] px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider border-2 border-neutral-700 shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  <span>Filmi İncele</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* VİZYONDAKİLER & KEŞİF EXPLORER                                   */}
        {/* ================================================================ */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-[#404040] pb-3">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FAFAFA] uppercase tracking-tight font-sans">
                VİZYONDAKİLER & KEŞİF
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1">
                Kulüp üyelerinin puanladığı ve tartıştığı kült yapımlar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto font-mono">
              <div className="relative flex items-center bg-[#171717] border-2 border-[#404040] shadow-[3px_3px_0px_#000000] focus-within:border-[#EF4444] transition-all">
                <Search className="w-3.5 h-3.5 text-[#EF4444] stroke-[2.5] shrink-0 ml-2.5 select-none" />
                <input
                  type="text"
                  placeholder="FİLTRELE..."
                  aria-label="Katalogda başlık veya yönetmen filtrele"
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    setVisibleCount(DISCOVERY_PAGE_SIZE);
                  }}
                  className="appearance-none rounded-none shadow-none w-36 sm:w-44 md:w-56 px-2 py-1.5 text-xs font-mono font-black bg-transparent text-[#FAFAFA] placeholder:text-neutral-500 focus:outline-none uppercase tracking-wide"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch("");
                      setVisibleCount(DISCOVERY_PAGE_SIZE);
                    }}
                    className="p-1 mr-1 text-neutral-400 hover:text-[#EF4444] transition-colors cursor-pointer"
                    title="Aramayı temizle"
                    aria-label="Aramayı temizle"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleShuffle}
                className="group flex items-center gap-2 px-3 py-2 bg-[#171717] hover:bg-[#262626] text-[#FAFAFA] border-2 border-[#404040] shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 text-xs font-black uppercase transition-all cursor-pointer select-none"
                title="Kataloğu rastgele karıştır"
              >
                <Shuffle
                  className={`w-3.5 h-3.5 text-[#EF4444] stroke-[2.5] transition-transform duration-300 ${isShuffling ? "rotate-180 scale-110" : "group-hover:rotate-45"}`}
                />
                <span className="hidden sm:inline">Karıştır</span>
              </button>

              <div className="flex items-center bg-[#171717] p-1 border-2 border-[#404040] shadow-[3px_3px_0px_#000000]">
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
                      setActiveTab(tab.key as "all" | "movie" | "tv" | "anime");
                      setVisibleCount(DISCOVERY_PAGE_SIZE);
                    }}
                    className={`px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? "bg-[#DC2626] text-white shadow-[2px_2px_0px_#000000]"
                        : "text-[#A3A3A3] hover:text-[#FAFAFA]"
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
              className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-[#404040] whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === "Hepsi"
                  ? "shadow-[2px_2px_0px_#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A]"
                  : "bg-neutral-800 text-[#FAFAFA] hover:bg-neutral-700"
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
                className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-[#404040] whitespace-nowrap transition-all cursor-pointer ${
                  selectedGenre === genre
                    ? "shadow-[2px_2px_0px_#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A]"
                    : "bg-neutral-800 text-[#FAFAFA] hover:bg-neutral-700"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Sort Bar */}
          <div className="flex items-center justify-between gap-3 text-xs font-mono border-t border-neutral-800 pt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-bold flex-wrap">
              <span className="text-neutral-400 font-black">SIRALA:</span>
              {[
                { key: "recommended", label: "ÖNERİLEN (CINESCORE)" },
                { key: "rating", label: "EN YÜKSEK PUAN" },
                { key: "popular", label: "EN POPÜLER" },
                { key: "newest", label: "EN YENİ" },
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
              <Loader2 className="w-8 h-8 text-[#EF4444] animate-spin" />
              <span className="text-xs font-black uppercase text-[#FAFAFA]">
                KATALOG YÜKLENİYOR...
              </span>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="bg-neutral-900 border-4 border-[#404040] p-8 text-center font-mono space-y-3 shadow-[6px_6px_0px_#000000]">
              <Film className="w-10 h-10 text-[#EF4444] mx-auto" />
              <h3 className="text-sm font-black uppercase text-[#FAFAFA]">
                {catalogSearch
                  ? `"${catalogSearch.toUpperCase()}" İÇİN SONUÇ BULUNAMADI`
                  : "BU TÜRDE FİLM BULUNAMADI"}
              </h3>
              <p className="text-xs text-neutral-400 font-bold">
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
                className="px-4 py-2 hover:bg-[#B91C1C] bg-[#DC2626] text-white text-xs font-black uppercase border-2 border-[#404040] cursor-pointer shadow-[2px_2px_0px_#000000]"
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

              {filteredMedia.length > visibleCount && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + DISCOVERY_PAGE_SIZE)
                    }
                    className="px-8 py-3.5 hover:text-white bg-neutral-100 hover:bg-white text-[#0A0A0A] font-mono text-xs font-black uppercase border-2 border-[#404040] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-2"
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
      </main>

      {/* Card action toast */}
      {cardToast && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 bg-[#171717] text-[#FAFAFA] text-xs font-mono font-bold border-2 border-[#404040] shadow-[4px_4px_0px_#000000] max-w-[90vw] text-center"
        >
          {cardToast}
        </div>
      )}

      <Footer />

      {/* Global Modals */}
      <MediaDetailModal
        item={detailItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenLog={handleOpenLog}
      />

      <QuickLogModal
        item={quickLogItem}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveLog={() => handleRefreshWatchlist()}
        onOpenAuth={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
        onChangeMovie={() => setIsSearchOpen(true)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item) => handleOpenDetail(item)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
      />

      {/* Navbar's izledin+ trigger wires here — the modal was missing, so the
          button flipped state nothing rendered (the only surface without it). */}
      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
        onOpenAuth={() => {
          setIsPremiumOpen(false);
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
