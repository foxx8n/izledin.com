'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Crown, 
  Star, 
  Film, 
  Users, 
  MessageSquare, 
  Megaphone, 
  Eye, 
  ExternalLink,
  Lock,
  ArrowLeft,
  X,
  Ban,
  UserX,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HeartHandshake,
  Compass
} from 'lucide-react';
import { 
  CinemaLogoMark, 
  CinemaStarIcon, 
  MasterpieceLaurelIcon, 
  CinemaPlusPassIcon, 
  FilmStripIcon, 
  ClapperboardIcon,
  CinemaVerifiedSeal
} from '@/components/icons/CinemaIcons';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SearchModal } from '@/components/media/SearchModal';
import { QuickLogModal } from '@/components/media/QuickLogModal';
import { InboxModal } from '@/components/inbox/InboxModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/context/AuthContext';
import {
  isCurrentUserAdmin,
  getAdminStats,
  getAllWatchLogsAdmin, 
  deleteWatchLogAdmin, 
  getAllProfilesAdmin, 
  toggleUserVIPAdmin, 
  toggleUserVerifiedAdmin,
  banUserAdmin,
  unbanUserAdmin,
  getSiteSetting, 
  setSiteSetting,
  AdminStats,
  BroadcastAnnouncement
} from '@/lib/services/admin.service';
import { searchCatalog, getOMDBDetails } from '@/lib/omdb';
import { WatchLog, Profile, MediaItem } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'masterpiece' | 'announcement'>('logs');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalLogs: 0,
    totalMatches: 0,
    totalVIPs: 0,
    totalReviews: 0,
  });

  // Data states
  const [logs, setLogs] = useState<WatchLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  // Search / Filters
  const [logSearch, setLogSearch] = useState('');
  const [onlyWithReviews, setOnlyWithReviews] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [onlyBannedFilter, setOnlyBannedFilter] = useState(false);

  // Delete Log Modal
  const [deleteTargetLog, setDeleteTargetLog] = useState<WatchLog | null>(null);

  // User Ban Modal
  const [targetBanUser, setTargetBanUser] = useState<Profile | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('Topluluk ve kullanım kurallarının ihlali.');

  // Masterpiece Override State
  const [overrideMovieId, setOverrideMovieId] = useState('');
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [currentOverride, setCurrentOverride] = useState<{ mediaId: string | null; title?: string } | null>(null);
  // Global navbar modals (previously the navbar rendered here with no
  // handlers, so search/log/inbox/login buttons silently did nothing)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const activeChatMatchAdmin = null;
  const [isSearchingMovie, setIsSearchingMovie] = useState(false);

  // Announcement State
  const [announcement, setAnnouncement] = useState<BroadcastAnnouncement>({
    enabled: false,
    message: '',
    badgeText: 'DUYURU',
    type: 'info',
    link: '',
  });

  // Server-truth admin gate. null = check still running (avoids flashing the
  // 403 screen while auth resolves and is_admin() is queried).
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setIsAuthorized(false);
      return;
    }
    let cancelled = false;
    isCurrentUserAdmin().then((ok) => {
      if (!cancelled) setIsAuthorized(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user, isLoading]);

  // Load all initial data
  const loadData = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const [fetchedStats, fetchedLogs, fetchedProfiles, savedOverride, savedAnnouncement] = await Promise.all([
        getAdminStats(),
        getAllWatchLogsAdmin(150),
        getAllProfilesAdmin(200),
        getSiteSetting('featured_masterpiece_override', { mediaId: null }),
        getSiteSetting<BroadcastAnnouncement>('broadcast_announcement', {
          enabled: false,
          message: '',
          badgeText: 'DUYURU',
          type: 'info',
          link: '',
        }),
      ]);

      setStats(fetchedStats);
      setLogs(fetchedLogs);
      setProfiles(fetchedProfiles);
      setCurrentOverride(savedOverride);
      if (savedOverride?.mediaId) {
        setOverrideMovieId(savedOverride.mediaId);
      }
      setAnnouncement(savedAnnouncement);
    } catch (err: any) {
      console.error('Admin data loading error:', err);
      showToast('error', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      loadData();
    }
  }, [isLoading, isAuthorized]);

  // Modal ESC Key Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteTargetLog) setDeleteTargetLog(null);
        if (targetBanUser) setTargetBanUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteTargetLog, targetBanUser]);

  // Helper toast notifier
  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Toggle review expansion
  const toggleReviewExpand = (logId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const handleDeleteLog = async (logId: string) => {
    setActionLoading(`delete-${logId}`);
    try {
      const { success, error } = await deleteWatchLogAdmin(logId);
      if (success) {
        setLogs((prev) => prev.filter((l) => l.id !== logId));
        setStats((prev) => ({
          ...prev,
          totalLogs: Math.max(0, prev.totalLogs - 1),
        }));
        showToast('success', 'İnceleme / kayıt başarıyla silindi.');
        setDeleteTargetLog(null);
      } else {
        showToast('error', `Silme hatası: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Beklenmeyen hata.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVIP = async (targetProfile: Profile) => {
    const nextState = !targetProfile.isPremium;
    setActionLoading(`vip-${targetProfile.id}`);
    try {
      const { success, error } = await toggleUserVIPAdmin(targetProfile.id, nextState);
      if (success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === targetProfile.id ? { ...p, isPremium: nextState } : p))
        );
        setStats((prev) => ({
          ...prev,
          totalVIPs: nextState ? prev.totalVIPs + 1 : Math.max(0, prev.totalVIPs - 1),
        }));
        showToast('success', `@${targetProfile.username} kullanıcısının VIP durumu güncellendi.`);
      } else {
        showToast('error', `VIP hatası: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerified = async (targetProfile: Profile) => {
    const nextState = !targetProfile.isVerified;
    setActionLoading(`verified-${targetProfile.id}`);
    try {
      const { success, error } = await toggleUserVerifiedAdmin(targetProfile.id, nextState);
      if (success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === targetProfile.id ? { ...p, isVerified: nextState } : p))
        );
        showToast('success', `@${targetProfile.username} onay rozeti güncellendi.`);
      } else {
        showToast('error', `Onay rozeti hatası: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async () => {
    if (!targetBanUser) return;
    setActionLoading(`ban-${targetBanUser.id}`);
    try {
      const { success, error } = await banUserAdmin(targetBanUser.id, banReasonInput);
      if (success) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === targetBanUser.id
              ? { ...p, isBanned: true, banReason: banReasonInput, bannedAt: new Date().toISOString() }
              : p
          )
        );
        showToast('success', `@${targetBanUser.username} başarıyla banlandı.`);
        setTargetBanUser(null);
      } else {
        showToast('error', `Ban hatası: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (targetProfile: Profile) => {
    setActionLoading(`unban-${targetProfile.id}`);
    try {
      const { success, error } = await unbanUserAdmin(targetProfile.id);
      if (success) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === targetProfile.id
              ? { ...p, isBanned: false, banReason: undefined, bannedAt: undefined }
              : p
          )
        );
        showToast('success', `@${targetProfile.username} banı kaldırıldı.`);
      } else {
        showToast('error', `Unban hatası: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieSearchQuery.trim()) return;
    setIsSearchingMovie(true);
    try {
      const results = await searchCatalog(movieSearchQuery.trim());
      setSearchResults(results.slice(0, 8));
    } catch (err) {
      console.error(err);
      showToast('error', 'Film arama başarısız.');
    } finally {
      setIsSearchingMovie(false);
    }
  };

  const handleSetMasterpiece = async (mediaItem: MediaItem) => {
    setActionLoading(`masterpiece-${mediaItem.id}`);
    try {
      const payload = {
        mediaId: mediaItem.id,
        title: mediaItem.title,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email,
      };
      const { success, error } = await setSiteSetting('featured_masterpiece_override', payload);
      if (success) {
        setCurrentOverride(payload);
        setOverrideMovieId(mediaItem.id);
        showToast('success', `Haftanın başyapıtı sabitlendi: ${mediaItem.title}`);
      } else {
        showToast('error', `Ayar kaydedilemedi: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearMasterpiece = async () => {
    setActionLoading('clear-masterpiece');
    try {
      const payload = { mediaId: null, updatedAt: new Date().toISOString() };
      const { success, error } = await setSiteSetting('featured_masterpiece_override', payload);
      if (success) {
        setCurrentOverride(null);
        setOverrideMovieId('');
        showToast('success', 'Haftanın başyapıtı otomatiğe (orijinal haline) döndürüldü.');
      } else {
        showToast('error', `Sıfırlama hatası: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('announcement');
    try {
      const { success, error } = await setSiteSetting('broadcast_announcement', announcement);
      if (success) {
        showToast('success', 'Duyuru ayarları başarıyla kaydedildi.');
      } else {
        showToast('error', `Duyuru kaydedilemedi: ${error}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Hata.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.title.toLowerCase().includes(logSearch.toLowerCase()) ||
        (log.user?.username && log.user.username.toLowerCase().includes(logSearch.toLowerCase())) ||
        (log.review && log.review.toLowerCase().includes(logSearch.toLowerCase()));
      const matchReviewOnly = onlyWithReviews ? Boolean(log.review && log.review.trim().length > 0) : true;
      return matchSearch && matchReviewOnly;
    });
  }, [logs, logSearch, onlyWithReviews]);

  // Filtered Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        (p.fullName && p.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
        (p.banReason && p.banReason.toLowerCase().includes(userSearch.toLowerCase()));
      const matchBanned = onlyBannedFilter ? Boolean(p.isBanned) : true;
      return matchSearch && matchBanned;
    });
  }, [profiles, userSearch, onlyBannedFilter]);

  // Access check still in flight — hold a quiet shell instead of flashing 403
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen with-sidebar flex flex-col items-center justify-center gap-4 bg-[#0A0A0A] text-[#FAFAFA] font-mono">
        <ShieldAlert className="w-8 h-8 text-neutral-600 animate-pulse" />
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Yetki kontrolü yapılıyor...
        </p>
      </div>
    );
  }

  // 403 Forbidden Barrier
  if (!isAuthorized) {
    return (
      <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] font-mono">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenInbox={() => setIsInboxOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0A0A0A] text-white border-4 border-[#DC2626] p-8 shadow-[8px_8px_0px_#DC2626] space-y-6 text-center">
            <div className="w-16 h-16 bg-[#DC2626] text-white flex items-center justify-center mx-auto shadow-[4px_4px_0px_#000000]">
              <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest bg-[#DC2626]/20 text-[#EF4444] px-2.5 py-0.5 border border-[#DC2626]">
                403 // YETKİSİZ ERİŞİM
              </span>
              <h1 className="text-2xl font-black uppercase text-[#FAFAFA] tracking-tight font-sans">
                35MM İZİNSİZ GİRİŞ KABİNİ
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Bu kontrol paneline yalnızca platform süper yöneticileri ve yetkili sinefil moderatörleri erişebilir. Yetkilendirme için yönetim heyetiyle iletişime geçin.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#FAFAFA] hover:bg-[#DC2626] text-[#0A0A0A] hover:text-white text-xs font-black uppercase border-2 border-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3]" />
                <span>ANA SAYFAYA DÖN</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150 font-mono">
      
      {/* Top Navigation */}
      <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenInbox={() => setIsInboxOpen(true)}
        />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Toast Status Notification */}
        {statusMessage && (
          <div 
            role="status"
            aria-live="polite"
            className={`p-4 border-2 flex items-center justify-between  shadow-[4px_4px_0px_#000000] animate-in fade-in slide-in-from-top-2 duration-150 ${
              statusMessage.type === 'success'
                ? 'bg-[#0A0A0A] text-[#22C55E] border-[#22C55E]'
                : 'bg-[#171717] text-[#EF4444] border-[#EF4444]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              ) : (
                <AlertTriangle className="w-4 h-4 stroke-[3]" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:opacity-75 cursor-pointer"
              aria-label="Bildirimi Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Header Marquee: Master Admin Control Chamber */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-[#DC2626] text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>KULÜP MODERASYON MASASI</span>
              </span>
              <span className="text-[11px] text-neutral-400 uppercase">
                YETKİLİ: {profile?.username ? `@${profile.username}` : user?.email}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase text-[#FAFAFA] font-sans tracking-tight leading-none">
              IZLEDIN.COM DENETİM & KÜRASYO KONSOLU
            </h1>
            <p className="text-xs text-neutral-300 max-w-2xl font-sans leading-relaxed">
              Veritabanı moderasyonu, üye dürüstlük denetimi, haftalık başyapıt seçimi ve genel topluluk duyuruları.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 min-h-[44px]   bg-neutral-800 hover:bg-neutral-700  text-[#FAFAFA] text-xs font-black uppercase border-2 border-white cursor-pointer flex items-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>YENİLE</span>
            </button>

            <Link
              href="/"
              className="px-4 py-2.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-white shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>SALONA DÖN</span>
            </Link>
          </div>
        </header>

        {/* 2. Platform Real-Time KPI Cards */}
        <section aria-labelledby="kpi-heading" className="space-y-2">
          <h2 id="kpi-heading" className="sr-only">Platform İstatistikleri</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className=" bg-[#171717] border-2  border-[#404040] p-4  shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between  text-neutral-400">
                <span className="text-[11px] font-black uppercase">TOPLAM SİNEFİL</span>
                <Users className="w-4 h-4 text-[#DC2626]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black  text-[#FAFAFA] font-sans mt-2">
                {stats.totalUsers}
              </p>
              <span className="text-[11px] text-neutral-500 font-bold">Kayıtlı Profil</span>
            </div>

            <div className=" bg-[#171717] border-2  border-[#404040] p-4  shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between  text-neutral-400">
                <span className="text-[11px] font-black uppercase">35MM GÜNLÜK NOTLARI</span>
                <Film className="w-4 h-4 text-[#DC2626]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black  text-[#FAFAFA] font-sans mt-2">
                {stats.totalLogs}
              </p>
              <span className="text-[11px] text-neutral-500 font-bold">İzleme & Daktilo Kaydı</span>
            </div>

            <div className=" bg-[#171717] border-2  border-[#404040] p-4  shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between  text-neutral-400">
                <span className="text-[11px] font-black uppercase">KULÜP HAMİSİ (VIP)</span>
                <Crown className="w-4 h-4  text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black  text-[#FAFAFA] font-sans mt-2">
                {stats.totalVIPs}
              </p>
              <span className="text-[11px]  text-amber-400 font-bold">Aktif İzledin+</span>
            </div>

            <div className=" bg-[#171717] border-2  border-[#404040] p-4  shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between  text-neutral-400">
                <span className="text-[11px] font-black uppercase">ELEŞTİRİ & YORUM</span>
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black  text-[#FAFAFA] font-sans mt-2">
                {stats.totalReviews}
              </p>
              <span className="text-[11px]  text-emerald-400 font-bold">Metinli İnceleme</span>
            </div>
          </div>
        </section>

        {/* 3. Operational Tab Switcher */}
        <div 
          role="tablist" 
          aria-label="Moderasyon Modülleri"
          className="flex items-center gap-2 border-b-2  border-[#404040] pb-2 overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'logs'
                ? ' bg-[#FFFFFF]  text-[#0A0A0A]  border-white shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717]  text-neutral-400  border-[#333333] hover:border-black'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>1. GÜNLÜK & YORUM DENETİMİ ({logs.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? ' bg-[#FFFFFF]  text-[#0A0A0A]  border-white shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717]  text-neutral-400  border-[#333333] hover:border-black'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. ÜYE DÜRÜSTLÜK & BAN YÖNETİMİ ({profiles.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'masterpiece'}
            onClick={() => setActiveTab('masterpiece')}
            className={`px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'masterpiece'
                ? ' bg-[#FFFFFF]  text-[#0A0A0A]  border-white shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717]  text-neutral-400  border-[#333333] hover:border-black'
            }`}
          >
            <MasterpieceLaurelIcon size={16} />
            <span>3. HAFTANIN BAŞYAPITI KÜRASİYONU</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'announcement'}
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2.5 min-h-[44px] text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'announcement'
                ? ' bg-[#FFFFFF]  text-[#0A0A0A]  border-white shadow-[3px_3px_0px_#DC2626]'
                : ' bg-[#171717]  text-neutral-400  border-[#333333] hover:border-black'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>4. PLATFORM SİNEFİL DUYURUSU</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: GÜNLÜK MODERASYONU (Post Silme & İnceleme Triage)                  */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className=" bg-[#171717] p-4 border-2  border-[#404040]  shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  aria-label="Film başlığı, yazar veya yorum içeriği ara"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Film başlığı, yazar veya yorum ara..."
                  className="w-full h-11  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold pl-9 pr-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyWithReviews(!onlyWithReviews)}
                  className={`px-3.5 py-2.5 min-h-[44px] text-xs font-black uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlyWithReviews
                      ? '  bg-white text-black border-black'
                      : ' bg-[#0A0A0A]  text-neutral-400  border-[#404040]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SADECE METİNLİ İNCELEMELER</span>
                </button>
                <span className="text-xs  text-neutral-400 font-bold">
                  {filteredLogs.length} Kayıt
                </span>
              </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length === 0 ? (
              <div className=" bg-[#171717] border-2 border-dashed  border-[#404040] p-12 text-center text-neutral-500">
                Filtreye uygun izleme kaydı bulunamadı.
              </div>
            ) : (
              <ul className="space-y-3 p-0 m-0 list-none">
                {filteredLogs.map((log) => {
                  const isExpanded = Boolean(expandedReviews[log.id]);
                  const hasLongReview = Boolean(log.review && log.review.length > 180);

                  return (
                    <li
                      key={log.id}
                      className=" bg-[#171717] border-2  border-[#404040] p-4  shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <img
                          src={log.posterUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(log.title)}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`}
                          alt={log.title}
                          className="w-12 h-16 object-cover border  border-[#404040] shrink-0"
                        />

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm  text-[#FAFAFA] truncate">
                              {log.title} {log.year ? `(${log.year})` : ''}
                            </span>
                            
                            <span className="px-1.5 py-0.5 bg-[#0A0A0A] text-white text-[11px] font-black uppercase">
                              {log.mediaType}
                            </span>

                            {log.rating && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black  text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500">
                                <CinemaStarIcon size={10} className="text-amber-500" />
                                <span>{log.rating.toFixed(1)}/10</span>
                              </span>
                            )}

                            {log.isFavorite && (
                              <span className="text-[11px] font-black text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5 border border-[#DC2626]">
                                FAVORİ
                              </span>
                            )}
                          </div>

                          {/* Author info */}
                          <div className="flex items-center gap-2 text-xs  text-neutral-400 flex-wrap">
                            <span>Yazar:</span>
                            <span className="font-bold  text-[#FAFAFA]">
                              @{log.user?.username || 'isimsiz'}
                            </span>
                            <span>•</span>
                            <span>{new Date(log.createdAt).toLocaleDateString('tr-TR')}</span>
                            <span>•</span>
                            <span>❤️ {log.likesCount || 0} Beğeni</span>
                          </div>

                          {/* Review snippet & Drawer */}
                          {log.review && (
                            <div className=" bg-[#0A0A0A] p-3 border  border-[#333333] mt-2 space-y-2">
                              <p className={`text-xs  text-neutral-300 italic font-sans leading-relaxed ${
                                !isExpanded && hasLongReview ? 'line-clamp-3' : ''
                              }`}>
                                &ldquo;{log.review}&rdquo;
                              </p>
                              {hasLongReview && (
                                <button
                                  type="button"
                                  onClick={() => toggleReviewExpand(log.id)}
                                  className="text-[11px] font-black uppercase  text-[#EF4444] flex items-center gap-1 cursor-pointer hover:underline"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>KISALT</span>
                                      <ChevronUp className="w-3 h-3" />
                                    </>
                                  ) : (
                                    <>
                                      <span>TÜM METNİ GÖSTER</span>
                                      <ChevronDown className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-start pt-1">
                        <button
                          type="button"
                          onClick={() => setDeleteTargetLog(log)}
                          className="px-3.5 py-2.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase flex items-center gap-1.5 border border-black shadow-[2px_2px_0px_#000000] cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
                          title="Bu kaydı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>SİL</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KULLANICI & ÜYELİK YÖNETİMİ (VIP / Dürüstlük / Rozet)              */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Search & Filters */}
            <div className=" bg-[#171717] p-4 border-2  border-[#404040]  shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  aria-label="Kullanıcı adı veya ban gerekçesi ara"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Kullanıcı adı, isim veya ban gerekçesi ara..."
                  className="w-full h-11  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold pl-9 pr-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyBannedFilter(!onlyBannedFilter)}
                  className={`px-3.5 py-2.5 min-h-[44px] text-xs font-black uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlyBannedFilter
                      ? 'bg-[#DC2626] text-white border-[#DC2626]'
                      : ' bg-[#0A0A0A]  text-neutral-400  border-[#404040]'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>SADECE BANLI ÜYELER ({profiles.filter((p) => p.isBanned).length})</span>
                </button>
                <span className="text-xs  text-neutral-400 font-bold">
                  {filteredProfiles.length} Üye Listelendi
                </span>
              </div>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((p) => {
                const integrityScore = p.intentIntegrityScore ?? 98;
                const strikesCount = p.intentStrikesCount ?? 0;

                return (
                  <div
                    key={p.id}
                    className={` bg-[#171717] border-2 p-5  shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-4 ${
                      p.isBanned
                        ? 'border-[#DC2626] bg-red-50/20 bg-[#DC2626]/10'
                        : ' border-[#404040]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.fullName || p.username)}&backgroundColor=0a0a0a&textColor=ef4444`}
                        alt={p.username}
                        className={`w-14 h-14 rounded-none border-2 object-cover shrink-0 ${
                          p.isBanned ? 'border-[#DC2626] opacity-60 grayscale' : ' border-white'
                        }`}
                      />

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm  text-[#FAFAFA]">
                            {p.fullName || p.username}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">
                            @{p.username}
                          </span>
                          {p.isPremium && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[11px] font-black uppercase">
                              VIP
                            </span>
                          )}
                          {p.isVerified && (
                            <span className="px-1.5 py-0.5 bg-[#DC2626] text-white text-[11px] font-black uppercase">
                              ONAYLI
                            </span>
                          )}
                          {p.isBanned && (
                            <span className="px-1.5 py-0.5 bg-[#DC2626] text-white text-[11px] font-black uppercase flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              <span>BANLANDI</span>
                            </span>
                          )}
                        </div>

                        {/* Community Integrity & Safety Signals */}
                        <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
                          <span className={`px-2 py-0.5 border font-bold flex items-center gap-1 ${
                            integrityScore >= 80
                              ? 'bg-emerald-500/10  text-emerald-400 border-emerald-500'
                              : integrityScore >= 50
                              ? 'bg-amber-500/10  text-amber-400 border-amber-500'
                              : 'bg-red-500/10  text-red-400 border-red-500'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            <span>GÜVEN SKORU: %{integrityScore}</span>
                          </span>

                          <span className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                            strikesCount > 0
                              ? 'bg-red-500/10 text-red-600 border-red-500'
                              : ' bg-neutral-800 text-neutral-500  border-neutral-700'
                          }`}>
                            İHLAL: {strikesCount}/3
                          </span>

                          <span className="text-neutral-500 text-[10px]">
                            {p.matchIntent === 'dating' ? '💑 Romantik' : '🎬 Sinefil İzdaş'}
                          </span>
                        </div>

                        <p className="text-xs  text-neutral-300 truncate font-sans">
                          {p.bio || 'Biyografi belirtilmemiş.'}
                        </p>

                        {p.isBanned && (
                          <div className="p-2.5 bg-[#DC2626]/10 border border-[#DC2626] text-xs  text-[#EF4444] space-y-0.5 font-mono">
                            <div className="font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>YASAK GEREKÇESİ:</span>
                            </div>
                            <p className="italic">&ldquo;{p.banReason || 'Kuralların ihlali.'}&rdquo;</p>
                            {p.bannedAt && (
                              <div className="text-[10px] text-neutral-500">
                                Tarih: {new Date(p.bannedAt).toLocaleString('tr-TR')}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono pt-1">
                          <span>🎬 {p.totalWatchedCount || 0} İzleme</span>
                          <span>•</span>
                          <span>Katılım: {p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 pt-3 border-t  border-neutral-800 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleVIP(p)}
                        disabled={actionLoading === `vip-${p.id}`}
                        className={`flex-1 min-w-[100px] min-h-[44px] px-3 py-2 text-xs font-black uppercase border-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          p.isPremium
                            ? 'bg-amber-500 text-black border-black'
                            : ' bg-[#0A0A0A]  text-neutral-300  border-[#404040] hover:border-amber-500'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>{p.isPremium ? 'VIP AL' : 'VIP YAP'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleVerified(p)}
                        disabled={actionLoading === `verified-${p.id}`}
                        className={`flex-1 min-w-[100px] min-h-[44px] px-3 py-2 text-xs font-black uppercase border-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          p.isVerified
                            ? '  bg-white text-black border-black'
                            : ' bg-[#0A0A0A]  text-neutral-300  border-[#404040] hover:border-black'
                        }`}
                      >
                        <CinemaVerifiedSeal size={14} className={p.isVerified ? 'text-amber-500' : 'text-neutral-500'} />
                        <span>{p.isVerified ? 'ONAYI AL' : 'ONAYLA'}</span>
                      </button>

                      {p.isBanned ? (
                        <button
                          type="button"
                          onClick={() => handleUnbanUser(p)}
                          disabled={actionLoading === `unban-${p.id}`}
                          className="flex-1 min-w-[100px] min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>BANI AÇ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetBanUser(p);
                            setBanReasonInput('Topluluk ve saygı kurallarının ihlali.');
                          }}
                          className="flex-1 min-w-[100px] min-h-[44px] px-3 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>BANLA</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: HAFTANIN BAŞYAPITI KÜRASİYONU (Vitrin Sabitleme)                   */}
        {/* ========================================================================= */}
        {activeTab === 'masterpiece' && (
          <div className=" bg-[#171717] border-2  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-6">
            
            <div className="border-b-2  border-[#404040] pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <MasterpieceLaurelIcon size={20} className="text-amber-500" />
                <h2 className="text-xl font-black uppercase  text-[#FAFAFA] font-sans">
                  HAFTANIN BAŞYAPITI VİTRİN KÜRASİYONU
                </h2>
              </div>
              <p className="text-xs  text-neutral-400 font-sans">
                Ana sayfadaki &ldquo;Haftanın Başyapıtı&rdquo; başlığını manuel olarak sabitleyin veya otomatik algoritma seçimine bırakın.
              </p>
            </div>

            {/* Current State Banner */}
            <div className="p-4  bg-[#0A0A0A] border-2  border-[#404040] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase text-neutral-500">
                  MEVCUT DURUM:
                </span>
                {currentOverride?.mediaId ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-black uppercase">
                      MANUEL SABİTLENDİ
                    </span>
                    <span className="font-bold text-sm  text-[#FAFAFA]">
                      {currentOverride.title || currentOverride.mediaId}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-black uppercase">
                      OTOMATİK SEÇİM
                    </span>
                    <span className="text-xs text-neutral-500">
                      (Sistem her hafta zevk kataloğundan otomatik başyapıt seçer)
                    </span>
                  </div>
                )}
              </div>

              {currentOverride?.mediaId && (
                <button
                  type="button"
                  onClick={handleClearMasterpiece}
                  disabled={actionLoading === 'clear-masterpiece'}
                  className="px-4 py-2.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  OTOMATİĞE BIRAK (SABİTİ KALDIR)
                </button>
              )}
            </div>

            {/* Search & Pin */}
            <form onSubmit={handleSearchMovie} className="space-y-4 pt-2">
              <label htmlFor="masterpiece-search" className="text-xs font-black uppercase  text-[#FAFAFA] block">
                KÜTÜPHANEDEN FİLM ARA VE VİTRİNE SABİTLE:
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
                  <input
                    id="masterpiece-search"
                    type="text"
                    value={movieSearchQuery}
                    onChange={(e) => setMovieSearchQuery(e.target.value)}
                    placeholder="Film adı yazın (Örn: Persona, Stalker, Kasaba)..."
                    className="w-full h-11  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold pl-9 pr-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingMovie}
                  className="px-6 py-2.5 min-h-[44px]   bg-white hover:bg-neutral-200  text-black text-xs font-black uppercase border-2 border-black cursor-pointer flex items-center gap-2"
                >
                  <Search className={`w-4 h-4 ${isSearchingMovie ? 'animate-spin' : ''}`} />
                  <span>ARA</span>
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black uppercase text-neutral-500">
                  ARAMA SONUÇLARI:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {searchResults.map((m) => (
                    <div
                      key={m.id}
                      className=" bg-[#0A0A0A] border-2  border-[#404040] p-3 space-y-2 flex flex-col justify-between"
                    >
                      <img
                        src={m.posterPath || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.title)}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`}
                        alt={m.title}
                        className="w-full h-40 object-cover border  border-[#404040]"
                      />

                      <div className="space-y-1">
                        <h3 className="font-black text-xs  text-[#FAFAFA] truncate">
                          {m.title}
                        </h3>
                        <p className="text-[11px] text-neutral-500">
                          {m.year} • {m.director || 'Yönetmen'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetMasterpiece(m)}
                        disabled={actionLoading === `masterpiece-${m.id}`}
                        className="w-full py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MasterpieceLaurelIcon size={14} />
                        <span>SABİTLE</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PLATFORM SİNEFİL DUYURUSU (Broadcast Announcement)                 */}
        {/* ========================================================================= */}
        {activeTab === 'announcement' && (
          <div className=" bg-[#171717] border-2  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-6">
            
            <div className="border-b-2  border-[#404040] pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#DC2626]" />
                <h2 className="text-xl font-black uppercase  text-[#FAFAFA] font-sans">
                  GENEL SİTE DUYURUSU YÖNETİMİ
                </h2>
              </div>
              <p className="text-xs  text-neutral-400 font-sans">
                Tüm platform ziyaretçilerine ve üyelerine en üst bilgi bandında duyuru yayınlayın.
              </p>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 font-mono">
              
              {/* Enabled Switch */}
              <div className="flex items-center gap-3 p-4  bg-[#0A0A0A] border-2  border-[#404040]">
                <input
                  id="announcement-enabled"
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, enabled: e.target.checked }))}
                  className="w-5 h-5 accent-[#DC2626] cursor-pointer"
                />
                <label htmlFor="announcement-enabled" className="text-xs font-black uppercase  text-[#FAFAFA] cursor-pointer">
                  DUYURU BANDINI AKTİF ET (SİTE GENELİNDE GÖSTER)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Badge Text */}
                <div className="space-y-1">
                  <label htmlFor="announcement-badge" className="text-xs font-black uppercase  text-[#FAFAFA]">
                    ROZET METNİ:
                  </label>
                  <input
                    id="announcement-badge"
                    type="text"
                    value={announcement.badgeText}
                    onChange={(e) => setAnnouncement((p) => ({ ...p, badgeText: e.target.value }))}
                    placeholder="DUYURU, FESTİVAL, YENİLİK..."
                    className="w-full h-11  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold px-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label htmlFor="announcement-type" className="text-xs font-black uppercase  text-[#FAFAFA]">
                    DUYURU TİPİ:
                  </label>
                  <div className="relative">
                    <select
                      id="announcement-type"
                      value={announcement.type}
                      onChange={(e) =>
                        setAnnouncement((p) => ({ ...p, type: e.target.value as 'info' | 'alert' | 'event' | 'maintenance' }))
                      }
                      className="w-full h-11  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold px-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="info">BİLGİ (Kırmızı / Siyah)</option>
                      <option value="alert">UYARI / ACİL (Sarı / Siyah)</option>
                      <option value="event">FESTİVAL / ETKİNLİK (Yeşil / Siyah)</option>
                      <option value="maintenance">BAKIM (Koyu / Gri)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 pointer-events-none text-neutral-500" />
                  </div>
                </div>

                {/* Link */}
                <div className="space-y-1">
                  <label htmlFor="announcement-link" className="text-xs font-black uppercase  text-[#FAFAFA]">
                    HEDEF URL (OPSİYONEL):
                  </label>
                  <input
                    id="announcement-link"
                    type="text"
                    value={announcement.link || ''}
                    onChange={(e) => setAnnouncement((p) => ({ ...p, link: e.target.value }))}
                    placeholder="/topluluk, /upcoming, /premium..."
                    className="w-full h-11  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold px-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label htmlFor="announcement-message" className="text-xs font-black uppercase  text-[#FAFAFA]">
                  DUYURU MESAJI:
                </label>
                <textarea
                  id="announcement-message"
                  rows={3}
                  value={announcement.message}
                  onChange={(e) => setAnnouncement((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Duyuru metnini yazın..."
                  className="w-full  bg-[#0A0A0A]  text-[#FAFAFA] text-xs font-bold p-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none font-sans"
                />
              </div>

              {/* Live Preview */}
              {announcement.enabled && announcement.message && (
                <div className="p-4  bg-[#0A0A0A] border-2 border-dashed  border-[#404040] space-y-2">
                  <span className="text-[11px] font-black uppercase text-neutral-500">
                    CANLI ÖNİZLEME:
                  </span>
                  <div className="p-3 bg-[#DC2626] text-white text-xs font-bold flex items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-black uppercase">
                        {announcement.badgeText}
                      </span>
                      <span>{announcement.message}</span>
                    </div>
                    {announcement.link && (
                      <span className="text-[10px] underline font-black uppercase">
                        İNCELE &rarr;
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionLoading === 'announcement'}
                  className="px-8 py-3.5 min-h-[48px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] cursor-pointer flex items-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>DUYURU AYARLARINI KAYDET</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      {deleteTargetLog && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-mono"
        >
          <div className="max-w-md w-full  bg-[#0A0A0A]  text-[#FAFAFA] border-4 border-[#DC2626] p-6 shadow-[8px_8px_0px_#DC2626] space-y-5">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <h3 id="delete-dialog-title" className="text-base font-black uppercase font-sans">
                BU İNCELEME/POST SİLİNSİN Mİ?
              </h3>
            </div>

            <p className="text-xs  text-neutral-300 leading-relaxed font-sans">
              Bu işlem <span className="font-bold  text-[#FAFAFA]">&ldquo;{deleteTargetLog.title}&rdquo;</span> filmine ait daktilo inceleme kaydını veritabanından kalıcı olarak silecektir. Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetLog(null)}
                className="px-4 py-2.5 min-h-[44px]  bg-[#171717] text-xs font-black uppercase border-2 border-neutral-400 cursor-pointer"
              >
                İPTAL
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLog(deleteTargetLog.id)}
                disabled={actionLoading === `delete-${deleteTargetLog.id}`}
                className="px-4 py-2.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                EVET, KALICI OLARAK SİL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Confirmation Modal */}
      {targetBanUser && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="ban-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-mono"
        >
          <div className="max-w-md w-full  bg-[#0A0A0A]  text-[#FAFAFA] border-4 border-[#DC2626] p-6 shadow-[8px_8px_0px_#DC2626] space-y-5">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <Ban className="w-6 h-6 stroke-[2.5]" />
              <h3 id="ban-dialog-title" className="text-base font-black uppercase font-sans">
                KULLANICIYI BANLA / ASKIYA AL
              </h3>
            </div>

            <div className="space-y-2 text-xs  text-neutral-300 leading-relaxed font-sans">
              <p>
                <span className="font-bold  text-[#FAFAFA]">@{targetBanUser.username}</span> ({targetBanUser.fullName}) adlı kullanıcının platform erişimi askıya alınacak, yeni inceleme veya mesaj göndermesi engellenecektir.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ban-reason" className="text-[11px] font-black uppercase  text-[#FAFAFA]">
                BAN GEREKÇESİ / NOT:
              </label>
              <textarea
                id="ban-reason"
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="Ban gerekçesini girin..."
                className="w-full  bg-[#171717]  text-[#FAFAFA] text-xs font-bold p-3 border-2  border-[#404040] focus:border-[#DC2626] focus:outline-none font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTargetBanUser(null)}
                className="px-4 py-2.5 min-h-[44px]  bg-[#171717] text-xs font-black uppercase border-2 border-neutral-400 cursor-pointer"
              >
                İPTAL
              </button>
              <button
                type="button"
                onClick={handleBanUser}
                disabled={actionLoading === `ban-${targetBanUser.id}`}
                className="px-4 py-2.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                KULLANICIYI BANLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global navbar modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item: MediaItem) => {
          setSelectedMedia(item);
          setIsSearchOpen(false);
          setIsQuickLogOpen(true);
        }}
      />
      <QuickLogModal
        item={selectedMedia}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onOpenChat={() => {
          setIsInboxOpen(false);
          router.push('/matches');
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
