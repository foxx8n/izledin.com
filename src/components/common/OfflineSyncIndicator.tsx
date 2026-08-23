'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Pure connection-status banner.
 *
 * NOTE: There is deliberately NO offline persistence or reconnection sync —
 * earlier copy claimed "reviews are saved locally" and "your data has been
 * synced" while nothing of the sort existed, which misled users into losing
 * offline work. Keep the copy truthful unless a real outbox is implemented.
 */
export function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <aside
      aria-live="polite"
      role="status"
      className="fixed bottom-4 left-4 z-50 font-mono text-xs animate-in slide-in-from-bottom-2 duration-200"
    >
      {!isOnline ? (
        <div className="flex items-center gap-2.5 bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#DC2626] shadow-[4px_4px_0px_#DC2626] px-3.5 py-2.5">
          <div className="flex h-5 w-5 items-center justify-center bg-[#DC2626] text-white shrink-0">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-black text-[#DC2626] uppercase">BAĞLANTI YOK:</span>{' '}
            <span className="text-neutral-300">
              İnternet bağlantınız kesildi. Kaydetmediğiniz yazılar kaybolabilir.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-[#0A0A0A] text-[#FAFAFA] border-2 border-emerald-500 shadow-[4px_4px_0px_#10B981] px-3.5 py-2.5">
          <div className="flex h-5 w-5 items-center justify-center bg-emerald-600 text-white shrink-0">
            <Wifi className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-black text-emerald-400 uppercase">BAĞLANTI KURULDU:</span>{' '}
            <span className="text-neutral-300">İnternete tekrar bağlandınız.</span>
          </div>
        </div>
      )}
    </aside>
  );
}
