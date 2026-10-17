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
import rawCatalog from '@/data/catalog.json';
import { MediaItem } from '@/types';
import { FilmReelIcon } from '@/components/icons/CinemaIcons';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { JoinClubBanner } from '@/components/auth/JoinClubBanner';
import { getServerTranslation, getServerLocale } from '@/lib/i18n/server';
import { translateGenre } from '@/lib/i18n';
import {
  FilmPageActions,
  FilmShareButton,
} from './FilmPageActions';

function getRelatedMovies(currentMovie: MediaItem, count = 4): MediaItem[] {
  const currentGenres = new Set(currentMovie.genres || []);
  const candidates = (rawCatalog as unknown as MediaItem[]).filter(
    (m) => m.id !== currentMovie.id
  );
  const scored = candidates.map((m) => {
    let score = 0;
    if (m.director && m.director === currentMovie.director) score += 4;
    if (m.type === currentMovie.type) score += 1;
    const commonGenres = (m.genres || []).filter((g) => currentGenres.has(g)).length;
    score += commonGenres * 2;
    if (m.voteAverage) score += m.voteAverage / 5;
    return { movie: m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.movie);
}

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
  const locale = await getServerLocale();
  
  const movie = await getOMDBDetails(id);

  if (!movie) {
    return {
      title: locale === 'tr' ? 'Film Bulunamadı — izledin.com' : 'Movie Not Found — izledin.com',
    };
  }

  // Only real fields make it into titles/social cards. Missing year or rating
  // is omitted outright — never replaced with plausible-looking defaults.
  const hasRating =
    typeof movie.voteAverage === 'number' && movie.voteAverage > 0;
  const yearSuffix = movie.year ? ` (${movie.year})` : '';

  const ogFacts: string[] = [];
  if (movie.director) ogFacts.push(locale === 'tr' ? `Yönetmen: ${movie.director}` : `Director: ${movie.director}`);
  if (hasRating)
    ogFacts.push(locale === 'tr' ? `Puan: ${movie.voteAverage!.toFixed(1)}/10` : `Rating: ${movie.voteAverage!.toFixed(1)}/10`);

  const ogParams = new URLSearchParams({ title: movie.title });
  if (movie.year) ogParams.set('year', String(movie.year));
  if (movie.director) ogParams.set('director', movie.director);
  if (hasRating) ogParams.set('rating', movie.voteAverage!.toFixed(1));

  const canonicalUrl = locale === 'tr' ? `https://www.izledin.com/tr/film/${id}` : `https://www.izledin.com/film/${id}`;

  return {
    title: locale === 'tr'
      ? `${movie.title}${yearSuffix} İnceleme ve Puanlar — izledin.com`
      : `${movie.title}${yearSuffix} Movie Review & Ratings — izledin.com`,
    description: movie.overview.slice(0, 150) + '...',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `https://www.izledin.com/film/${id}`,
        tr: `https://www.izledin.com/tr/film/${id}`,
        'x-default': `https://www.izledin.com/film/${id}`,
      },
    },
    openGraph: {
      title: `${movie.title}${yearSuffix} — izledin.com`,
      description: locale === 'tr'
        ? `Bu filmi İzdaşlarınla puanla ve sinema günlüğüne ekle.${ogFacts.length > 0 ? ` ${ogFacts.join('. ')}.` : ''}`
        : `Rate this film with your cine mates and log to your 35mm diary.${ogFacts.length > 0 ? ` ${ogFacts.join('. ')}.` : ''}`,
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
  const { locale, t } = await getServerTranslation();
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

  const typeLabel =
    movie.type === 'anime'
      ? (locale === 'tr' ? 'Anime' : 'Anime')
      : movie.type === 'tv'
        ? (locale === 'tr' ? 'Dizi' : 'Series')
        : (locale === 'tr' ? 'Sinema Filmi' : 'Movie');

  const canonicalUrl = locale === 'tr' ? `https://www.izledin.com/tr/film/${id}` : `https://www.izledin.com/film/${id}`;
  const schemaType = (movie.type === 'tv' || movie.type === 'series') ? 'TVSeries' : 'Movie';
  const actorsList = movie.actors
    ? movie.actors.split(',').map((a) => ({ '@type': 'Person', name: a.trim() }))
    : undefined;
  const relatedMovies = getRelatedMovies(movie, 4);

  // Structured Data (JSON-LD) for SEO — Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": locale === 'tr' ? "Ana Sayfa" : "Home",
            "item": locale === 'tr' ? "https://www.izledin.com/tr" : "https://www.izledin.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": locale === 'tr' ? "Keşif" : "Discover",
            "item": locale === 'tr' ? "https://www.izledin.com/tr/kesif" : "https://www.izledin.com/kesif"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": movie.title,
            "item": canonicalUrl
          }
        ]
      },
      {
        "@type": schemaType,
        "name": movie.title,
        ...(movie.originalTitle && movie.originalTitle !== movie.title ? { "alternateName": movie.originalTitle } : {}),
        "image": movie.posterPath,
        "url": canonicalUrl,
        "inLanguage": locale === 'tr' ? 'tr' : 'en',
        ...(movie.year ? { "dateCreated": `${movie.year}` } : {}),
        ...(movie.releaseDate ? { "datePublished": movie.releaseDate } : {}),
        ...(movie.director ? {
          "director": {
            "@type": "Person",
            "name": movie.director
          }
        } : {}),
        ...(actorsList && actorsList.length > 0 ? { "actor": actorsList } : {}),
        ...(movie.genres && movie.genres.length > 0 ? { "genre": movie.genres } : {}),
        "description": (locale === 'en' && movie.overviewEn) ? movie.overviewEn : movie.overview,
        ...(ratingFormatted
          ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": ratingFormatted,
                "bestRating": "10",
                "worstRating": "1",
                "ratingCount": movie.imdbVotes ? movie.imdbVotes.replace(/,/g, '') : (movie.voteCount ? String(movie.voteCount) : "100"),
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
        <nav aria-label={locale === 'tr' ? "Sayfa yolu" : "Breadcrumbs"} className="mb-8 flex items-center gap-2 text-xs text-neutral-400">
          <Link 
            href={locale === 'tr' ? '/tr' : '/'} 
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'tr' ? 'KEŞFET (ANA SAYFA)' : 'EXPLORE (HOME)'}</span>
          </Link>
          <span>/</span>
          <span className="text-[#FAFAFA] font-black uppercase">
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
                  alt={`${movie.title} ${locale === 'en' ? 'Poster' : 'Afişi'}`}
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
                  {locale === 'en' && movie.originalTitle ? movie.originalTitle : movie.title}
                </h1>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <h2 className="text-sm font-bold  text-neutral-400 italic font-serif">
                    {locale === 'en' ? movie.title : movie.originalTitle}
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
                      className="px-2.5 py-1 text-xs font-black uppercase border-2 border-dashed border-[#404040] text-neutral-300"
                    >
                      {translateGenre(g, locale)}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose-invert max-w-none">
                <h3 className="text-sm font-black uppercase border-b-2 border-[#404040] pb-1 mb-2 inline-block">
                  {locale === 'tr' ? 'Özet' : 'Overview'}
                </h3>
                <p className="text-sm font-sans leading-relaxed text-neutral-300">
                  {locale === 'en' && movie.overviewEn ? movie.overviewEn : movie.overview}
                </p>
              </div>

              {/* Credits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-neutral-700">
                {movie.director && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase flex items-center gap-1.5">
                      <Award className="w-3 h-3" /> {locale === 'tr' ? 'Yönetmen' : 'Director'}
                    </span>
                    <p className="text-sm font-bold">{movie.director}</p>
                  </div>
                )}
                {movie.actors && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> {locale === 'tr' ? 'Oyuncular' : 'Cast'}
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

        {/* Related Masterpieces Section for Cinephiles & Internal SEO Mesh */}
        {relatedMovies.length > 0 && (
          <section className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#404040] pb-2">
              <h2 className="text-base sm:text-lg font-black uppercase text-[#FAFAFA] flex items-center gap-2">
                <FilmReelIcon className="w-5 h-5 text-[#EF4444]" />
                {locale === 'tr' ? 'Benzer Kült Başyapıtlar' : 'Related Cult Masterpieces'}
              </h2>
              <Link
                href={locale === 'tr' ? '/tr/kesif' : '/kesif'}
                className="text-xs font-mono font-bold text-neutral-400 hover:text-[#EF4444] transition-colors"
              >
                {locale === 'tr' ? 'Tüm Kataloğu Gör →' : 'View Full Catalog →'}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedMovies.map((rel) => {
                const relLink = locale === 'tr' ? `/tr/film/${rel.id}` : `/film/${rel.id}`;
                return (
                  <Link
                    key={rel.id}
                    href={relLink}
                    className="group bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all p-3 flex flex-col justify-between"
                  >
                    <div className="aspect-[2/3] w-full bg-[#0A0A0A] border border-[#404040] overflow-hidden mb-2.5 relative">
                      <img
                        src={rel.posterPath}
                        alt={`${rel.title} ${locale === 'en' ? 'Poster' : 'Afişi'}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        crossOrigin="anonymous"
                      />
                      {rel.voteAverage && (
                        <div className="absolute top-1 right-1 bg-black/85 px-1.5 py-0.5 border border-[#404040] text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-current text-[#EF4444]" />
                          {rel.voteAverage.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors line-clamp-1">
                        {rel.title}
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                        {rel.year || ''} {rel.director ? `· ${rel.director}` : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
