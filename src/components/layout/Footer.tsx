"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getRandomQuote, CinemaQuote } from "@/data/quotes";
import { Shuffle, Copy, Check } from "lucide-react";
import {
  CinemaLogoMark,
  ClapperboardIcon,
} from "@/components/icons/CinemaIcons";

export function Footer() {
  const [easterQuote, setEasterQuote] = useState<CinemaQuote | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRollQuote = () => {
    setEasterQuote(getRandomQuote());
    setCopied(false);
  };

  const handleCopyQuote = () => {
    if (!easterQuote) return;
    const textToCopy = `"${easterQuote.quote}" — ${easterQuote.film} (${easterQuote.year})${easterQuote.character ? ` [${easterQuote.character}]` : ""}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full  bg-[#0A0A0A]  text-[#FAFAFA] border-t-2  border-[#262626] mt-12 font-mono transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Main Compact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Pane (Span 6): Brand + Quote Ticker Combined */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="flex items-center gap-2.5 group inline-block"
              >
                <CinemaLogoMark
                  size={24}
                  className="transition-transform group-hover:rotate-6 group-hover:scale-105"
                />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight  text-[#FAFAFA] group-hover:text-[#DC2626] transition-colors leading-none uppercase font-sans">
                    IZLEDIN<span className="text-[#DC2626]">.COM</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-widest  text-[#A3A3A3] hidden sm:inline">
                    // SİNEMA KULÜBÜ
                  </span>
                </div>
              </Link>
            </div>
            {/* Compact Cinephile Quote Strip */}
            <div className=" bg-[#171717] border  border-[#333333] p-3  shadow-[2px_2px_0px_#000000]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {easterQuote ? (
                    <div className="space-y-2">
                      <blockquote className="text-xs sm:text-sm  text-[#FAFAFA] italic font-sans leading-snug border-l-2 border-[#DC2626] pl-2.5">
                        &ldquo;{easterQuote.quote}&rdquo;
                      </blockquote>
                      <div className="flex items-center gap-1.5 text-[11px]  text-[#A3A3A3] font-mono flex-wrap">
                        <span className="font-black  text-[#EF4444]">
                          {easterQuote.film}
                        </span>
                        <span className="text-[#737373]">
                          ({easterQuote.year})
                        </span>
                        {easterQuote.character && (
                          <span className="text-[#737373] hidden sm:inline">
                            — {easterQuote.character}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2  text-[#A3A3A3] text-[11px] min-w-0 h-[32px]">
                      <ClapperboardIcon
                        size={14}
                        className="text-[#DC2626] shrink-0"
                      />
                      <span className="truncate">
                        &ldquo;Bütün o anlar zamanın içinde kaybolup
                        gidecek...&rdquo;
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {easterQuote && (
                    <button
                      type="button"
                      onClick={handleCopyQuote}
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center hover:text-[#DC2626] transition-colors cursor-pointer"
                      title="Repliği Panoya Kopyala"
                      aria-label="Repliği Panoya Kopyala"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRollQuote}
                    aria-label="Yeni Replik Çek"
                    className="px-2.5 py-1 min-h-[32px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span className="hidden sm:inline">Replik Çek</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane (Span 6): 3 Tight Compact Link Columns */}
          <div className="lg:col-span-6 grid grid-cols-3 gap-3 sm:gap-4 pt-1 lg:pt-0">
            {/* Col 1: Keşif */}
            <div className="space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-black uppercase  text-[#FAFAFA] tracking-wider block border-b  border-[#333333] pb-1">
                KEŞİF
              </span>
              <ul className="space-y-0.5 text-xs  text-[#D4D4D4]">
                <li>
                  <Link
                    href="/"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    Vizyondakiler
                  </Link>
                </li>
                <li>
                  <Link
                    href="/matches"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    İzdaşlar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/diary"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    İzleme Günlüğü
                  </Link>
                </li>
                <li>
                  <Link
                    href="/upcoming"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    Vizyon Takvimi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: Kulüp & Pass */}
            <div className="space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-black uppercase  text-[#FAFAFA] tracking-wider block border-b  border-[#333333] pb-1">
                KULÜP
              </span>
              <ul className="space-y-0.5 text-xs  text-[#D4D4D4]">
                <li>
                  <Link
                    href="/premium"
                    className=" text-[#FF5555] font-black hover:underline py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    İzledin+ Kulüp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    Sinema DNA
                  </Link>
                </li>
                <li>
                  <Link
                    href="/matches"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center"
                  >
                    İzdaş Radarı
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kurumsal & Yasal */}
            <div className="space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-black uppercase  text-[#FAFAFA] tracking-wider block border-b  border-[#333333] pb-1">
                YASAL
              </span>
              <ul className="space-y-0.5 text-xs  text-[#D4D4D4]">
                <li>
                  <Link
                    href="/gizlilik"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center truncate"
                  >
                    Gizlilik & KVKK
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kullanim"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center truncate"
                  >
                    Kullanım Şartları
                  </Link>
                </li>
                <li>
                  <Link
                    href="/topluluk"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center truncate"
                  >
                    Topluluk Kuralları
                  </Link>
                </li>
                <li>
                  <Link
                    href="/iletisim"
                    className=" hover:text-white transition-colors py-1 min-h-[32px] sm:min-h-[28px] flex items-center truncate"
                  >
                    İletişim & Destek
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compact Bottom Bar */}
        <div className="pt-3 border-t  border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]  text-[#A3A3A3]">
          <div className="flex items-center gap-2">
            <span className="font-bold  text-[#E5E5E5]">
              izledin.com © {new Date().getFullYear()}
            </span>
            <span>•</span>
            <span>Bağımsız Sinefil Platformu</span>
          </div>
          <div className="text-[10px]  text-[#A3A3A3]">
            Made for Cinephiles & Film Lovers
          </div>
        </div>
      </div>
    </footer>
  );
}
