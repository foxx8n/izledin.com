import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeDeck } from "@/components/home/HomeDeck";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslation } from "@/lib/i18n/server";

/**
 * PERDE — matching-first front door (S5/S7 atomic flip, MATCHING-PIVOT-PLAN).
 * Server-rendered pitch (crawlable, no localStorage during first render per
 * §A8) wrapping the client liquidity-governed deck. The catalog showcase this
 * route used to hold now lives at /kesif (S4).
 */
export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === "tr") {
    return {
      title: "İzledin — Aynı Filmlerde Ağlayan İzdaşını Bul",
      description:
        "Film, dizi ve anime zevkine göre eşleşen Türkçe sinema kulübü. Sinema DNA'nı çıkar, aynı sahnelerde ürperdiğin İzdaşınla eşleş.",
      alternates: {
        canonical: "https://izledin.com/tr",
        languages: {
          en: "https://izledin.com",
          tr: "https://izledin.com/tr",
          "x-default": "https://izledin.com",
        },
      },
    };
  }

  return {
    title: "İzledin — Find Your Film Mates Who Cry at the Same Scenes",
    description:
      "Brutalist cinephile matching club based on movies, series, and anime. Discover your cinema DNA and connect with true film lovers.",
    alternates: {
      canonical: "https://izledin.com",
      languages: {
        en: "https://izledin.com",
        tr: "https://izledin.com/tr",
        "x-default": "https://izledin.com",
      },
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

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
        {/* Pitch — one line of soul, one line of fact, zero ceremony */}
        <section className="text-center space-y-2.5 pt-1 font-mono">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[#FAFAFA] font-sans leading-tight max-w-3xl mx-auto">
            {locale === "en" ? (
              <>
                Find the <span className="text-[#EF4444]">film mates</span> who cry
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
                ? "Masterpiece of the week and a 2000+ film catalog curated by the club."
                : "Haftanın başyapıtı ve kulübün puanladığı 2000+ başyapıtlık katalog."}
            </p>
          </Link>
          <Link
            href={`${prefix}/matches`}
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              {locale === "en" ? "FILM MATES RADAR →" : "İZDAŞ RADARI →"}
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
      </main>

      <Footer />
    </div>
  );
}
