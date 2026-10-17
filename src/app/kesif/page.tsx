import type { Metadata } from "next";
import { KesifView } from "@/components/kesif/KesifView";

/**
 * KEŞİF — catalog showcase (S4 / Push A, MATCHING-PIVOT-PLAN.md).
 * Purely additive: receives the masterpiece hero + Vizyondakiler explorer so
 * the S7 atomic flip can turn `/` into the PERDE deck with zero content loss.
 * Server wrapper owns metadata; the view is a client component (catalog
 * ranking/filters are client-side per existing architecture).
 */
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === "en") {
    return {
      title: "Discover — In Theaters & Cult Movie Catalog — izledin.com",
      description:
        "Masterpiece of the week and 2000+ movies, series, and anime rated by our cinema club. Explore with CineScore picks, genre filters, and watchlist.",
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

export default function KesifPage() {
  return <KesifView />;
}
