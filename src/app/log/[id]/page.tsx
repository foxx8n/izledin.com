import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Award, ChevronLeft, ArrowLeft } from 'lucide-react';
import { getWatchLogById, getRecentMediaLogs } from '@/lib/services/watch-logs.service';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { resolvePosterUrl } from '@/lib/poster-placeholder';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const log = await getWatchLogById(id);
  
  if (!log) {
    return {
      title: 'Daktilo Notu Bulunamadı — izledin.com',
    };
  }

  const reviewText = log.review || 'Sadece izlendi olarak işaretlendi.';
  const truncatedReview = reviewText.length > 150 ? reviewText.slice(0, 147) + '...' : reviewText;
  const ratingText = log.rating ? ` - ${log.rating.toFixed(1)}/10` : '';

  return {
    title: `${log.user?.fullName || 'İzdaş'} - ${log.title} (${log.year})${ratingText} — izledin.com`,
    description: truncatedReview,
    alternates: {
      canonical: `https://www.izledin.com/log/${id}`,
    },
    openGraph: {
      title: `${log.user?.fullName || 'İzdaş'} - ${log.title} (${log.year})${ratingText}`,
      description: truncatedReview,
      images: [
        {
          url: log.posterUrl,
          width: 800,
          height: 1200,
          alt: log.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${log.user?.fullName || 'İzdaş'} - ${log.title} (${log.year})${ratingText}`,
      description: truncatedReview,
      images: [log.posterUrl],
    },
  };
}

export default async function LogPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const log = await getWatchLogById(id);
  
  if (!log) {
    notFound();
  }

  const otherLogs = await getRecentMediaLogs(log.mediaId, log.id, 10);
  const isAuthorPremium = Boolean(log.user?.isPremium);

  return (
    <div className="min-h-screen flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 mt-16 sm:mt-20">
        <Link 
          href="/diary" 
          className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase text-neutral-500  hover:text-[#EF4444] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> Topluluk Günlüğüne Dön
        </Link>

        <div className=" bg-[#171717] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-5 sm:p-7 space-y-6">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b-4  border-[#404040] pb-3.5 mb-5">
            <Link href={`/film/${log.mediaId}`} className="flex items-center gap-3 group">
              <img
                src={resolvePosterUrl(log.posterUrl, log.title, log.year, log.genres?.[0])}
                alt={log.title}
                className="w-12 h-16 object-cover border-2  border-[#404040] group-hover:border-[#DC2626] transition-colors"
              />
              <div className="flex flex-col">
                <span className="font-black text-xl sm:text-2xl uppercase tracking-tight line-clamp-1 group-hover:text-[#DC2626] transition-colors">
                  {log.title}
                </span>
                <span className="font-mono text-sm font-bold text-neutral-500">
                  {log.year} • {log.mediaType.toUpperCase()}
                </span>
              </div>
            </Link>
          </div>

          {/* Primary Log */}
          <div
            className={`p-5 mb-8 relative ${
              isAuthorPremium
                ? "bg-amber-50 bg-amber-950/20 border-2 border-amber-500/85  shadow-[4px_4px_0px_#D97706]"
                : " bg-neutral-900 border-2  border-[#404040]  shadow-[4px_4px_0px_#000000]"
            }`}
          >
            {isAuthorPremium && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
            )}
            <div className="flex items-center justify-between gap-2 border-b  border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    log.user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      log.user?.fullName || "S"
                    )}&backgroundColor=0A0A0A&textColor=F59E0B&fontWeight=900`
                  }
                  alt={log.user?.fullName || "Kullanıcı"}
                  className="w-10 h-10 object-cover border-2  border-[#404040]"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm uppercase tracking-wider">
                      {log.user?.fullName || "Gizli İzdaş"}
                    </span>
                    {isAuthorPremium && <Award className="w-4 h-4 text-amber-500" />}
                  </div>
                  <span className="text-xs font-mono text-neutral-500">
                    {new Date(log.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
              {typeof log.rating === "number" && log.rating > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5  bg-[#EF4444] text-white border-2  border-[#404040]">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-black font-mono">
                    {log.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            {log.review ? (
              <p className="text-base font-sans leading-relaxed  text-[#FAFAFA] whitespace-pre-wrap">
                {log.review}
              </p>
            ) : (
              <p className="text-sm font-mono text-neutral-500 italic">
                İnceleme metni girilmemiş. Sadece izlendi olarak işaretlendi.
              </p>
            )}
          </div>

          {/* Other Logs for this Media */}
          <div className="space-y-4">
            <h4 className="font-black font-mono text-sm uppercase border-b-2  border-[#404040] pb-2">
              Topluluktan Diğer Yorumlar
            </h4>

            {otherLogs.length > 0 ? (
              <div className="space-y-4 pt-2">
                {otherLogs.map((otherLog) => (
                  <div
                    key={otherLog.id}
                    className="p-4  bg-neutral-900 border-2  border-[#404040] text-sm font-sans"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {otherLog.user?.fullName || "Gizli İzdaş"}
                        </span>
                        {otherLog.user?.isPremium && (
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="text-xs font-mono text-neutral-500 ml-2">
                          {new Date(otherLog.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      {typeof otherLog.rating === "number" && otherLog.rating > 0 && (
                        <div className="flex items-center gap-1  text-[#EF4444]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-sm font-black font-mono">
                            {otherLog.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    {otherLog.review ? (
                      <p className="text-sm leading-relaxed  text-neutral-200">
                        {otherLog.review}
                      </p>
                    ) : (
                      <span className="text-sm text-neutral-500 font-mono">
                        (Sadece puanladı)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className=" bg-neutral-900 border-2 border-dashed  border-[#404040] p-6 text-center">
                <p className="text-sm font-mono text-neutral-500">
                  Bu yapım için henüz başka yorum yok.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
