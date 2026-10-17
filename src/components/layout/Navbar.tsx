"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, ChevronDown, LogOut, LogIn, ShieldAlert, X } from "lucide-react";
import {
  CinemaLogoMark,
  FilmReelIcon,
  CinemaFrequencyIcon,
  FilmStripIcon,
  CinemaCalendarIcon,
  CinemaSearchLensIcon,
  CinemaChatIcon,
  CinemaPlusPassIcon,
  CinemaUserIcon,
  IzledinPlusBadge,
} from "@/components/icons/CinemaIcons";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/lib/i18n/context";
import { getInboxSummary } from "@/lib/services/inbox.service";
import { getProfileById } from "@/lib/services/profile.service";
import {
  isAdminEmail,
  getSiteSetting,
  BroadcastAnnouncement,
} from "@/lib/services/admin.service";
import { createClient } from "@/lib/supabase/client";
import { getMasterpieceOfTheWeekSync } from "@/lib/omdb";
import { MediaItem, MovieMateMatch } from "@/types";

const QuickLogModal = dynamic(
  () =>
    import("@/components/media/QuickLogModal").then((mod) => mod.QuickLogModal),
  { ssr: false },
);
const SearchModal = dynamic(
  () => import("@/components/media/SearchModal").then((mod) => mod.SearchModal),
  { ssr: false },
);
const PremiumModal = dynamic(
  () =>
    import("@/components/premium/PremiumModal").then((mod) => mod.PremiumModal),
  { ssr: false },
);
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false },
);
const InboxModal = dynamic(
  () => import("@/components/inbox/InboxModal").then((mod) => mod.InboxModal),
  { ssr: false },
);
const ChatModal = dynamic(
  () => import("@/components/matches/ChatModal").then((mod) => mod.ChatModal),
  { ssr: false },
);
const MatchAcceptedToast = dynamic(
  () =>
    import("@/components/matches/MatchAcceptedToast").then(
      (mod) => mod.MatchAcceptedToast,
    ),
  { ssr: false },
);

interface NavbarProps {
  onOpenQuickLog?: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  onOpenPremium?: () => void;
  onOpenInbox?: () => void;
  onOpenChat?: (match: MovieMateMatch) => void;
}

