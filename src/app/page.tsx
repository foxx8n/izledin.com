import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Star, Film, Sparkles, BookOpen, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeDeck } from "@/components/home/HomeDeck";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslation } from "@/lib/i18n/server";
import { serializeJsonLd } from "@/lib/jsonld";
import rawCatalog from "@/data/catalog.json";
import { MediaItem } from "@/types";

const FEATURED_MASTERPIECE_IDS = [
  "tt15239678", // Dune: Part Two
  "tt15398776", // Oppenheimer
  "tt0816692",  // Interstellar
  "tt0468569",  // The Dark Knight
  "tt1375666",  // Inception
  "tt6751668",  // Parasite
  "tt0110912",  // Pulp Fiction
  "tt1856010",  // Blade Runner 2049
];

const FAQS_TR = [
  {
    q: "İzledin nedir ve ne işe yarar?",
    a: "İzledin, film, dizi ve anime severlerin sinema DNA'larını çıkardıkları, 35mm daktilo estetiğiyle kişisel izleme günlüğü tuttukları ve aynı sahnelerde ağlayıp ürperdikleri sinema ikizlerini (İzdaş) buldukları bağımsız bir sinema kulübüdür.",
  },
  {
    q: "İzdaş nedir ve nasıl eşleşilir?",
    a: "İzdaş, sinema ve dizi zevki sizinle yüksek oranda örtüşen film arkadaşınızdır. İzledin algoritması; izlediğiniz ve yüksek puan verdiğiniz başyapıtları, favori 4 filminizi ve kaçındığınız yapımları analiz ederek size özel uyum yüzdesi hesaplar.",
  },
  {
    q: "Hangi film, dizi ve animeleri kaydedebilirim?",
    a: "Kült klasiklerden 2026'da vizyona girecek en yeni filmlere kadar 2000'den fazla özenle seçilmiş yapım ve geniş arama arşivi mevcuttur. İzlediğiniz her içeriğe 1-10 puan verebilir, daktilo notları bırakabilirsiniz.",
  },
  {
    q: "İzledin ücretsiz mi?",
    a: "Evet! İzledin'e kaydolmak, film günlüğü tutmak, kataloğu keşfetmek ve İzdaş radarıyla eşleşmek tamamen ücretsizdir. Sınırsız eşleşme ve özel 35mm kulüp rozetleri isteyen sinefiller için izledin+ üyeliği de sunulmaktadır.",
  },
];

