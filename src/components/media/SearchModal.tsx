'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Star, Plus, Film, ArrowRight } from 'lucide-react';
import { searchCatalog, getTrendingMedia } from '@/lib/omdb';
import { MediaItem } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

const POPULAR_SUGGESTIONS = [
  'Dune: Part Two',
  'Oppenheimer',
  'Interstellar',
  'Spirited Away',
  'Severance',
  'Pulp Fiction',
];

export function SearchModal({ isOpen, onClose, onSelectMedia }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Load initial trending items when opened. Stale-guarded: clearing the
  // query re-runs this, and an older in-flight fetch must not paint over it.
  useEffect(() => {
    if (isOpen && !query.trim()) {
      let stale = false;
      setLoading(true);
      getTrendingMedia('all')
        .then((items) => {
          if (!stale) setResults(items);
        })
        .finally(() => {
          if (!stale) setLoading(false);
        });
      return () => {
        stale = true;
      };
    }
  }, [isOpen, query]);

  // Debounced search. Stale-guarded on top of the timeout cleanup so a slow
  // OLD search can never overwrite a fast NEW one's results.
  useEffect(() => {
    if (!query.trim()) return;

    let stale = false;
    setLoading(true);
    const handler = setTimeout(() => {
      searchCatalog(query)
        .then((items) => {
          if (!stale) setResults(items);
        })
        .finally(() => {
          if (!stale) setLoading(false);
        });
    }, 300);

    return () => {
      stale = true;
      clearTimeout(handler);
    };
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (item: MediaItem) => {
    onSelectMedia(item);
    onClose();
  };

  const handleImageError = (id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl  bg-[#171717]  text-[#FAFAFA] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-4 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Header & Input */}
        <div className="flex items-center gap-3 border-b-4  border-[#404040] pb-3">
          <Search className="w-5 sm:w-6 h-5 sm:h-6  text-[#EF4444] stroke-[3] flex-shrink-0" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="FİLM, DİZİ, ANİME VEYA YÖNETMEN ARA..."
            autoFocus
            className="flex-1 bg-transparent text-xs sm:text-base font-black uppercase  text-[#FAFAFA]  placeholder-neutral-500 focus:outline-none tracking-tight font-mono"
          />

          {loading && (
            <Loader2 className="w-5 h-5  text-[#EF4444] animate-spin flex-shrink-0" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400  hover:text-white cursor-pointer"
              title="Temizle"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5   bg-neutral-800 hover:bg-neutral-700 border-2  border-[#404040] cursor-pointer flex-shrink-0"
            title="Kapat (ESC)"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5 stroke-[3]" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className=" text-neutral-400 font-bold whitespace-nowrap">ÖNERİLER:</span>
          {POPULAR_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="px-2 py-0.5   bg-neutral-800 hover:bg-neutral-700  text-[#FAFAFA] border  border-neutral-700 whitespace-nowrap cursor-pointer transition-colors text-[10px] font-bold"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {results.length === 0 && !loading ? (
            <div className="py-10 px-4 text-center border-2 border-dashed  border-neutral-700 bg-neutral-50 bg-neutral-800/50 space-y-3">
              <Film className="w-10 h-10  text-[#EF4444] mx-auto stroke-[2]" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-black uppercase  text-[#FAFAFA]">
                  "{query}" İÇİN SONUÇ BULUNAMADI
                </p>
                <p className="text-[11px]  text-neutral-400">
                  Farklı bir film başlığı, yönetmen veya popüler önerilerden birini seçin.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                {POPULAR_SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="px-3 py-1  hover:bg-[#B91C1C] bg-[#EF4444] text-white text-[11px] font-black uppercase border  border-[#404040] cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>{s}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            results.map((item) => {
              const isImgFailed = failedImages.has(item.id);
              const rating =
                typeof item.voteAverage === 'number' && item.voteAverage > 0
                  ? item.voteAverage.toFixed(1)
                  : null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group flex items-center justify-between gap-3 p-2.5  bg-neutral-800  hover:bg-neutral-700 border-2  border-[#404040] transition-all duration-150 cursor-pointer  shadow-[2px_2px_0px_#000000] hover:translate-x-1 active:translate-x-0.5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-16 bg-neutral-900 border-2  border-[#404040] flex-shrink-0 overflow-hidden relative">
                      {!isImgFailed && item.posterPath ? (
                        <img
                          src={item.posterPath}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(item.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Film className="w-5 h-5 text-[#DC2626]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-black font-sans uppercase  text-[#FAFAFA] truncate  group-hover:text-[#EF4444] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px]  text-neutral-400 font-bold truncate mt-0.5 font-mono">
                        {item.year || '—'} • {item.genres?.slice(0, 2).join(' / ') || (item.type === 'tv' ? 'Dizi' : 'Sinema')}
                        {item.director ? ` • YÖN: ${item.director}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {rating && (
                    <div className="marker-highlight text-xs font-black font-mono whitespace-nowrap  text-[#FAFAFA]">
                      {rating}/10
                    </div>
                  )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                      className="px-2.5 sm:px-3 py-1.5  hover:bg-[#B91C1C] bg-[#EF4444] text-white text-[11px] font-black uppercase border-2  border-[#404040]  shadow-[2px_2px_0px_#000000] flex items-center gap-1 cursor-pointer whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="hidden sm:inline">Puanla</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Helper */}
        <div className="pt-2 border-t-2  border-[#404040] flex items-center justify-between text-[11px]  text-neutral-400 font-bold font-mono">
          <span>{results.length} YAPIM LİSTELENDİ</span>
          <span className="hidden sm:inline">[ESC] VEYA DIŞINA TIKLAYARAK KAPAT</span>
          <span className="sm:hidden">[ESC]</span>
        </div>

      </div>
    </div>
  );
}
