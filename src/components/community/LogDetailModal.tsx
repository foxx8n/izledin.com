"use client";

import React, { useEffect, useState } from "react";
import { X, Star, Share2, Award, Clock } from "lucide-react";
import { WatchLog } from "@/types";
import { getRecentMediaLogs } from "@/lib/services/watch-logs.service";
import { resolvePosterUrl, applyArtfulPosterFallback } from "@/lib/poster-placeholder";

interface LogDetailModalProps {
  log: WatchLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogDetailModal({ log, isOpen, onClose }: LogDetailModalProps) {
  const [otherLogs, setOtherLogs] = useState<WatchLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && log) {
      setIsLoading(true);
      setCopied(false);
      getRecentMediaLogs(log.mediaId, log.id, 10)
        .then((logs) => setOtherLogs(logs))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, log]);

  if (!isOpen || !log) return null;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/log/${log.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAuthorPremium = Boolean(log.user?.isPremium);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto  bg-[#171717]  text-[#FAFAFA] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-4  border-[#404040] pb-3.5 mb-5">
          <div className="flex items-center gap-3">
            <img
              src={resolvePosterUrl(log.posterUrl, log.title, log.year, log.genres?.[0])}
              alt={log.title}
              className="w-10 h-14 object-cover border-2  border-[#404040]"
              onError={(e) => applyArtfulPosterFallback(e, log.title, log.year, log.genres?.[0])}
            />
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl uppercase tracking-tight line-clamp-1">
                {log.title}
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500">
                {log.year} • {log.mediaType.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              title="Paylaş"
              className="p-1.5   bg-neutral-800 hover:bg-neutral-700 border-2  border-[#404040] transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {copied ? "KOPYALANDI" : "PAYLAŞ"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5   bg-neutral-800 hover:bg-neutral-700 border-2  border-[#404040] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Primary Log */}
        <div
          className={`p-4 mb-6 relative ${
            isAuthorPremium
              ? "bg-amber-50 bg-amber-950/20 border-2 border-amber-500/85"
              : " bg-neutral-900 border-2  border-[#404040]"
          }`}
        >
          {isAuthorPremium && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
          )}
          <div className="flex items-center justify-between gap-2 border-b  border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  log.user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    log.user?.fullName || "S",
                  )}&backgroundColor=0A0A0A&textColor=F59E0B&fontWeight=900`
                }
                alt={log.user?.fullName || "Kullanıcı"}
                className="w-8 h-8 object-cover border-2  border-[#404040]"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs uppercase tracking-wider">
                    {log.user?.fullName || "Gizli İzdaş"}
                  </span>
                  {isAuthorPremium && (
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {new Date(log.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>
            {typeof log.rating === "number" && log.rating > 0 && (
              <div className="flex items-center gap-1 px-2 py-1  bg-[#EF4444] text-white border-2  border-[#404040]">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-black font-mono">
                  {log.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          {log.review ? (
            <p className="text-sm font-sans leading-relaxed  text-[#FAFAFA] whitespace-pre-wrap">
              {log.review}
            </p>
          ) : (
            <p className="text-xs font-mono text-neutral-500 italic">
              İnceleme metni girilmemiş. Sadece izlendi olarak işaretlendi.
            </p>
          )}
        </div>

        {/* Other Logs for this Media */}
        <div className="space-y-4">
          <h4 className="font-black font-mono text-xs uppercase border-b-2  border-[#404040] pb-2">
            Topluluktan Diğer Yorumlar
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-neutral-500">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
          ) : otherLogs.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 pb-safe">
              {otherLogs.map((otherLog) => (
                <div
                  key={otherLog.id}
                  className="p-3  bg-neutral-900 border-2  border-[#404040] text-sm font-sans"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        {otherLog.user?.fullName || "Gizli İzdaş"}
                      </span>
                      {otherLog.user?.isPremium && (
                        <Award className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    {typeof otherLog.rating === "number" &&
                      otherLog.rating > 0 && (
                        <div className="flex items-center gap-1  text-[#EF4444]">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-black font-mono">
                            {otherLog.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                  </div>
                  {otherLog.review ? (
                    <p className="text-xs leading-relaxed  text-neutral-200 line-clamp-3">
                      {otherLog.review}
                    </p>
                  ) : (
                    <span className="text-xs text-neutral-500 font-mono">
                      (Sadece puanladı)
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-neutral-500 text-center py-4">
              Bu yapım için henüz başka yorum yok.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
