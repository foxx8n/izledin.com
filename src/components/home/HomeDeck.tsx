"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Radar } from "lucide-react";
import {
  CinemaRadarScannerIllustration,
  CinemaDnaHelixIcon,
} from "@/components/icons/CinemaIcons";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import {
  computeDiscoverMatches,
  requestMatch,
  createOrUpdateMatch,
} from "@/lib/services/matches.service";
import {
  getUserWatchLogs,
  toggleWatchlistItem,
} from "@/lib/services/watch-logs.service";
import { STATIC_MASTER_CATALOG } from "@/lib/omdb";
import {
  getOrCreateDiscoverySeed,
  sortMediaCatalog,
} from "@/lib/algorithms/discovery";
import { getLiquidityDecision, type LiquidityDecision } from "@/lib/liquidity";
import { useSwipeDeck, type DeckHistoryEntry } from "@/hooks/useSwipeDeck";
import type { MediaItem, MovieMateMatch } from "@/types";
import { SwipeMatchCard } from "@/components/matches/SwipeMatchCard";
import { MediaSwipeCard } from "@/components/home/MediaSwipeCard";

const MediaDetailModal = dynamic(
  () =>
    import("@/components/media/MediaDetailModal").then((m) => m.MediaDetailModal),
  { ssr: false },
);

const TITLE_DECK_SIZE = 20;

/**
 * PERDE deck brain (S5). Authenticated users get a liquidity-governed deck:
 * people-dominant when the network is alive, title-first with capped İzdaş
 * teasers when it is not — never an empty room, never a fabricated one.
 * Guests get the funnel entry point (full playable guest round lands in S10).
 */
