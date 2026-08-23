import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serializeJsonLd } from '@/lib/jsonld';
import {
  Star,
  Calendar,
  Clock,
  Award,
  Users,
  ArrowLeft
} from 'lucide-react';
import { getOMDBDetails } from '@/lib/omdb';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { JoinClubBanner } from '@/components/auth/JoinClubBanner';
import {
  FilmPageActions,
  FilmShareButton,
} from './FilmPageActions';

// Use Promise for params as required in Next.js 15+
type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const movie = await getOMDBDetails(id);

  if (!movie) {
    return {
      title: 'Film Bulunamadı — izledin.com',
    };
  }

  // Only real fields make it into titles/social cards. Missing year or rating
  // is omitted outright — never replaced with plausible-looking defaults.
  const hasRating =
    typeof movie.voteAverage === 'number' && movie.voteAverage > 0;
  const yearSuffix = movie.year ? ` (${movie.year})` : '';

  const ogFacts: string[] = [];
  if (movie.director) ogFacts.push(`Yönetmen: ${movie.director}`);
  if (hasRating)
    ogFacts.push(`Puan: ${movie.voteAverage!.toFixed(1)}/10`);

  const ogParams = new URLSearchParams({ title: movie.title });
  if (movie.year) ogParams.set('year', String(movie.year));
  if (movie.director) ogParams.set('director', movie.director);
  if (hasRating) ogParams.set('rating', movie.voteAverage!.toFixed(1));

  return {
    title: `${movie.title}${yearSuffix} İnceleme ve Puanlar — izledin.com`,
    description: movie.overview.slice(0, 150) + '...',
    alternates: {
      canonical: `https://www.izledin.com/film/${id}`,
    },
    openGraph: {
      title: `${movie.title}${yearSuffix} — izledin.com`,
      description: `Bu filmi İzdaşlarınla puanla ve sinema günlüğüne ekle.${ogFacts.length > 0 ? ` ${ogFacts.join('. ')}.` : ''}`,
      images: [
        {
          url: `/api/og/movie?${ogParams.toString()}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function FilmDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const movie = await getOMDBDetails(id);

  if (!movie) {
    notFound();
  }

  // Real rating only — when the catalog has none we omit every rating display
  // instead of showing a made-up default.
  const ratingFormatted =
    typeof movie.voteAverage === 'number' && movie.voteAverage > 0
      ? movie.voteAverage.toFixed(1)
      : null;

  const typeLabel = movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Dizi' : 'Sinema Filmi';

  // Structured Data (JSON-LD) for SEO — properties without real data are
  // omitted entirely rather than padded with invented values.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Keşfet",
            "item": "https://www.izledin.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": movie.title,
            "item": `https://www.izledin.com/film/${id}`
          }
        ]
      },
      {
        "@type": "Movie",
        "name": movie.title,
        "image": movie.posterPath,
        ...(movie.year ? { "dateCreated": `${movie.year}` } : {}),
        "director": {
          "@type": "Person",
          "name": movie.director || "Bilinmeyen"
        },
        "description": movie.overview,
        ...(ratingFormatted
          ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": ratingFormatted,
                "bestRating": "10",
                ...(movie.imdbVotes
                  ? { "ratingCount": movie.imdbVotes.replace(/,/g, '') }
                  : {}),
              },
            }
          : {}),
      }
    ]
  };

  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full font-mono">
        {/* JSON-LD Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />

        {/* Breadcrumb Navigation */}
        <nav aria-label="Sayfa yolu" className="mb-8 flex items-center gap-2 text-xs  text-neutral-400">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5  hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEŞFET (ANA SAYFA)</span>
          </Link>
          <span>/</span>
          <span className=" text-[#FAFAFA] font-black uppercase">
            {movie.title}
          </span>
        </nav>

        {/* Core Movie Detail Container (Reusing styling from Modal) */}
        <article className="w-full  bg-[#171717] border-4  border-[#404040]  shadow-[10px_10px_0px_#000000] p-5 sm:p-8 animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between border-b-4  border-[#404040] pb-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="stamp-badge-solid px-3 py-1.5 text-sm font-black  bg-[#EF4444] text-white border-2  border-[#404040]">
                {typeLabel.toUpperCase()}
              </span>
              <span className="font-mono text-sm font-bold  text-neutral-400">
                #{movie.id.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FilmShareButton />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Poster Sidebar */}
            <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-4">
              <div className="relative aspect-[2/3] w-full bg-[#0A0A0A] border-4  border-[#404040]  shadow-[6px_6px_0px_#EF4444] overflow-hidden group">
                <img
                  src={movie.posterPath}
                  alt={`${movie.title} Afiş`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Action Buttons */}
              <FilmPageActions
                id={movie.id}
                title={movie.title}
                type={movie.type}
                overview={movie.overview}
                posterPath={movie.posterPath}
                backdropPath={movie.backdropPath}
                releaseDate={movie.releaseDate}
                year={movie.year}
                voteAverage={movie.voteAverage}
                voteCount={movie.voteCount}
                genres={movie.genres}
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase font-sans tracking-tight  text-[#FAFAFA] leading-none mb-2">
                  {movie.title}
                </h1>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <h2 className="text-sm font-bold  text-neutral-400 italic font-serif">
                    {movie.originalTitle}
                  </h2>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                {ratingFormatted && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-2  border-[#404040]  bg-[#0A0A0A]">
                    <Star className="w-4 h-4  text-[#EF4444] fill-current" />
                    <span>{ratingFormatted}</span>
                  </div>
                )}
                {movie.releaseDate && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-2  border-[#404040]  bg-[#0A0A0A]">
                    <Calendar className="w-4 h-4  text-neutral-400" />
                    <span>{movie.releaseDate}</span>
                  </div>
                )}
                {movie.duration && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-2  border-[#404040]  bg-[#0A0A0A]">
                    <Clock className="w-4 h-4  text-neutral-400" />
                    <span>{movie.duration}</span>
                  </div>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <span 
                      key={g}
                      className="px-2.5 py-1 text-xs font-black uppercase border-2 border-dashed  border-[#404040]  text-neutral-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <div className=" prose-invert max-w-none">
                <h3 className="text-sm font-black uppercase border-b-2  border-[#404040] pb-1 mb-2 inline-block">Özet</h3>
                <p className="text-sm font-sans leading-relaxed  text-neutral-300">
                  {movie.overview}
                </p>
              </div>

              {/* Credits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-dashed  border-neutral-700">
                {movie.director && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase flex items-center gap-1.5">
                      <Award className="w-3 h-3" /> Yönetmen
                    </span>
                    <p className="text-sm font-bold">{movie.director}</p>
                  </div>
                )}
                {movie.actors && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Oyuncular
                    </span>
                    <p className="text-sm font-bold line-clamp-2" title={movie.actors}>
                      {movie.actors}
                    </p>
                  </div>
                )}
              </div>

              {/* Join Club Banner */}
              <JoinClubBanner />
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
