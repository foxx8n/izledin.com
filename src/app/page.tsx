import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeDeck } from "@/components/home/HomeDeck";
import { MasterpieceLaurelIcon } from "@/components/icons/CinemaIcons";
import { createClient } from "@/lib/supabase/server";

/**
 * PERDE — matching-first front door (S5/S7 atomic flip, MATCHING-PIVOT-PLAN).
 * Server-rendered pitch (crawlable, no localStorage during first render per
 * §A8) wrapping the client liquidity-governed deck. The catalog showcase this
 * route used to hold now lives at /kesif (S4).
 */
export const metadata: Metadata = {
  title: "İzledin — Aynı Filmlerde Ağlayan İzdaşını Bul",
  description:
    "Film, dizi ve anime zevkine göre eşleşen Türkçe sinema kulübü. Sinema DNA'nı çıkar, aynı sahnelerde ürperdiğin İzdaşınla eşleş.",
  alternates: { canonical: "/" },
};

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
  const memberCount = await getMemberCount();

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12">
        {/* Pitch — crawlable identity line + honest scale */}
        <section className="text-center space-y-4 pt-2 font-mono">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">
            <MasterpieceLaurelIcon size={13} className="text-[#F59E0B]" />
            <span>KURUCU ÜYELER DÖNEMİ</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-[#FAFAFA] font-sans leading-tight max-w-3xl mx-auto">
            Aynı filmlerde ağlayıp, aynı sahnelerde ürperdiğin{" "}
            <span className="text-[#EF4444]">izdaşını</span> bul.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Sinema DNA&apos;nı çıkar; film, dizi ve anime frekansın sana
            eşleşsin.
            {typeof memberCount === "number" &&
              ` Şu an ${memberCount} sinefil frekansta.`}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-emerald-600/40 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            <span>İZDAŞ GÜVENCESİ: günlük istek sınırı • radarda gizlenme hakkı • korumalı sohbet</span>
          </div>
        </section>

        {/* Liquidity-governed deck */}
        <Suspense
          fallback={
            <div className="py-16 text-center font-mono text-xs font-black uppercase text-neutral-500 tracking-widest">
              PERDE AÇILIYOR...
            </div>
          }
        >
          <HomeDeck />
        </Suspense>

        {/* Continuity anchors */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono pb-4">
          <Link
            href="/kesif"
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              KEŞİF →
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Haftanın başyapıtı ve kulübün puanladığı 2000+ başyapıtlık
              katalog.
            </p>
          </Link>
          <Link
            href="/matches"
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              İZDAŞ RADARI →
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Filtrelerle tara, uyum yüzdesini gör, eşleş ve sohbete açıl.
            </p>
          </Link>
          <Link
            href="/diary"
            className="group p-5 bg-[#171717] border-2 border-[#404040] hover:border-[#EF4444] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#EF4444] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <h3 className="text-sm font-black uppercase text-[#FAFAFA] group-hover:text-[#EF4444] transition-colors">
              GÜNLÜK →
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              İzlediklerin, puanların ve topluluğun daktilo notları.
            </p>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
