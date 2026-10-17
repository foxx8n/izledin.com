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
} from "@/lib/services/watch-logs.service";
import { STATIC_MASTER_CATALOG } from "@/lib/omdb";
import {
  getOrCreateDiscoverySeed,
  sortMediaCatalog,
  seededShuffle,
} from "@/lib/algorithms/discovery";
import { createClient } from "@/lib/supabase/client";
import {
  enqueueSwipe,
  getQueuedSwipes,
  clearQueuedSwipes,
} from "@/lib/swipe-queue";
import { getLiquidityDecision, type LiquidityDecision } from "@/lib/liquidity";
import { isOnboarded } from "@/lib/onboarding";
import { useSwipeDeck, type DeckHistoryEntry } from "@/hooks/useSwipeDeck";
import type { MediaItem, MovieMateMatch } from "@/types";
import { SwipeMatchCard } from "@/components/matches/SwipeMatchCard";
import { MediaSwipeCard } from "@/components/home/MediaSwipeCard";
import { useTranslation } from "@/lib/i18n/context";

const MediaDetailModal = dynamic(
  () =>
    import("@/components/media/MediaDetailModal").then((m) => m.MediaDetailModal),
  { ssr: false },
);
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((m) => m.AuthModal),
  { ssr: false },
);
const QuickLogModal = dynamic(
  () =>
    import("@/components/media/QuickLogModal").then((m) => m.QuickLogModal),
  { ssr: false },
);
const SearchModal = dynamic(
  () => import("@/components/media/SearchModal").then((m) => m.SearchModal),
  { ssr: false },
);

const TITLE_DECK_SIZE = 20;
/** S10: the auth hook fires after this many pre-signin swipes. */
const GUEST_AUTH_HOOK_SWIPES = 8;

/**
 * PERDE deck brain (S5). Authenticated users get a liquidity-governed deck:
 * people-dominant when the network is alive, title-first with capped İzdaş
 * teasers when it is not — never an empty room, never a fabricated one.
 * Guests get the funnel entry point (full playable guest round lands in S10).
 */
