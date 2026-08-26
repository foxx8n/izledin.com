'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Search, Trash2, Film, Clapperboard } from 'lucide-react';
import { MovieMateMatch, MediaItem, WatchTogetherItem } from '@/types';
import {
  getWatchTogetherItems,
  addWatchTogetherItem,
  setWatchTogetherItemStatus,
  removeWatchTogetherItem,
  subscribeToWatchTogetherItems,
} from '@/lib/services/watch-together.service';

interface WatchTogetherPanelProps {
  match: MovieMateMatch;
  currentUserId: string;
  /** ORTAK SEANS is the premium anchor — free members see the teaser only. */
  isPremium: boolean;
  onUpgradeClick: () => void;
}

const STATUS_FLOW: Record<WatchTogetherItem['status'], { next?: WatchTogetherItem['status']; label?: string }> = {
  suggested: { next: 'watching', label: 'SEANSI BAŞLAT' },
  watching: { next: 'watched_together', label: 'BİRLİKTE İZLEDİK' },
  watched_together: {},
};

const STATUS_LABEL: Record<WatchTogetherItem['status'], string> = {
  suggested: 'ÖNERİLDİ',
  watching: 'İZLENİYOR',
  watched_together: 'BERABER İZLENDİ',
};

/**
 * S14 ORTAK SEANS panel — the shared watchlist inside a matched conversation.
 * Backed by the dormant-since-launch watch_together_items table whose RLS only
 * admits matched pairs, so this panel mounts exclusively on matched chats.
 */
export function WatchTogetherPanel({ match, currentUserId, isPremium, onUpgradeClick }: WatchTogetherPanelProps) {
  const [items, setItems] = useState<WatchTogetherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Add-flow state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const matchId = match.id;
  const searchSeqRef = useRef(0);

  const load = async () => {
    const rows = await getWatchTogetherItems(matchId);
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // Realtime: any participant's insert/update/delete repaints everyone.
    const unsubscribe = subscribeToWatchTogetherItems(matchId, () => {
      load();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Live catalog search for the add drawer
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const seq = ++searchSeqRef.current;
    const query = searchQuery;
    const timer = setTimeout(() => {
      setSearching(true);
      import('@/lib/omdb')
        .then(({ searchCatalog }) => searchCatalog(query))
        .then((res) => {
          if (seq === searchSeqRef.current) setSearchResults(res);
        })
        .finally(() => {
          if (seq === searchSeqRef.current) setSearching(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAdd = async (item: MediaItem) => {
    if (adding) return;
    setAdding(true);
    setActionError(null);
    const result = await addWatchTogetherItem(matchId, currentUserId, item);
    setAdding(false);
    if (!result.ok) {
      setActionError(result.error || 'Yapım eklenemedi.');
      return;
    }
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const handleAdvance = async (item: WatchTogetherItem) => {
    const next = STATUS_FLOW[item.status]?.next;
    if (!next) return;
    setActionError(null);
    const result = await setWatchTogetherItemStatus(item.id, next);
    if (!result.ok) setActionError(result.error || null);
  };

  const handleRemove = async (item: WatchTogetherItem) => {
    setActionError(null);
    const result = await removeWatchTogetherItem(item.id);
    if (!result.ok) setActionError(result.error || null);
  };

  // ── Premium anchor: free members see what they are missing ──
  if (!isPremium) {
    return (
      <div className="p-6 sm:p-8 text-center space-y-4">
        <Clapperboard size={40} className="mx-auto text-[#EF4444]" />
        <h3 className="text-sm font-black uppercase text-[#FAFAFA] tracking-wider">
          ORTAK SEANS KULÜP ÜYELERİNDE
        </h3>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto font-sans">
          {match.user.fullName} ile ortak bir &quot;birlikte izleyeceklerimiz&quot;
          listesi tutun: film önerin, seans başlatın, birlikte izlediklerinizi
          mühürleyin.
        </p>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#404040] shadow-[3px_3px_0px_#000000] cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
        >
          KULÜBE KATIL
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-[#404040] shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
          BİRLİKTE İZLEYECEKLERİMİZ — {items.length}
        </span>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="px-2.5 py-1.5 min-h-[32px] flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-black uppercase tracking-wider border-2 border-[#404040] shadow-[2px_2px_0px_#000000] cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>YAPIM EKLE</span>
        </button>
      </div>

      {actionError && (
        <p className="px-4 py-1.5 text-[11px] font-bold text-red-300 bg-red-950/50 border-b border-red-900/50" role="alert">
          {actionError}
        </p>
      )}

      {/* Add drawer */}
      {searchOpen && (
        <div className="p-3 bg-neutral-900 border-b-2 border-[#404040] space-y-2 shrink-0 animate-in fade-in">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Film veya dizi ara..."
              autoFocus
              aria-label="Ortak seans için yapım ara"
              className="w-full h-10 bg-[#171717] text-[#FAFAFA] placeholder-neutral-500 border-2 border-[#404040] px-3 pr-9 text-xs font-bold focus:outline-none focus:border-[#DC2626]"
            />
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#DC2626] absolute right-3 top-3" />
            ) : (
              <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-3" />
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1 border border-neutral-700">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={adding}
                  className="flex items-center gap-2 p-1.5 bg-[#171717] border border-neutral-800 hover:border-[#DC2626] cursor-pointer text-left disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.posterPath}
                    alt=""
                    width={28}
                    height={42}
                    className="w-7 h-[42px] object-cover bg-black shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-black uppercase truncate text-[#FAFAFA]">{item.title}</span>
                    <span className="block text-[10px] text-neutral-500">{item.year || '—'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-[#EF4444] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-2">
            <Film className="w-8 h-8 text-neutral-600" />
            <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">SEANS LİSTESİ BOŞ</p>
            <p className="text-[11px] text-neutral-500 max-w-[240px] font-sans">
              İlk filmi sen ekle; {match.user.fullName} listeye ortak olsun.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const flow = STATUS_FLOW[item.status];
            return (
              <div
                key={item.id}
                className="flex items-stretch gap-2.5 p-2 bg-[#171717] border-2 border-[#404040]"
              >
                {item.posterUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.posterUrl}
                    alt=""
                    width={36}
                    height={54}
                    className="w-9 h-[54px] object-cover bg-black border border-[#404040] shrink-0"
                  />
                ) : (
                  <div className="w-9 h-[54px] bg-neutral-900 border border-[#404040] flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-neutral-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                  <p className="text-xs font-black uppercase text-[#FAFAFA] truncate leading-tight">{item.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                        item.status === 'watched_together'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-600/30'
                          : item.status === 'watching'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-600/30'
                          : 'bg-neutral-800 text-neutral-300 border-[#404040]'
                      }`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                    {flow?.next && (
                      <button
                        type="button"
                        onClick={() => handleAdvance(item)}
                        className="text-[9px] font-black uppercase tracking-wider text-[#EF4444] hover:text-white transition-colors cursor-pointer"
                      >
                        {flow?.label} →
                      </button>
                    )}
                  </div>
                </div>
                {item.addedBy === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    aria-label={`${item.title} kaydını kaldır`}
                    className="self-center p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-[#DC2626] border border-transparent hover:border-[#404040] cursor-pointer transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