export function HomeDeck() {
  const { user, profile } = useAuth();
  const [decision, setDecision] = useState<LiquidityDecision | null>(null);
  const [matches, setMatches] = useState<MovieMateMatch[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [discoverySeed] = useState(() =>
    typeof window !== "undefined" ? getOrCreateDiscoverySeed() : "default_seed",
  );

  const titleQueue = useMemo(() => {
    if (!profile) return [];
    const ranked = sortMediaCatalog(
      STATIC_MASTER_CATALOG as MediaItem[],
      "recommended",
      profile,
      discoverySeed,
    );
    return ranked
      .filter((m) => !watchlistIds.has(m.id))
      .slice(0, TITLE_DECK_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, watchlistIds]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    getLiquidityDecision().then((d) => {
      if (!cancelled) setDecision(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !profile) {
      setMatches([]);
      return;
    }
    setLoadingPeople(true);
    let cancelled = false;
    computeDiscoverMatches(profile, "all", 12)
      .then((computed) => {
        if (!cancelled) setMatches(computed);
      })
      .finally(() => {
        if (!cancelled) setLoadingPeople(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

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

  // People-deck delayed-commit machinery (same semantics as matches page S3):
  // commits fire after the undo window; no auto-open chat on commit.
  const commitLike = async (match: MovieMateMatch) => {
    if (!user) return;
    const result = await requestMatch(
      user.id,
      match.user.id,
      "pending",
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles,
    );
    if (result.ok && result.matchId) {
      match.id = result.matchId;
      match.status = "pending";
      match.initiatorId = user.id;
    }
  };
  const commitPass = async (match: MovieMateMatch) => {
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
  const removeCard = (match: MovieMateMatch) =>
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
  const reinsertCard = (entry: DeckHistoryEntry) =>
    setMatches((prev) => {
      if (prev.some((m) => m.id === entry.match.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(entry.index, next.length), 0, entry.match);
      return next;
    });

  const deck = useSwipeDeck({
    onLikeCommit: commitLike,
    onPassGesture: removeCard,
    onPassCommit: commitPass,
    onPassUndo: reinsertCard,
  });

  // Title likes persist for real via the watchlist write (no bare gestures).
  const handleTitleLike = async (item: MediaItem) => {
    if (!user) return;
    try {
      await toggleWatchlistItem(user.id, item);
      setWatchlistIds((prev) => new Set(prev).add(item.id));
      showToast(`"${item.title}" listene eklendi.`);
    } catch {
      showToast("Liste güncellenemedi.");
      return;
    }
    setTitleIndex((i) => i + 1);
  };
  const [titleIndex, setTitleIndex] = useState(0);
  const handleTitlePass = () => setTitleIndex((i) => i + 1);

  // ── Guest branch ──
  if (!user) {
    return (
      <section className="bg-[#171717] border-2 sm:border-4 border-[#404040] shadow-[8px_8px_0px_#EF4444] p-6 sm:p-10 font-mono text-center space-y-5">
        <CinemaRadarScannerIllustration size={84} className="mx-auto" />
        <h2 className="text-xl sm:text-3xl font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
          RADAR SENİ BEKLİYOR
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Google ile katıl; Sinema DNA&apos;nı çıkar, aynı filmlerde ağlayan
          İzdaşlarınla eşleş.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/matches"
            className="px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#404040] shadow-[3px_3px_0px_#000000] transition-all inline-flex items-center gap-2"
          >
            <Radar className="w-4 h-4" />
            <span>İZDAŞINI BUL</span>
          </Link>
          <Link
            href="/kesif"
            className="px-5 py-3 bg-[#262626] hover:bg-[#404040] text-white text-xs font-black uppercase border-2 border-[#404040] shadow-[3px_3px_0px_#000000] transition-all"
          >
            ÖNCE KATALOĞU GEZ
          </Link>
        </div>
      </section>
    );
  }

  // ── Loading ──
  if (!decision || loadingPeople) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 font-mono">
        <Loader2 className="w-9 h-9 text-[#EF4444] animate-spin" />
        <span className="text-xs font-black uppercase text-[#FAFAFA]">
          FREKANS TARANIYOR...
        </span>
      </div>
    );
  }

  const currentMatch = matches[deck.index];
  const currentTitle = titleQueue[titleIndex];
  const needsDna =
    !profile?.favoriteGenres?.length || !profile?.top4Favorites?.length;

  return (
    <section className="space-y-5">
      {/* Governor status strip — real numbers only */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#171717] border-2 border-[#404040] shadow-[3px_3px_0px_#000000] font-mono text-[11px] font-black uppercase tracking-widest">
        <span className="text-[#EF4444] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {decision.mode === "people_dominant"
            ? "İZDAŞ MODU AKTİF"
            : "PERDE MODU — TEK BAŞINA DA OYUN"}
        </span>
        <span className="text-neutral-500">{decision.activeCount7d} aktif sinefil</span>
      </div>

      {needsDna ? (
        <div className="bg-[#171717] border-2 sm:border-4 border-[#404040] shadow-[6px_6px_0px_#EF4444] p-8 font-mono text-center space-y-4">
          <CinemaDnaHelixIcon size={56} className="mx-auto text-[#EF4444]" />
          <h3 className="text-lg font-black uppercase text-[#FAFAFA]">
            ÖNCE SİNEMA DNA&apos;NI ÇIKAR
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Türlerini ve favori 4 başyapıtını seç; radar ancak o zaman
            frekansını bulabilir.
          </p>
          <Link
            href="/matches"
            className="inline-block px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-[#404040] shadow-[3px_3px_0px_#000000]"
          >
            DNA&apos;NI ÇIKAR →
          </Link>
        </div>
      ) : decision.mode === "people_dominant" && currentMatch ? (
        <>
          <div className="max-w-md mx-auto">
            <SwipeMatchCard
              match={currentMatch}
              nextMatch={matches[deck.index + 1]}
              onLike={(m) => deck.swipeLike(m)}
              onPass={(m) => deck.swipePass(m)}
              onChatClick={() => {}}
            />
          </div>
          <div className="max-w-md mx-auto flex items-center justify-between font-mono text-[11px] font-black uppercase">
            <span className="text-neutral-500">
              KART {Math.min(deck.index + 1, matches.length)} / {matches.length}
            </span>
            <button
              type="button"
              onClick={() => deck.undo()}
              disabled={!deck.canUndo}
              className="text-[#EF4444] disabled:text-neutral-600 hover:text-white transition-colors cursor-pointer disabled:cursor-default"
            >
              ⟲ GERİ AL
            </button>
          </div>
        </>
      ) : (
        <>
          {/* People teasers — capped by the governor, real candidates only */}
          {matches.length > 0 && decision.dailyTeaserQuota > 0 && (
            <div className="max-w-md mx-auto space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500 font-mono">
                RADARDA BUGÜN
              </p>
              {matches.slice(0, decision.dailyTeaserQuota).map((m) => (
                <Link
                  key={m.id}
                  href="/matches"
                  className="flex items-center gap-3 p-2.5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[3px_3px_0px_#000000] transition-all group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.user.avatarUrl}
                    alt={m.user.fullName}
                    width={36}
                    height={36}
                    className="w-9 h-9 border border-[#404040] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase text-[#FAFAFA] truncate">
                      {m.user.fullName}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-bold truncate">
                      %{m.compatibilityScore} uyum •{" "}
                      {m.sharedGenres.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#EF4444] group-hover:text-white shrink-0">
                    GÖR →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {currentTitle ? (
            <>
              <MediaSwipeCard
                item={currentTitle}
                nextItem={titleQueue[titleIndex + 1]}
                isWatchlisted={watchlistIds.has(currentTitle.id)}
                onLike={handleTitleLike}
                onPass={handleTitlePass}
                onDetail={(item) => setDetailItem(item)}
              />
              <p className="text-center text-[11px] font-mono font-black uppercase text-neutral-500 tracking-widest">
                PERDE {titleIndex + 1} / {titleQueue.length} — bittiğinde{" "}
                <Link
                  href="/kesif"
                  className="text-[#EF4444] hover:text-white underline"
                >
                  KEŞİF
                </Link>{" "}
                seni bekler
              </p>
            </>
          ) : (
            <div className="bg-[#171717] border-2 sm:border-4 border-[#404040] shadow-[6px_6px_0px_#000000] p-8 font-mono text-center space-y-3 max-w-md mx-auto">
              <h3 className="text-base font-black uppercase text-[#FAFAFA]">
                GÜNÜN SEANSI BİTTİ
              </h3>
              <p className="text-xs text-neutral-400">
                Bugünkü desteyi tamamladın. Katalogda keşfedilecek çok başyapıt
                var.
              </p>
              <Link
                href="/kesif"
                className="inline-block px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-[#404040] shadow-[3px_3px_0px_#000000]"
              >
                KEŞFE DEVAM →
              </Link>
            </div>
          )}
        </>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 bg-[#171717] text-[#FAFAFA] text-xs font-mono font-bold border-2 border-[#404040] shadow-[4px_4px_0px_#000000]"
        >
          {toast}
        </div>
      )}

      <MediaDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        onOpenLog={() => {}}
      />
    </section>
  );
}