export function Navbar({
  onOpenQuickLog,
  onOpenSearch,
  onOpenAuth,
  onOpenPremium,
  onOpenInbox,
  onOpenChat,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarUserMenuOpen, setSidebarUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] =
    useState<BroadcastAnnouncement | null>(null);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sidebarUserMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile, isLoading, signOut } = useAuth();
  const { t, locale, setLocale, href } = useTranslation();

  // Internal modal states when parent pages don't provide modal bindings
  const [internalPremiumOpen, setInternalPremiumOpen] = useState(false);
  const [internalQuickLogOpen, setInternalQuickLogOpen] = useState(false);
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);
  const [internalAuthOpen, setInternalAuthOpen] = useState(false);
  const [internalInboxOpen, setInternalInboxOpen] = useState(false);
  const [internalChatOpen, setInternalChatOpen] = useState(false);
  const [internalChatMatch, setInternalChatMatch] =
    useState<MovieMateMatch | null>(null);
  const [internalQuickLogItem, setInternalQuickLogItem] =
    useState<MediaItem | null>(null);
  const [acceptedMatch, setAcceptedMatch] = useState<MovieMateMatch | null>(null);
  const [isAcceptedToastOpen, setIsAcceptedToastOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"navigate" | "quicklog">(
    "navigate",
  );

  const handleOpenSearch = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setSearchTarget("navigate");
      setInternalSearchOpen(true);
    }
  };

  const handleOpenPremium = () => {
    if (onOpenPremium) {
      onOpenPremium();
    } else {
      setInternalPremiumOpen(true);
    }
  };

  const handleOpenQuickLog = () => {
    if (onOpenQuickLog) {
      onOpenQuickLog();
    } else {
      if (!user) {
        handleOpenAuth();
        return;
      }
      let quickItem: MediaItem = getMasterpieceOfTheWeekSync();
      try {
        const cached = localStorage.getItem('izledin_cached_featured_masterpiece');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id && parsed?.title) quickItem = parsed;
        }
      } catch {}
      setInternalQuickLogItem(quickItem);
      setInternalQuickLogOpen(true);
    }
  };

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setInternalAuthOpen(true);
    }
  };

  const handleOpenInbox = () => {
    if (onOpenInbox) {
      onOpenInbox();
    } else {
      setInternalInboxOpen(true);
    }
  };

  const isUserAdmin = isAdminEmail(user?.email) || (user?.app_metadata as any)?.role === 'admin';

  // Load global broadcast announcement
  useEffect(() => {
    getSiteSetting<BroadcastAnnouncement | null>(
      "broadcast_announcement",
      null,
    ).then((data) => {
      if (data && data.enabled && data.message) {
        setAnnouncement(data);
      }
    });
  }, []);

  // Close top-bar dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close sidebar dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarUserMenuRef.current &&
        !sidebarUserMenuRef.current.contains(event.target as Node)
      ) {
        setSidebarUserMenuOpen(false);
      }
    };
    if (sidebarUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarUserMenuOpen]);

  // Load and listen to realtime inbox updates for badge count.
  // Refreshes are debounced: mark-as-read storms used to trigger one full
  // inbox recomputation per message row.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const refreshBadge = () => {
      getInboxSummary(user.id)
        .then((summary) => {
          setUnreadCount(
            summary.totalUnreadCount + summary.pendingRequestsCount,
          );
        })
        .catch(() => {});
    };

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleBadgeRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refreshBadge, 400);
    };

    refreshBadge();

    const supabase = createClient();
    const channel = supabase
      .channel(`navbar_inbox_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => scheduleBadgeRefresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movie_mate_matches" },
        (payload: any) => {
          scheduleBadgeRefresh();
          // Detect when a match request is accepted (transitions to 'matched')
          if (
            payload.eventType === "UPDATE" &&
            payload.new?.status === "matched" &&
            payload.old?.status !== "matched"
          ) {
            const partnerId =
              payload.new.user_id_1 === user.id
                ? payload.new.user_id_2
                : payload.new.user_id_1;
            if (partnerId) {
              getProfileById(partnerId).then((partner) => {
                if (partner) {
                  const matchObj: MovieMateMatch = {
                    id: payload.new.id,
                    user: partner,
                    compatibilityScore:
                      typeof payload.new.compatibility_score === "number"
                        ? payload.new.compatibility_score
                        : 85,
                    intent: partner.matchIntent || "friend",
                    sharedGenres: payload.new.shared_genres || [],
                    sharedTitles: payload.new.shared_titles || [],
                    matchReasons: ["İzdaş eşleşmesi onaylandı"],
                    status: "matched",
                    initiatorId: payload.new.initiator_id,
                  };
                  setAcceptedMatch(matchObj);
                  setIsAcceptedToastOpen(true);
                }
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // S7 atomic flip (MATCHING-PIVOT-PLAN §2): PERDE is the front door; the
  // catalog showcase lives at /kesif. /upcoming stays routable but leaves the
  // nav (folds into Keşif later).
  const navLinks = [
    { href: href("/"), label: t.home.deckTitle, icon: FilmReelIcon },
    { href: href("/matches"), label: locale === 'tr' ? "İZDAŞ" : "RADAR", icon: CinemaFrequencyIcon },
    { href: href("/kesif"), label: locale === 'tr' ? "KEŞİF" : "DISCOVER", icon: CinemaSearchLensIcon },
    { href: href("/diary"), label: locale === 'tr' ? "GÜNLÜK" : "DIARY", icon: FilmStripIcon },
  ];

  const displayName =
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    (locale === 'tr' ? "Sinemasever" : "Cinephile");
  const username =
    profile?.username || user?.user_metadata?.user_name || (locale === 'tr' ? "kullanici" : "user");
  const avatarUrl =
    profile?.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0A0A0A&textColor=DC2626&fontWeight=900`;

  // ─── Shared: User Menu Items ────────────────────────────────────────────────
  // ONE source of truth for both the mobile header dropdown and the sidebar
  // dropdown. Profile-scoped actions ONLY — routes that already live in the
  // nav/bottom bar or have their own dedicated buttons (inbox, izdaş, diary,
  // izledin+) must never reappear here; duplicated entries aged into noise.
  const renderUserMenuItems = (close: () => void) => (
    <>
      <Link
        href={href("/profile")}
        onClick={close}
        className="flex items-center gap-2 p-2  hover:bg-[#262626] transition-colors min-h-[44px]"
      >
        <CinemaUserIcon size={14} className=" text-[#EF4444]" />
        <span>{t.nav.profile}</span>
      </Link>

      {isUserAdmin && (
        <Link
          href={href("/admin")}
          onClick={close}
          className="w-full flex items-center gap-2 p-2  bg-[#DC2626]/20 hover:bg-[#DC2626]   text-[#EF4444] hover:text-white font-black transition-colors border border-[#DC2626] min-h-[44px]"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t.nav.admin.toUpperCase()}</span>
        </Link>
      )}

      <div className="pt-2 mt-1 border-t-2  border-[#404040]">
        <button
          onClick={() => {
            close();
            signOut();
          }}
          className="w-full flex items-center gap-2 p-2 text-xs font-black  text-[#EF4444]  hover:bg-[#262626] transition-colors text-left uppercase font-mono cursor-pointer min-h-[44px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.nav.signOut}</span>
        </button>
      </div>
    </>
  );

  // ─── Shared: Announcement Banners ────────────────────────────────────────────
  // Rendered inside BOTH the mobile header AND the desktop sidebar so they are
  // always visible regardless of breakpoint.
  const AnnouncementBanners = () => (
    <>
      {announcement && announcement.enabled && !isAnnouncementDismissed && (
        <div
          className={`px-4 py-1.5 text-xs font-black uppercase font-mono flex items-center justify-between border-b-2 border-black select-none ${
            announcement.type === "event"
              ? "bg-[#F59E0B] text-black"
              : announcement.type === "alert"
                ? "bg-[#DC2626] text-white"
                : "bg-[#171717] text-white"
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-1.5 py-0.2 bg-black text-white text-[10px] shrink-0 font-bold">
              {announcement.badgeText || "DUYURU"}
            </span>
            <span className="truncate">{announcement.message}</span>
            {announcement.link && (
              <Link
                href={announcement.link}
                className="underline hover:opacity-80 shrink-0 ml-1"
              >
                İNCELE →
              </Link>
            )}
          </div>
          <button
            onClick={() => setIsAnnouncementDismissed(true)}
            className="p-1 hover:opacity-75 cursor-pointer shrink-0 ml-2"
            title="Duyuruyu Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {profile?.isBanned && (
        <div className="bg-[#DC2626] text-white px-4 py-2 text-xs font-black uppercase font-mono flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2 flex-1">
            <span className="bg-black text-white px-1.5 py-0.2 text-[10px]">
              HESAP ASKIYA ALINDI
            </span>
            <span>
              Hesabınız kuralları ihlal ettiği gerekçesiyle askıya alınmıştır:
              &quot;{profile.banReason || "Topluluk ihlali"}&quot;. Yeni kayıt
              veya mesaj gönderemezsiniz.
            </span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE / TABLET LAYOUT  (< lg / < 1024px)
          Sticky top header — inner content hidden on desktop via lg:hidden
      ════════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full max-w-full overflow-x-clip bg-[#0A0A0A] text-[#FAFAFA] border-b-4 border-[#262626] shadow-[0px_4px_0px_#000000] transition-colors duration-150">
        {/* Announcement banners — always visible on ALL breakpoints */}
        <AnnouncementBanners />

        {/* Top bar inner — hidden on desktop; sidebar takes over */}
        <div className="lg:hidden max-w-7xl mx-auto px-2 sm:px-4 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-3">
          {/* 1. Left Zone: Retro Masthead Brand */}
          <div className="flex items-center justify-start min-w-0 shrink">
            <Link
              href={href("/")}
              className="flex items-center gap-1.5 sm:gap-2.5 group"
            >
              <CinemaLogoMark
                size={22}
                className="transition-transform group-hover:rotate-6 group-hover:scale-105 shrink-0 sm:w-[28px] sm:h-[28px]"
              />
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[17px] sm:text-[22px] md:text-3xl font-black tracking-tight text-[#FAFAFA] group-hover:text-[#DC2626] transition-colors leading-none uppercase font-sans truncate"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  IZLEDIN
                  <span className="text-[#FF5555] drop-shadow-[0_0_8px_rgba(220,38,38,0.7)]">
                    .COM
                  </span>
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase font-mono tracking-widest text-[#A3A3A3] -mt-0.5 truncate">
                  {locale === "en" ? "Social Cinema Club" : "Sosyal Sinema Kulübü"}
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Right Zone: Compact Action Tools */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
            {/* Language Switcher (TR | EN) */}
            <div className="flex items-center border border-[#262626] bg-[#171717] p-0.5 text-[10px] font-mono font-black shrink-0 min-h-[34px] sm:min-h-[38px]">
              <button
                type="button"
                onClick={() => setLocale("tr")}
                className={`px-1.5 py-1 text-center transition-colors cursor-pointer ${
                  locale === "tr"
                    ? "bg-[#DC2626] text-white"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
                aria-label="Türkçe"
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`px-1.5 py-1 text-center transition-colors cursor-pointer ${
                  locale === "en"
                    ? "bg-[#DC2626] text-white"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
                aria-label="English"
              >
                EN
              </button>
            </div>

            {/* Quick Search Trigger */}
            <button
              onClick={handleOpenSearch}
              className="flex items-center justify-center p-2 text-xs font-mono text-[#A3A3A3] bg-[#171717] hover:bg-[#262626] border-2 border-[#262626] hover:border-[#DC2626] transition-all cursor-pointer shadow-[2px_2px_0px_#000000] min-w-[34px] sm:min-w-[38px] min-h-[34px] sm:min-h-[38px]"
              title={t.common.search}
              aria-label={t.common.search}
            >
              <CinemaSearchLensIcon
                size={14}
                className="text-[#DC2626] shrink-0"
              />
            </button>

            {/* izledin+ Membership Badge Trigger */}
            <button
              onClick={handleOpenPremium}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-2 bg-[#171717] hover:bg-[#262626] text-[#DC2626] hover:text-[#EF4444] text-xs font-black uppercase font-mono tracking-wider border-2 border-[#DC2626]/50 hover:border-[#DC2626] shadow-[2px_2px_0px_#000000] transition-all cursor-pointer min-h-[36px] sm:min-h-[38px]"
              aria-label="izledin+ Kulüp Üyeliği"
            >
              <CinemaPlusPassIcon size={14} className="text-[#DC2626]" />
              <span>izledin+</span>
            </button>

            {/* Stamped Action Button (İzledim / QuickLog) - hidden on small mobile because bottom bar has floating QuickLog */}
            <button
              onClick={handleOpenQuickLog}
              className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black tracking-wider uppercase font-mono border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer min-h-[36px] sm:min-h-[38px]"
              aria-label={t.nav.quickLog}
              title={t.nav.quickLog}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">{t.nav.quickLog}</span>
            </button>

            {/* User Auth & Personal Hub Section */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Inbox / Gelen Kutusu Trigger */}
                <button
                  onClick={handleOpenInbox}
                  className="relative p-1.5 sm:p-2 bg-[#171717] hover:bg-[#262626] text-[#FAFAFA] border-2 border-[#262626] hover:border-[#DC2626] transition-all cursor-pointer flex items-center justify-center min-w-[34px] sm:min-w-[38px] min-h-[34px] sm:min-h-[38px] shadow-[2px_2px_0px_#000000]"
                  title="Gelen Kutusu & Eşleşme İstekleri"
                  aria-label="Gelen Kutusu & Eşleşme İstekleri"
                >
                  <CinemaChatIcon size={16} className="text-[#DC2626]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#DC2626] text-white text-[10px] font-mono font-black border border-[#0A0A0A] shadow-[1px_1px_0px_#000000] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 p-0.5 sm:p-1 bg-[#171717] hover:bg-[#262626] border-2 border-[#262626] hover:border-[#DC2626] transition-all cursor-pointer min-h-[34px] sm:min-h-[38px] shadow-[2px_2px_0px_#000000]"
                    aria-label="Kullanıcı Profil Menüsü"
                  >
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="w-7 h-7 object-cover border border-[#0A0A0A] bg-black shrink-0"
                    />
                    <span className="hidden xl:inline text-xs font-black text-[#FAFAFA] uppercase font-mono max-w-[80px] truncate">
                      {displayName.split(" ")[0]}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-[#A3A3A3] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Pinned User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#171717] text-[#FAFAFA] border-2 border-[#404040] p-3 shadow-[6px_6px_0px_#000000] z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2 border-b-2 border-[#404040] mb-2 font-mono">
                        <p className="text-xs font-black uppercase truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-[#A3A3A3] truncate">
                          @{username}
                        </p>
                      </div>

                      <div className="space-y-1 font-mono text-xs font-bold uppercase">
                        {renderUserMenuItems(() => setUserMenuOpen(false))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-[34px] sm:w-[38px] h-[34px] sm:h-[38px] bg-[#171717] border-2 border-[#262626] shadow-[2px_2px_0px_#000000] shrink-0 animate-pulse" />
              </div>
            ) : (
              <button
                onClick={handleOpenAuth}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[#0A0A0A] text-xs font-black uppercase font-mono border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#000000] cursor-pointer transition-all min-h-[34px] sm:min-h-[40px]"
              >
                <LogIn className="w-3.5 h-3.5 text-[#DC2626] stroke-[3]" />
                <span className="hidden sm:inline">{locale === 'en' ? 'SIGN IN' : 'GİRİŞ YAP'}</span>
                <span className="sm:hidden">{locale === 'en' ? 'LOGIN' : 'GİRİŞ'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tactile Mobile Bottom Bar (Thumb-Zone Ergonomics with 48px+ Touch Targets) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0A0A] text-[#FAFAFA] border-t-4 border-[#262626] px-0.5 py-1 flex items-center justify-around shadow-[0px_-4px_0px_#000000] font-mono pb-safe transition-colors duration-150">
          {/* Perde — front door deck */}
          <Link
            href={href("/")}
            className={`flex-1 min-h-[48px] min-w-0 max-w-[70px] flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-0.5 text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              pathname === href("/")
                ? " text-[#FF5555] bg-[#171717] border border-[#404040]"
                : " text-[#D4D4D4] hover:text-[#FAFAFA]"
            }`}
          >
            <FilmReelIcon
              size={16}
              className={
                pathname === href("/")
                  ? " text-[#FF5555]"
                  : " text-[#D4D4D4]"
              }
            />
            <span className="truncate max-w-full">{t.home.deckTitle}</span>
          </Link>

          {/* İzdaşlar */}
          <Link
            href={href("/matches")}
            className={`flex-1 min-h-[48px] min-w-0 max-w-[70px] relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-0.5 text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              pathname === href("/matches")
                ? " text-[#FF5555] bg-[#171717] border border-[#404040]"
                : " text-[#D4D4D4] hover:text-[#FAFAFA]"
            }`}
          >
            <CinemaFrequencyIcon
              size={16}
              className={
                pathname === href("/matches")
                  ? " text-[#FF5555]"
                  : " text-[#D4D4D4]"
              }
            />
            <span className="truncate max-w-full">{locale === 'tr' ? "İZDAŞ" : "RADAR"}</span>
          </Link>

          {/* Center Floating Quick Log Action Button */}
          <div className="flex-1 min-w-0 max-w-[56px] flex items-center justify-center">
            <button
              onClick={handleOpenQuickLog}
              className="flex items-center justify-center -mt-6 w-12 h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer rounded-none"
              title={t.nav.quickLog}
              aria-label={t.nav.quickLog}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Keşif — catalog showcase */}
          <Link
            href={href("/kesif")}
            className={`flex-1 min-h-[48px] min-w-0 max-w-[70px] flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-0.5 text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              pathname === href("/kesif")
                ? " text-[#FF5555] bg-[#171717] border border-[#404040]"
                : " text-[#D4D4D4] hover:text-[#FAFAFA]"
            }`}
          >
            <CinemaSearchLensIcon
              size={16}
              className={
                pathname === href("/kesif")
                  ? " text-[#FF5555]"
                  : " text-[#D4D4D4]"
              }
            />
            <span className="truncate max-w-full">{locale === 'tr' ? "KEŞİF" : "DISCOVER"}</span>
          </Link>

          {/* Günlük */}
          <Link
            href={href("/diary")}
            className={`flex-1 min-h-[48px] min-w-0 max-w-[70px] flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-0.5 text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              pathname === href("/diary")
                ? " text-[#FF5555] bg-[#171717] border border-[#404040]"
                : " text-[#D4D4D4] hover:text-[#FAFAFA]"
            }`}
          >
            <FilmStripIcon
              size={16}
              className={
                pathname === href("/diary")
                  ? " text-[#FF5555]"
                  : " text-[#D4D4D4]"
              }
            />
            <span className="truncate max-w-full">{locale === 'tr' ? "GÜNLÜK" : "DIARY"}</span>
          </Link>

          {/* Profil / Giriş */}
          <Link
            href={user ? href("/profile") : href("/")}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                handleOpenAuth();
              }
            }}
            className={`flex-1 min-h-[48px] min-w-0 max-w-[70px] relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-0.5 text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              pathname === href("/profile")
                ? " text-[#FF5555] bg-[#171717] border border-[#404040]"
                : " text-[#D4D4D4] hover:text-[#FAFAFA]"
            }`}
          >
            <CinemaUserIcon
              size={16}
              className={
                pathname === href("/profile")
                  ? "text-[#DC2626]"
                  : " text-[#A3A3A3]"
              }
            />
            <span className="truncate max-w-full">{user ? (locale === 'tr' ? "PROFİL" : "PROFILE") : (locale === 'tr' ? "GİRİŞ" : "LOGIN")}</span>
            {user && unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </Link>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR LAYOUT  (≥ lg / ≥ 1024px)
          Fixed left sidebar — hidden on mobile/tablet via hidden lg:flex
      ════════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[240px] z-50  bg-[#0A0A0A]  text-[#FAFAFA] border-r-2  border-[#262626] transition-colors duration-150 overflow-y-auto">
        {/* Sidebar announcement banners at the very top */}
        <AnnouncementBanners />

        {/* ── 1. Logo Area ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-4 border-b-2  border-[#262626] shrink-0">
          <Link href={href("/")} className="flex items-center gap-3 group">
            <CinemaLogoMark
              size={28}
              className="transition-transform group-hover:rotate-6 group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span
                className="text-xl font-black tracking-tight  text-[#FAFAFA] group-hover:text-[#DC2626] transition-colors leading-none uppercase font-sans truncate"
                style={{ letterSpacing: "-0.04em" }}
              >
                IZLEDIN
                <span className="text-[#DC2626] drop-shadow-[0_0_8px_rgba(220,38,38,0.7)]">
                  .COM
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest  text-[#A3A3A3] -mt-0.5">
                {t.common.subTagline}
              </span>
            </div>
          </Link>
        </div>

        {/* ── 2. Search Button ─────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <button
            onClick={handleOpenSearch}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-mono  text-[#A3A3A3]  bg-[#171717]  hover:bg-[#262626] border-2  border-[#262626]  hover:border-[#DC2626] transition-all cursor-pointer  shadow-[2px_2px_0px_#000000] min-h-[44px]"
            title={t.common.search}
          >
            <CinemaSearchLensIcon
              size={14}
              className="text-[#DC2626] shrink-0"
            />
            <span className="font-black uppercase tracking-wider">
              {t.common.search}...
            </span>
          </button>
        </div>

        {/* ── 3. Nav Links ─────────────────────────────────────────────────── */}
        <nav className="px-4 py-2 flex flex-col gap-1 font-mono shrink-0">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 text-xs font-black tracking-wider uppercase transition-all min-h-[44px] ${
                  isActive
                    ? "bg-[#DC2626] text-white  shadow-[2px_2px_0px_#000000]"
                    : " text-[#A3A3A3]  hover:text-white  hover:bg-[#171717]"
                }`}
              >
                <Icon
                  size={16}
                  className={
                    isActive ? "text-white shrink-0" : "text-[#DC2626] shrink-0"
                  }
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── 4. Gelen Kutusu — communication sits with navigation ──────────── */}
        {user && (
          <nav className="px-4 pb-2 flex flex-col shrink-0">
            <button
              onClick={handleOpenInbox}
              className={`flex items-center justify-between px-3 py-3 text-xs font-black tracking-wider uppercase transition-all min-h-[44px] ${
                unreadCount > 0
                  ? "bg-[#171717] text-[#FAFAFA] border-2 border-[#404040] shadow-[2px_2px_0px_#000000]"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#171717]"
              }`}
              title={t.nav.inbox}
            >
              <span className="flex items-center gap-3">
                <CinemaChatIcon size={16} className="text-[#EF4444] shrink-0" />
                <span>{t.nav.inbox}</span>
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[10px] font-black border border-[#0A0A0A]">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* ── 5. Spacer ────────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── 6. Quick Log Button ──────────────────────────────────────────── */}
        <div className="px-4 pb-3 shrink-0">
          <button
            onClick={handleOpenQuickLog}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black tracking-wider uppercase font-mono border-2 border-[#0A0A0A]  shadow-[2px_2px_0px_#000000]  hover:shadow-[1px_1px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer min-h-[48px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ {t.nav.quickLog.toUpperCase()}</span>
          </button>
        </div>

        {/* ── 7. izledin+ Kulüp & Language Toggle ──────────────────────────── */}
        <div className="px-4 pb-2 flex flex-col gap-2 shrink-0">
          <button
            onClick={handleOpenPremium}
            className="flex items-center justify-center gap-2 w-full p-2.5  bg-[#171717]  hover:bg-[#262626] text-[#DC2626] border-2  border-[#DC2626]/50 hover:border-[#DC2626]  shadow-[2px_2px_0px_#000000] transition-all cursor-pointer min-h-[44px] font-mono text-xs font-black uppercase tracking-wider"
            title={t.nav.club}
          >
            <CinemaPlusPassIcon size={16} className="text-[#DC2626]" />
            <span>{t.nav.club.toUpperCase()}</span>
          </button>

          {/* Desktop Language Switcher */}
          <div className="flex items-center border-2 border-[#262626] bg-[#171717] p-0.5 text-xs font-mono font-black">
            <button
              type="button"
              onClick={() => setLocale("tr")}
              className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
                locale === "tr"
                  ? "bg-[#DC2626] text-white shadow-[1px_1px_0px_#000000]"
                  : "text-[#A3A3A3] hover:text-white"
              }`}
              aria-label="Türkçe"
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
                locale === "en"
                  ? "bg-[#DC2626] text-white shadow-[1px_1px_0px_#000000]"
                  : "text-[#A3A3A3] hover:text-white"
              }`}
              aria-label="English"
            >
              EN
            </button>
          </div>
        </div>

        {/* ── 8. User Avatar / Name + Dropdown  OR  Login Button ───────────── */}
        <div className="px-4 pb-5 shrink-0 border-t-2 border-[#262626] pt-3">
          {user ? (
            <div className="relative" ref={sidebarUserMenuRef}>
              <button
                onClick={() => setSidebarUserMenuOpen(!sidebarUserMenuOpen)}
                className="w-full flex items-center gap-3 p-1.5 sm:p-2  bg-[#171717]  hover:bg-[#262626] border-2  border-[#262626] hover:border-[#DC2626] transition-all cursor-pointer  shadow-[2px_2px_0px_#000000] min-h-[48px]"
              >
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    width={32}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="w-8 h-8 object-cover border border-[#0A0A0A] bg-black"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#DC2626] border border-[#0A0A0A] animate-pulse" />
                  )}
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs font-black  text-[#FAFAFA] uppercase font-mono truncate w-full">
                    {displayName.split(" ")[0]}
                  </span>
                  <span className="text-[10px]  text-[#A3A3A3] font-mono truncate w-full">
                    @{username}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5  text-[#A3A3A3] transition-transform shrink-0 ${sidebarUserMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Sidebar User Dropdown — opens upward */}
              {sidebarUserMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2  bg-[#171717]  text-[#FAFAFA] border-2  border-[#404040] p-3  shadow-[6px_6px_0px_#000000] z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b-2  border-[#404040] mb-2 font-mono">
                    <p className="text-xs font-black uppercase truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px]  text-[#A3A3A3] truncate">
                      @{username}
                    </p>
                  </div>

                  <div className="space-y-1 font-mono text-xs font-bold uppercase">
                    {renderUserMenuItems(() => setSidebarUserMenuOpen(false))}
                  </div>
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="w-full flex items-center gap-3 p-1.5 sm:p-2  bg-[#171717] border-2  border-[#262626]  shadow-[2px_2px_0px_#000000] min-h-[48px]">
              <div className="w-8 h-8  bg-neutral-800 border border-[#0A0A0A] shrink-0 animate-pulse" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="w-16 h-3  bg-neutral-800 animate-pulse" />
                <div className="w-24 h-2.5 bg-neutral-200 bg-neutral-800/60 animate-pulse" />
              </div>
            </div>
          ) : (
            <button
              onClick={handleOpenAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-3  bg-[#FAFAFA]  hover:bg-[#F4F4F5]  text-[#0A0A0A] text-xs font-black uppercase font-mono border-2 border-[#0A0A0A]  shadow-[2px_2px_0px_#000000] cursor-pointer transition-all min-h-[48px]"
            >
              <LogIn className="w-3.5 h-3.5 text-[#DC2626] stroke-[3]" />
              <span>GİRİŞ YAP</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Internal Fallback Modals (For pages without manual modal bindings) ── */}
      {!onOpenPremium && (
        <PremiumModal
          isOpen={internalPremiumOpen}
          onClose={() => setInternalPremiumOpen(false)}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {!onOpenQuickLog && (
        <QuickLogModal
          item={internalQuickLogItem}
          isOpen={internalQuickLogOpen}
          onClose={() => setInternalQuickLogOpen(false)}
          onOpenAuth={handleOpenAuth}
          onChangeMovie={() => {
            setInternalQuickLogOpen(false);
            setSearchTarget("quicklog");
            setInternalSearchOpen(true);
          }}
        />
      )}

      {!onOpenSearch && (
        <SearchModal
          isOpen={internalSearchOpen}
          onClose={() => setInternalSearchOpen(false)}
          onSelectMedia={(item) => {
            setInternalSearchOpen(false);
            if (searchTarget === "quicklog") {
              setInternalQuickLogItem(item);
              setInternalQuickLogOpen(true);
            } else {
              router.push(`/film/${item.id}`);
            }
          }}
        />
      )}

      {!onOpenAuth && (
        <AuthModal
          isOpen={internalAuthOpen}
          onClose={() => setInternalAuthOpen(false)}
        />
      )}

      {!onOpenInbox && (
        <>
          <InboxModal
            isOpen={internalInboxOpen}
            onClose={() => setInternalInboxOpen(false)}
            onOpenChat={(match) => {
              setInternalInboxOpen(false);
              setInternalChatMatch(match);
              setInternalChatOpen(true);
            }}
            onOpenAuth={handleOpenAuth}
          />

          <ChatModal
            match={internalChatMatch}
            isOpen={internalChatOpen}
            onClose={() => {
              setInternalChatOpen(false);
              setInternalChatMatch(null);
            }}
            onOpenAuth={handleOpenAuth}
          />
        </>
      )}

      {/* Realtime Accepted Match Toast Notification (10s auto-dismiss, bottom-left) */}
      <MatchAcceptedToast
        match={acceptedMatch}
        isOpen={isAcceptedToastOpen}
        onClose={() => setIsAcceptedToastOpen(false)}
        onOpenChat={(m) => {
          setIsAcceptedToastOpen(false);
          if (onOpenChat) {
            onOpenChat(m);
          } else {
            setInternalChatMatch(m);
            setInternalChatOpen(true);
          }
        }}
      />
    </>
  );
}