export function HomeDeck() {
  const { user, profile } = useAuth();
  const { t, locale, href } = useTranslation();
  const [decision, setDecision] = useState<LiquidityDecision | null>(null);
  const [matches, setMatches] = useState<MovieMateMatch[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [seenTitleIds, setSeenTitleIds] = useState<Set<string>>(new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  // Detail-modal → "Günlüğe Yaz" flow (same machinery as KEŞİF).
  const [quickLogItem, setQuickLogItem] = useState<MediaItem | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"navigate" | "quicklog">("quicklog");
  // Bumped after a diary save so the exclusion sets refetch and the logged
  // title never reappears in a future deck.
  const [logsVersion, setLogsVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [discoverySeed] = useState(() =>
    typeof window !== "undefined" ? getOrCreateDiscoverySeed() : "default_seed",
  );

  const unseenPool = useMemo(() => {
    if (!profile) return [];
    const ranked = sortMediaCatalog(
      STATIC_MASTER_CATALOG as MediaItem[],
      "recommended",
      profile,
      discoverySeed,
    );
    // Refresh-stability: anything already swiped (title_swipes) or logged
    // (any watch status) never re-enters the deck — otherwise every reload
    // dealt a fresh-looking 20 while the top of the catalog stayed the same.
    return ranked.filter(
      (m) => !seenTitleIds.has(m.id) && !watchlistIds.has(m.id),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, seenTitleIds, watchlistIds]);
  const titleQueue = useMemo(
    () => unseenPool.slice(0, TITLE_DECK_SIZE),
    [unseenPool],
  );

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
      // Every logged title (watchlist, watched, dropped...) leaves the deck —
      // the deck is for DISCOVERY, not re-encounters.
      setWatchlistIds(new Set(logs.map((l) => l.mediaId)));
    });
    return () => {
      cancelled = true;
    };
  }, [user, logsVersion]);

  // S12 follow-up: titles the user already swiped never come back after a
  // refresh. Local state also absorbs the current session's swipes instantly.
  useEffect(() => {
    if (!user) {
      setSeenTitleIds(new Set());
      return;
    }
    let cancelled = false;
    createClient()
      .from("title_swipes")
      .select("media_id")
      .eq("user_id", user.id)
      .then(({ data }: { data: { media_id: string }[] | null }) => {
        if (!cancelled && data) {
          setSeenTitleIds(new Set(data.map((r) => r.media_id)));
        }
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
    } else if (result.limitReached) {
      showToast("Günlük izdaş isteği sınırına ulaştın. Yarın tekrar dene.");
    } else if (result.rejected) {
      // Sticky rejection must NEVER be silent: the card left the deck and the
      // user deserves to know why nothing happened.
      showToast(
        `@${match.user.username} bu eşleşmeye daha önce pas geçmiş — yeniden açma hakkı onlarda.`,
      );
    } else {
      showToast("İstek gönderilemedi. Bağlantını kontrol et.");
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
  // S15 BİLET — super-like with DB-side quota (free 1/day, Kulüp unlimited).
  const commitBilet = async (match: MovieMateMatch) => {
    if (!user) return;
    const result = await requestMatch(
      user.id,
      match.user.id,
      "pending",
      match.compatibilityScore,
      match.sharedGenres,
      match.sharedTitles,
      true,
    );
    if (result.ok && result.matchId) {
      match.id = result.matchId;
      match.status = "pending";
      match.initiatorId = user.id;
      showToast(`BİLET gönderildi — @${match.user.username} onaylarsa sohbet açılır.`);
    } else if (result.limitReached) {
      showToast("Günlük BİLET sınırına ulaştın (1). Kulüp üyeliği ile sınırsız.");
    } else if (result.rejected) {
      showToast(
        `@${match.user.username} bu eşleşmeye daha önce pas geçmiş — BİLET gönderilemedi.`,
      );
    } else {
      showToast("BİLET gönderilemedi. Bağlantını kontrol et.");
    }
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

  // ── S10 guest funnel state (hooks live above every early return) ──
  const [guestIndex, setGuestIndex] = useState(0);
  const [sessionSwipeCount, setSessionSwipeCount] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const guestQueue = useMemo(() => {
    if (user) return [];
    const topRated = [...(STATIC_MASTER_CATALOG as MediaItem[])]
      .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
      .slice(0, 40);
    return seededShuffle(topRated, `guest_${discoverySeed}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Replay queued pre-signin swipes into private title_swipes on any
  // successful session. Upsert latest-wins = idempotent, so a failed attempt
  // simply leaves the queue for next login.
  const replayedRef = React.useRef(false);
  React.useEffect(() => {
    if (replayedRef.current) return;
    const queued = getQueuedSwipes();
    if (queued.length === 0) return;
    replayedRef.current = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } | null }) => {
      const uid = data?.user?.id;
      if (!uid) {
        replayedRef.current = false;
        return;
      }
      supabase
        .from("title_swipes")
        .upsert(
          queued.map((s) => ({
            user_id: uid,
            media_id: s.mediaId,
            media_type: s.mediaType,
            direction: s.direction,
          })),
          { onConflict: "user_id,media_id" },
        )
        .then(({ error }: { error: { message: string } | null }) => {
          if (!error) clearQueuedSwipes();
          else replayedRef.current = false;
        });
    });
  }, []);

  // S12: signed-in title swipes persist to title_swipes so the matcher's
  // taste-vector term can compute co-like overlap. Fire-and-forget — a failed
  // write must never block a gesture; latest-wins upsert keeps it idempotent.
  const persistSwipe = (item: MediaItem, direction: "like" | "pass") => {
    if (!user) return;
    setSeenTitleIds((prev) => new Set(prev).add(item.id));
    createClient()
      .from("title_swipes")
      .upsert(
        {
          user_id: user.id,
          media_id: item.id,
          media_type: item.type,
          direction,
        },
        { onConflict: "user_id,media_id" },
      )
      .then();
  };

  // Owner ruling: SEVDİM = matching signal ONLY. The deck writes title_swipes
  // and nothing else — watch_logs stays a place for DELIBERATE diary entries,
  // so the community feed, watch-stats trigger and the diary itself never see
  // swipe noise again. List management lives in KEŞİF (+ button) / detail.
  const handleTitleLike = (item: MediaItem) => {
    if (!user) return;
    persistSwipe(item, "like");
    showToast(
      locale === "en"
        ? `Saved "${item.title}" to your likes.`
        : `"${item.title}" beğenin kaydedildi.`
    );
    setTitleIndex((i) => i + 1);
  };
  const [titleIndex, setTitleIndex] = useState(0);
  const handleTitlePass = (item: MediaItem) => {
    persistSwipe(item, "pass");
    setTitleIndex((i) => i + 1);
  };

  // ── Real PERDE MOLASI: a persisted cooldown, not a per-refresh promise ──
  // Finishing the dealt deck locks it until the next local midnight. The
  // timestamp lives in localStorage keyed by user, so F5 / new tabs all see
  // the same mola; only the clock can end it.
  const perdeCooldownKey = user ? `izledin_perde_next_${user.id}` : null;
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!user || !perdeCooldownKey) {
      setCooldownUntil(null);
      return;
    }
    try {
      const raw = localStorage.getItem(perdeCooldownKey);
      const t = raw ? Number(raw) : 0;
      if (Number.isFinite(t) && t > Date.now()) {
        setCooldownUntil(t);
      } else if (raw) {
        localStorage.removeItem(perdeCooldownKey);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const deckHasNext = titleQueue.length > titleIndex;
  const poolGenuinelyEmpty = unseenPool.length === 0;

  // Deal exhausted -> arm the cooldown once.
  useEffect(() => {
    if (!user || !perdeCooldownKey || cooldownUntil !== null) return;
    if (deckHasNext || poolGenuinelyEmpty) return;
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const until = nextMidnight.getTime();
    try {
      localStorage.setItem(perdeCooldownKey, String(until));
    } catch {}
    setCooldownUntil(until);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deckHasNext,
    poolGenuinelyEmpty,
    cooldownUntil,
    user?.id,
    perdeCooldownKey,
  ]);

  // Countdown tick; when the clock runs out, deal a fresh window.
  useEffect(() => {
    if (cooldownUntil === null) return;
    const iv = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        if (perdeCooldownKey) {
          try {
            localStorage.removeItem(perdeCooldownKey);
          } catch {}
        }
        setCooldownUntil(null);
        setTitleIndex(0);
      } else {
        setTick((v) => v + 1);
      }
    }, 30000);
    return () => clearInterval(iv);
  }, [cooldownUntil, perdeCooldownKey]);

  const formatMolaRemaining = () => {
    if (!cooldownUntil) return "";
    const ms = Math.max(0, cooldownUntil - Date.now());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (locale === "en") {
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
  };

  // ── S10 guest funnel: PLAYABLE deck, queue + auth hook ──
  if (!user) {
    const current = guestQueue[guestIndex];
    const handleSwipe = (direction: "like" | "pass", item: MediaItem) => {
      enqueueSwipe(item.id, item.type, direction);
      const nextCount = sessionSwipeCount + 1;
      setSessionSwipeCount(nextCount);
      setGuestIndex((i) => i + 1);
      if (nextCount >= GUEST_AUTH_HOOK_SWIPES && !showAuth) setShowAuth(true);
    };

    return (
      <section className="space-y-5">
        <div className="max-w-md mx-auto space-y-2">
          {current ? (
            <>
              <MediaSwipeCard
                item={current}
                nextItem={guestQueue[guestIndex + 1]}
                isWatchlisted={false}
                onLike={(item) => handleSwipe("like", item)}
                onPass={(item) => handleSwipe("pass", item)}
                onDetail={() => {}}
              />
              <p className="text-center text-[11px] font-mono font-black uppercase text-neutral-500 tracking-widest">
                {locale === "en"
                  ? `SCREEN ${guestIndex + 1} / ${guestQueue.length} — likes being recorded`
                  : `PERDE ${guestIndex + 1} / ${guestQueue.length} — beğenilerin kaydediliyor`}
              </p>
            </>
          ) : (
            <div className="bg-[#171717] border-2 sm:border-4 border-[#404040] shadow-[6px_6px_0px_#EF4444] p-8 font-mono text-center space-y-4">
              <CinemaRadarScannerIllustration size={72} className="mx-auto" />
              <h3 className="text-lg font-black uppercase text-[#FAFAFA]">
                {locale === "en" ? "FREQUENCY FORMING" : "FREKANSIN OLUŞUYOR"}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {locale === "en"
                  ? "Join with Google; your recorded likes will build your Cinema DNA and connect you with film mates on the same frequency."
                  : "Google ile katıl; kaydettiğin beğeniler Sinema DNA'nı oluştursun ve seni aynı frekanstaki İzdaşlarla eşleştirsin."}
              </p>
            </div>
          )}
        </div>

        {/* Auth hook — participatory, never a wall */}
        {showAuth && (
          <div className="max-w-md mx-auto bg-[#171717] border-2 border-emerald-600/60 shadow-[4px_4px_0px_#10B981] p-5 font-mono text-center space-y-3">
            <p className="text-xs font-black uppercase text-[#FAFAFA] tracking-wide">
              {locale === "en"
                ? `DNA FORMING — ${Math.min(sessionSwipeCount, GUEST_AUTH_HOOK_SWIPES)} LIKES SAVED`
                : `DNA'N OLUŞUYOR — ${Math.min(sessionSwipeCount, GUEST_AUTH_HOOK_SWIPES)} BEĞENİ KAYITLI`}
            </p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {locale === "en"
                ? "Sign in with Google to keep going. All your likes transfer immediately to your account, none lost."
                : "Devam etmek için Google ile mühürle. Beğenilerin hesabına aktarılır, hiçbiri kaybolmaz."}
            </p>
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="hidden"
              aria-hidden
            />
            <Link
              href={href("/matches")}
              className="inline-block px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#404040] shadow-[3px_3px_0px_#000000]"
              onClick={(e) => {
                e.preventDefault();
                setShowAuth(true);
              }}
            >
              {locale === "en" ? "CONTINUE →" : "DEVAM ET →"}
            </Link>
            {!showAuth && null}
          </div>
        )}

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          defaultMode="login"
        />
      </section>
    );
  }

  // ── Loading ──
  if (!decision || loadingPeople) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 font-mono">
        <Loader2 className="w-9 h-9 text-[#EF4444] animate-spin" />
        <span className="text-xs font-black uppercase text-[#FAFAFA]">
          {locale === "en" ? "SCANNING FREQUENCY..." : "FREKANS TARANIYOR..."}
        </span>
      </div>
    );
  }

  const currentMatch = matches[deck.index];
  const currentTitle = titleQueue[titleIndex];
  const needsDna = !isOnboarded(profile);

  return (
    <section className="space-y-5">
      {/* Governor status strip — real numbers only */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#171717] border-2 border-[#404040] shadow-[3px_3px_0px_#000000] font-mono text-[11px] font-black uppercase tracking-widest">
        <span className="text-[#EF4444] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {decision.mode === "people_dominant"
            ? (locale === "en" ? "FILM MATES ACTIVE" : "İZDAŞ MODU AKTİF")
            : (locale === "en" ? "SCREEN MODE — SOLO PLAY" : "PERDE MODU — TEK BAŞINA DA OYUN")}
        </span>
        <span className="text-neutral-500">
          {decision.activeCount7d} {locale === "en" ? "active cinephiles" : "aktif sinefil"}
        </span>
      </div>

      {needsDna ? (
        <div className="bg-[#171717] border-2 sm:border-4 border-[#404040] shadow-[6px_6px_0px_#EF4444] p-8 font-mono text-center space-y-4">
          <CinemaDnaHelixIcon size={56} className="mx-auto text-[#EF4444]" />
          <h3 className="text-lg font-black uppercase text-[#FAFAFA]">
            {locale === "en" ? "FIRST, CRAFT YOUR CINEMA DNA" : "ÖNCE SİNEMA DNA'NI ÇIKAR"}
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            {locale === "en"
              ? "Select your favorite masterpieces; only then can the radar find your frequency."
              : "Favori başyapıtlarını seç; radar ancak o zaman frekansını bulabilir."}
          </p>
          <Link
            href={href("/matches")}
            className="inline-block px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-[#404040] shadow-[3px_3px_0px_#000000]"
          >
            {locale === "en" ? "CRAFT DNA →" : "DNA'NI ÇIKAR →"}
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
              onBilet={commitBilet}
              onChatClick={() => {}}
            />
          </div>
          <div className="max-w-md mx-auto flex items-center justify-between font-mono text-[11px] font-black uppercase">
            <span className="text-neutral-500">
              {locale === "en" ? "CARD" : "KART"} {Math.min(deck.index + 1, matches.length)} / {matches.length}
            </span>
            <button
              type="button"
              onClick={() => deck.undo()}
              disabled={!deck.canUndo}
              className="text-[#EF4444] disabled:text-neutral-600 hover:text-white transition-colors cursor-pointer disabled:cursor-default"
            >
              ⟲ {locale === "en" ? "UNDO" : "GERİ AL"}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* People teasers — capped by the governor, real candidates only */}
          {matches.length > 0 && decision.dailyTeaserQuota > 0 && (
            <div className="max-w-md mx-auto space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500 font-mono">
                {locale === "en" ? "ON RADAR TODAY" : "RADARDA BUGÜN"}
              </p>
              {matches.slice(0, decision.dailyTeaserQuota).map((m) => (
                <Link
                  key={m.id}
                  href={href("/matches")}
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
                      %{m.compatibilityScore} {locale === "en" ? "match" : "uyum"} •{" "}
                      {m.sharedGenres.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#EF4444] group-hover:text-white shrink-0">
                    {locale === "en" ? "VIEW →" : "GÖR →"}
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
                {locale === "en"
                  ? `SCREEN ${titleIndex + 1} / ${titleQueue.length} — when done, `
                  : `PERDE ${titleIndex + 1} / ${titleQueue.length} — bittiğinde `}
                <Link
                  href={href("/kesif")}
                  className="text-[#EF4444] hover:text-white underline"
                >
                  {locale === "en" ? "DISCOVERY" : "KEŞİF"}
                </Link>{" "}
                {locale === "en" ? "awaits you" : "seni bekler"}
              </p>
            </>
          ) : (
            <div className="bg-[#171717] border-2 sm:border-4 border-[#404040] shadow-[6px_6px_0px_#000000] p-8 font-mono text-center space-y-3 max-w-md mx-auto">
              <h3 className="text-base font-black uppercase text-[#FAFAFA]">
                {t.home.breakTitle}
              </h3>
              <p className="text-xs text-neutral-400">
                {poolGenuinelyEmpty
                  ? (locale === "en"
                      ? "No unseen masterpieces left — screen refreshes as you log new entries in your diary."
                      : "Görmediğin yeni başyapıt kalmadı — günlüğüne yenilerini ekledikçe perde yenilenir.")
                  : t.home.breakDesc}
              </p>
              {cooldownUntil && (
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                  {locale === "en"
                    ? `NEXT SCREEN OPENS IN ~${formatMolaRemaining()}`
                    : `YENİ PERDE ~${formatMolaRemaining()} SONRA AÇILIR`}
                </p>
              )}
              <Link
                href={href("/kesif")}
                className="inline-block px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-[#404040] shadow-[3px_3px_0px_#000000]"
              >
                {t.home.exploreCatalog} →
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
        onOpenLog={(item) => {
          setDetailItem(null);
          setQuickLogItem(item);
          setIsQuickLogOpen(true);
        }}
      />

      <QuickLogModal
        item={quickLogItem}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveLog={() => setLogsVersion((v) => v + 1)}
        onOpenAuth={() => setShowAuth(true)}
        onChangeMovie={() => setIsSearchOpen(true)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item) => {
          setIsSearchOpen(false);
          if (searchTarget === "quicklog") {
            setQuickLogItem(item);
            setIsQuickLogOpen(true);
          }
        }}
      />
    </section>
  );
}
