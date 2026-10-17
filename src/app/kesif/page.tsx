import type { Metadata } from "next";
import { KesifView } from "@/components/kesif/KesifView";

/**
 * KEŞİF — catalog showcase (S4 / Push A, MATCHING-PIVOT-PLAN.md).
 * Purely additive: receives the masterpiece hero + Vizyondakiler explorer so
 * the S7 atomic flip can turn `/` into the PERDE deck with zero content loss.
 * Server wrapper owns metadata; the view is a client component (catalog
 * ranking/filters are client-side per existing architecture).
 */
import { serializeJsonLd } from "@/lib/jsonld";
import rawCatalog from "@/data/catalog.json";
import { MediaItem } from "@/types";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === "en") {
    return {
      title: "Discover — In Theaters & Cult Movie Catalog — izledin.com",
      description:
        "Masterpiece of the week and 2000+ movies, series, and anime rated by our cinema club. Explore with CineScore picks, genre filters, and watchlist.",
      keywords: [
        "movie discovery",
        "cult movies",
        "in theaters 2026",
        "best movies",
        "cinephile catalog",
        "anime recommendations",
        "movie watchlist",
        "film ratings",
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
        canonical: "https://www.izledin.com/kesif",
        languages: {
          en: "https://www.izledin.com/kesif",
          tr: "https://www.izledin.com/tr/kesif",
          "x-default": "https://www.izledin.com/kesif",
        },
      },
      openGraph: {
        title: "Discover — In Theaters & Cult Movie Catalog — izledin.com",
        description:
          "Masterpiece of the week and 2000+ movies, series, and anime rated by our cinema club.",
        url: "https://www.izledin.com/kesif",
        type: "website",
      },
    };
  }

  return {
    title: "Keşif — Vizyondakiler & Kült Film Kataloğu — izledin.com",
    description:
      "Haftanın başyapıtı ve kulübün puanladığı 2000+ film, dizi ve anime. CineScore önerileri, tür filtreleri ve izleme listesi ile keşfet.",
    keywords: [
      "film keşfi",
      "kült filmler",
      "vizyondakiler 2026",
      "en iyi filmler",
      "sinefil kataloğu",
      "anime önerileri",
      "film listesi",
      "film puanları",
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
      canonical: "https://www.izledin.com/tr/kesif",
      languages: {
        en: "https://www.izledin.com/kesif",
        tr: "https://www.izledin.com/tr/kesif",
        "x-default": "https://www.izledin.com/kesif",
      },
    },
    openGraph: {
      title: "Keşif — Vizyondakiler & Kült Film Kataloğu — izledin.com",
      description:
        "Haftanın başyapıtı ve kulübün puanladığı 2000+ film, dizi ve anime.",
      url: "https://www.izledin.com/tr/kesif",
      type: "website",
    },
  };
}

export default async function KesifPage() {
  const { locale } = await getServerTranslation();
  const canonicalUrl = locale === "tr" ? "https://www.izledin.com/tr/kesif" : "https://www.izledin.com/kesif";

  const topCatalogItems = (rawCatalog as unknown as MediaItem[]).slice(0, 20).map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": item.type === "tv" || item.type === "series" ? "TVSeries" : "Movie",
      name: item.title,
      image: item.posterPath,
      url: locale === "tr" ? `https://www.izledin.com/tr/film/${item.id}` : `https://www.izledin.com/film/${item.id}`,
      ...(item.year ? { dateCreated: `${item.year}` } : {}),
      ...(item.director ? { director: { "@type": "Person", name: item.director } } : {}),
      ...(item.voteAverage ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: item.voteAverage.toFixed(1),
          bestRating: "10",
          ratingCount: "100"
        }
      } : {}),
    },
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "tr" ? "Keşif — Vizyondakiler & Kült Film Kataloğu" : "Discover — In Theaters & Cult Movie Catalog",
    description: locale === "tr"
      ? "İzledin kulübünün puanladığı 2000+ başyapıtlık sinema kataloğu."
      : "Curated 2000+ masterpiece movie catalog on Izledin.",
    url: canonicalUrl,
    numberOfItems: topCatalogItems.length,
    itemListElement: topCatalogItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <KesifView />
    </>
  );
}