const FAQS_EN = [
  {
    q: "What is Izledin?",
    a: "Izledin is an independent 35mm brutalist cinema club where cinephiles discover their cinema DNA, keep a typewriter watch diary, and match with movie mates who get emotional at the exact same scenes.",
  },
  {
    q: "What is an 'İzdaş' (Movie Mate) and how does matching work?",
    a: "A Movie Mate is someone whose cinema and series taste resonates with yours. The matching engine compares your ratings, your top 4 masterpieces, and watch history to compute real-time compatibility scores.",
  },
  {
    q: "What can I track and log on Izledin?",
    a: "You can rate, review, and log over 2,000 curated cult classics, contemporary films, TV series, and anime. Each log is formatted with vintage 35mm typewriter film aesthetics.",
  },
  {
    q: "Is Izledin free to use?",
    a: "Yes! Creating an account, keeping your watch diary, exploring the catalog, and matching with movie mates is completely free. Dedicated cinephiles can optionally upgrade to izledin+ for unlimited matches and exclusive badges.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === "tr") {
    return {
      title: "İzledin — Sinema Kulübü, Film Önerileri & İzdaş Eşleşmesi",
      description:
        "Film, dizi ve anime zevkine göre eşleşen 35mm daktilo sinema kulübü. Kült başyapıtları keşfet, sinema günlüğünü tut, aynı sahnelerde ürperdiğin İzdaşınla eşleş.",
      keywords: [
        "izledin",
        "film önerileri",
        "izdaş",
        "sinefil kulübü",
        "film günlüğü",
        "hangi filmi izlesem",
        "sinema arkadaşı bul",
        "vizyondaki filmler",
        "kült filmler",
        "anime takip",
        "dizi izleme listesi",
      ],
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      alternates: {
        canonical: "https://www.izledin.com/tr",
        languages: {
          en: "https://www.izledin.com",
          tr: "https://www.izledin.com/tr",
          "x-default": "https://www.izledin.com",
        },
      },
      openGraph: {
        title: "İzledin — Sinema Kulübü, Film Önerileri & İzdaş Eşleşmesi",
        description:
          "Film, dizi ve anime zevkine göre eşleşen 35mm daktilo sinema kulübü. Kült başyapıtları keşfet, aynı sahnelerde ürperdiğin İzdaşınla eşleş.",
        url: "https://www.izledin.com/tr",
        siteName: "izledin.com",
        locale: "tr_TR",
        type: "website",
        images: [
          {
            url: "https://www.izledin.com/signature.png",
            width: 1200,
            height: 630,
            alt: "İzledin 35mm Sinema Kulübü",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "İzledin — 35mm Sinema Kulübü & İzdaş Radarı",
        description: "Aynı filmlerde ağlayıp ürperdiğin İzdaşını bul, 35mm daktilo günlüğünü tut.",
        images: ["https://www.izledin.com/signature.png"],
      },
    };
  }

  return {
    title: "Izledin — Cinephile Club, Movie Diary & Movie Mates Matching",
    description:
      "Brutalist 35mm cinephile matching club based on movies, series, and anime. Discover cult masterpieces, build your typewriter diary, and connect with true movie mates.",
    keywords: [
      "izledin",
      "movie mates",
      "cinephile club",
      "movie diary",
      "film recommendations",
      "find movie mates",
      "movie match",
      "letterboxd alternative",
      "typewriter film journal",
      "cult movies",
      "anime tracker",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "https://www.izledin.com",
      languages: {
        en: "https://www.izledin.com",
        tr: "https://www.izledin.com/tr",
        "x-default": "https://www.izledin.com",
      },
    },
    openGraph: {
      title: "Izledin — Cinephile Club, Movie Diary & Movie Mates Matching",
      description:
        "Brutalist 35mm cinephile matching club based on movies, series, and anime. Discover cult masterpieces and connect with movie mates.",
      url: "https://www.izledin.com",
      siteName: "izledin.com",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: "https://www.izledin.com/signature.png",
          width: 1200,
          height: 630,
          alt: "Izledin 35mm Cinephile Club",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Izledin — 35mm Cinephile Club & Movie Mates Radar",
      description: "Find movie mates who cry at the same scenes. Rate films in your 35mm typewriter diary.",
      images: ["https://www.izledin.com/signature.png"],
    },
  };
}

async function getMemberCount(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [{ locale }, memberCount] = await Promise.all([
    getServerTranslation(),
    getMemberCount(),
  ]);

  const prefix = locale === "tr" ? "/tr" : "";

  const featuredMovies = FEATURED_MASTERPIECE_IDS.map((id) =>
    (rawCatalog as unknown as MediaItem[]).find((m) => m.id === id)
  ).filter((m): m is MediaItem => Boolean(m));

  const faqs = locale === "tr" ? FAQS_TR : FAQS_EN;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: locale === "tr" ? "Kült Sinema Başyapıtları" : "Featured Cult Masterpieces",
        description: locale === "tr"
          ? "İzledin sinema kulübünün en yüksek puanlı kült başyapıtları."
          : "Top rated cult masterpieces curated by the Izledin cinema club.",
        url: locale === "tr" ? "https://www.izledin.com/tr" : "https://www.izledin.com",
        numberOfItems: featuredMovies.length,
        itemListElement: featuredMovies.map((m, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Movie",
            name: m.title,
            image: m.posterPath,
            url: locale === "tr" ? `https://www.izledin.com/tr/film/${m.id}` : `https://www.izledin.com/film/${m.id}`,
            ...(m.year ? { dateCreated: `${m.year}` } : {}),
            ...(m.director ? { director: { "@type": "Person", name: m.director } } : {}),
            ...(m.voteAverage ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: m.voteAverage.toFixed(1),
                bestRating: "10",
                ratingCount: "100"
              }
            } : {})
          }
        }))
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
        {/* JSON-LD Script for Google Rich Snippets (FAQPage + ItemList) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />

        {/* Pitch — one line of soul, one line of fact, zero ceremony */}
        <section className="text-center space-y-2.5 pt-1 font-mono">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[#FAFAFA] font-sans leading-tight max-w-3xl mx-auto">
            {locale === "en" ? (
              <>
                Find the <span className="text-[#EF4444]">movie mates</span> who cry
                and get goosebumps at the exact same scenes — start swiping.
              </>
            ) : (
              <>
                Aynı filmlerde ağlayıp aynı sahnelerde ürperdiğin{" "}
                <span className="text-[#EF4444]">izdaşını</span> bul — kaydırmaya
                başla.
              </>
            )}
          </h1>
          <p className="text-xs text-neutral-400">
            {locale === "en"
              ? typeof memberCount === "number"
                ? `Movies · Series · Anime — currently ${memberCount} cinephiles registered (founding era)`
                : "Movies · Series · Anime — founding members era"
              : typeof memberCount === "number"
                ? `Film · Dizi · Anime — şu an ${memberCount} sinefil kayıtlı (kurucu dönem)`
                : "Film · Dizi · Anime — kurucu üyeler dönemi"}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-600">
            {locale === "en"
              ? "Daily request quota · radar incognito mode · protected chat"
              : "Günlük istek sınırı · radarda gizlenme · korumalı sohbet"}
          </p>
        </section>

        {/* Liquidity-governed deck */}
        <Suspense
          fallback={
            <div className="py-12 text-center font-mono text-xs font-black uppercase text-neutral-500 tracking-widest">
              {locale === "en" ? "CURTAIN RISING..." : "PERDE AÇILIYOR..."}
            </div>
          }
        >
          <HomeDeck />
        </Suspense>

        {/* Continuity anchors */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono pb-4">
          <Link
            href={`${prefix}/kesif`}
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              {locale === "en" ? "DISCOVERY →" : "KEŞİF →"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {locale === "en"
                ? "Masterpiece of the week and a 2000+ movie catalog curated by the club."
                : "Haftanın başyapıtı ve kulübün puanladığı 2000+ başyapıtlık katalog."}
            </p>
          </Link>
          <Link
            href={`${prefix}/matches`}
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              {locale === "en" ? "MOVIE MATES RADAR →" : "İZDAŞ RADARI →"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {locale === "en"
                ? "Filter by taste, explore compatibility scores, match, and chat."
                : "Filtrelerle tara, uyum yüzdesini gör, eşleş ve sohbete açıl."}
            </p>
          </Link>
          <Link
            href={`${prefix}/diary`}
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              {locale === "en" ? "DIARY →" : "GÜNLÜK →"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {locale === "en"
                ? "Your watch history, ratings, and typewriter logs from the community."
                : "İzlediklerin, puanların ve topluluğun daktilo notları."}
            </p>
          </Link>
        </section>

        {/* Featured Masterpieces Grid — Crawlable internal links & cinephile showcase */}
        <section className="space-y-4 pt-4 border-t-2 border-[#262626]">
          <div className="flex items-center justify-between border-b-2 border-[#404040] pb-2 font-mono">
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase text-[#FAFAFA] flex items-center gap-2 font-sans tracking-tight">
                <Film className="w-5 h-5 text-[#EF4444]" />
                {locale === "en" ? "Curated Cult Masterpieces" : "Öne Çıkan Kült Başyapıtlar"}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {locale === "en"
                  ? "Rated by the club · explore reviews, cast, and cinephile ratings"
                  : "Kulübün puanladığı kült filmler · inceleme, künye ve puanları keşfet"}
              </p>
            </div>
            <Link
              href={`${prefix}/kesif`}
              className="text-xs font-bold text-neutral-400 hover:text-[#EF4444] transition-colors shrink-0"
            >
              {locale === "en" ? "All 2000+ Titles →" : "2000+ Filmi Gör →"}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            {featuredMovies.map((movie) => {
              const movieHref = `${prefix}/film/${movie.id}`;
              return (
                <Link
                  key={movie.id}
                  href={movieHref}
                  className="group bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all p-3 flex flex-col justify-between"
                >
                  <div className="aspect-[2/3] w-full bg-[#0A0A0A] border border-[#404040] overflow-hidden mb-2.5 relative">
                    <img
                      src={movie.posterPath}
                      alt={`${movie.title} ${locale === "en" ? "Movie Poster" : "Film Afişi"}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      crossOrigin="anonymous"
                    />
                    {movie.voteAverage && (
                      <div className="absolute top-1 right-1 bg-black/85 px-1.5 py-0.5 border border-[#404040] text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current text-[#EF4444]" />
                        {movie.voteAverage.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {movie.year || ""} {movie.director ? `· ${movie.director}` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Cinephile FAQ Section — High-intent search answers & Rich Snippets */}
        <section className="space-y-4 pt-6 pb-4 border-t-2 border-[#262626] font-mono">
          <div className="border-b-2 border-[#404040] pb-2">
            <h2 className="text-base sm:text-xl font-black uppercase text-[#FAFAFA] flex items-center gap-2 font-sans tracking-tight">
              <HelpCircle className="w-5 h-5 text-[#EF4444]" />
              {locale === "en" ? "Frequently Asked Questions" : "Sıkça Sorulan Sorular"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {locale === "en"
                ? "Everything you need to know about Izledin cinema club and movie mate matching"
                : "İzledin sinema kulübü, İzdaş eşleşmesi ve film günlüğü hakkında merak edilenler"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 bg-[#171717] border-2 border-[#404040] shadow-[4px_4px_0px_#000000] space-y-2"
              >
                <h3 className="text-xs sm:text-sm font-black uppercase text-[#EF4444] flex items-start gap-2">
                  <span>Q{idx + 1}.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
