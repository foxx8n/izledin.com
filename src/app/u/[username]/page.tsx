import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serializeJsonLd } from '@/lib/jsonld';
import { 
  Star, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Heart, 
  ArrowLeft,
  Share2,
  Film
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { mapDbProfileToProfile, PROFILE_SELECT_COLUMNS } from '@/lib/services/profile.service';
import { mapDbLogToWatchLog } from '@/lib/services/watch-logs.service';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateDynamicBio } from '@/lib/cinema-bio-generator';

type Props = {
  params: Promise<{ username: string }>;
};

async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  // PROFILE_SELECT_COLUMNS is a runtime string, so supabase-js cannot infer
  // the row shape here — normalize through the mapper's expected shape.
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .ilike('username', username)
    .single();

  if (error || !data) return null;
  const row = data as Record<string, any>;

  // Age is computed server-side; the raw birth date never leaves the database.
  const { data: age } = await supabase.rpc('get_user_age', { p_user_id: row.id });

  return mapDbProfileToProfile({ ...row, age: age ?? undefined });
}

async function getProfileLogs(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('watch_logs')
    .select(`*, profiles(${PROFILE_SELECT_COLUMNS})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map(mapDbLogToWatchLog);
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const profile = await getProfileByUsername(resolvedParams.username);
  
  if (!profile) {
    return { title: 'Profil Bulunamadı — izledin.com' };
  }

  const title = `${profile.fullName} (@${profile.username}) Sinema Günlüğü — izledin.com`;
  const description = profile.bio || `${profile.fullName} kullanıcısının izlediği filmler, diziler ve sinema değerlendirmeleri.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.izledin.com/u/${profile.username}`,
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og/profile?username=${encodeURIComponent(profile.username)}&name=${encodeURIComponent(profile.fullName)}&avatar=${encodeURIComponent(profile.avatarUrl)}&count=${profile.totalWatchedCount || 0}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const resolvedParams = await params;
  const profile = await getProfileByUsername(resolvedParams.username);

  if (!profile) {
    notFound();
  }

  const logs = await getProfileLogs(profile.id);

  // ProfilePage JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": profile.fullName,
      "alternateName": profile.username,
      "description": profile.bio,
      "image": profile.avatarUrl,
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": profile.totalWatchedCount || logs.length
      }
    }
  };

  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full font-mono">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />

        {/* Profile Header */}
        <div className=" bg-[#171717] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-6 sm:p-10 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            <div className="shrink-0 relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#0A0A0A] border-4  border-[#404040]  shadow-[4px_4px_0px_#EF4444] overflow-hidden">
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              {profile.isPremium && (
                <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-black px-2 py-0.5 text-[10px] font-black border-2 border-black shadow-[2px_2px_0px_black] transform rotate-[-5deg]">
                  İZLEDİN+
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase  text-[#FAFAFA] leading-none mb-1">
                  {profile.fullName}
                </h1>
                <h2 className="text-sm font-bold  text-neutral-400 uppercase">
                  @{profile.username}
                </h2>
              </div>

              <p className="text-sm font-sans italic text-neutral-300 max-w-xl mx-auto sm:mx-0">
                &ldquo;{profile.bio || generateDynamicBio(profile)}&rdquo;
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-bold  text-neutral-400">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {profile.age} Yaşında
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" />
                  {profile.totalWatchedCount || logs.length} İzleme
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 4 Favorites */}
        {profile.top4Favorites && profile.top4Favorites.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-black uppercase mb-4 border-b-4  border-[#404040] pb-2 inline-flex items-center gap-2">
              <Heart className="w-4 h-4 fill-current text-[#DC2626]" />
              BAŞYAPITLAR (TOP 4)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile.top4Favorites.map((fav, idx) => (
                <div key={`${fav.id}-${idx}`} className="group relative aspect-[2/3] bg-[#0A0A0A] border-2  border-[#404040] overflow-hidden">
                  <Link href={`/film/${fav.id}`} className="absolute inset-0 z-10" />
                  <img
                    src={fav.posterUrl}
                    alt={fav.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 w-6 h-6  bg-black  text-white flex items-center justify-center font-black text-xs border-2  border-white shadow-[2px_2px_0px_#DC2626]">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch Logs */}
        <div>
          <h3 className="text-sm font-black uppercase mb-4 border-b-4  border-[#404040] pb-2 inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            DAKTİLO (SON İZLENENLER)
          </h3>
          
          {logs.length === 0 ? (
            <div className=" bg-neutral-900 border-2 border-dashed  border-neutral-700 p-8 text-center">
              <p className="text-sm font-bold text-neutral-500">Henüz hiçbir içeriği puanlamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {logs.map((log) => (
                <div key={log.id} className="group relative  bg-[#171717] border-2  border-[#404040] p-2 hover:shadow-[4px_4px_0px_#DC2626] transition-all">
                  <Link href={`/film/${log.mediaId}`} className="absolute inset-0 z-10" />
                  <div className="aspect-[2/3] w-full bg-[#0A0A0A] mb-2 overflow-hidden border  border-neutral-800">
                    <img
                      src={log.posterUrl}
                      alt={log.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between font-bold text-[10px]">
                    <div className="flex items-center gap-1  text-[#EF4444]">
                      <Star className="w-3 h-3 fill-current" />
                      {log.rating ? log.rating.toFixed(1) : '-'}
                    </div>
                    <div className=" text-neutral-400 truncate max-w-[60%]">
                      {new Date(log.watchedDate).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
