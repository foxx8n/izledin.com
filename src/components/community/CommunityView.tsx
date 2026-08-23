'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  EyeOff, 
  ShieldAlert, 
  ArrowLeft,
  Copy,
  Check,
  BookOpen,
  Compass,
  Film,
  Award,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  MasterpieceLaurelIcon, 
  CinemaStarIcon, 
  CinemaVerifiedSeal, 
  CinemaCheckIcon,
  CinemaChatIcon,
  CinemaFrequencyIcon,
  FilmReelIcon,
  FilmStripIcon
} from '@/components/icons/CinemaIcons';

export function CommunityView() {
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const rules = [
    {
      id: 'kural-01',
      number: '01',
      title: 'SPOILER KORUMASI (KUTSAL KURAL)',
      subtitle: 'Seyir Zevkini ve Keşif Heyecanını Korumak',
      icon: EyeOff,
      summary: 'Sürpriz bozan gelişmeler, final açıklamaları veya kilit olay örgülerini spoiler uyarısı olmadan paylaşmak kesinlikle yasaktır.',
      do: 'İnceleme metninizin başına [SPOILER İÇERİR] uyarısı koyun veya sürpriz bozan detayları gizleyin.',
      dont: 'Başlıkta veya ilk cümlede filmin sonunu ya da dönüm noktalarını ifşa etmeyin.',
    },
    {
      id: 'kural-02',
      number: '02',
      title: 'SAYGILI & NİTELİKLİ SİNEMA TARTIŞMASI',
      subtitle: 'Fikir Çeşitliliği ve Estetik Diyalog',
      icon: CinemaChatIcon,
      summary: 'Sinema bir zevkler ve bakış açıları mozaiğidir. Sanat sineması da gişe filmi de bu kulübün meşru ve değerli bir parçasıdır.',
      do: 'Farklı görüşteki sinefillerin zevklerine saygı duyun; argümanlarınızı film dili, kurgu ve estetik üzerinden tartışın.',
      dont: 'Bir yapımı beğendiği ya da beğenmediği için diğer üyelere hakaret etmeyin, küçümseyici veya saldırgan tavır takınmayın.',
    },
    {
      id: 'kural-03',
      number: '03',
      title: 'OTANTİK & ÖZGÜN DAKTİLO İNCELEMELERİ',
      subtitle: 'Kişisel Deneyim ve Samimi Fanzin Ruhu',
      icon: FilmStripIcon,
      summary: 'Kulübün zenginliği üyelerin gerçek duygu ve düşünceleridir. Yapay zeka ile üretilen spam metinlere ve intihale yer yoktur.',
      do: 'Kendi samimi izleme deneyiminizi, hislerinizi ve şahsi vizyonunuzu 35mm daktilo günlüğüne dökün.',
      dont: 'Başka platformlardan çalıntı incelemeler kopyalamayın veya yapay zeka tarafından yazılmış boş bot metinleri paylaşmayın.',
    },
    {
      id: 'kural-04',
      number: '04',
      title: 'İZDAŞLAR & GÜVENLİ SİNEFİL İLETİŞİMİ',
      subtitle: 'Ortak Sinema DNA’sı ve Sağlıklı Arkadaşlık',
      icon: CinemaFrequencyIcon,
      summary: 'İzdaş eşleşmeleri, ortak sinema zevklerini paylaşmak ve saygılı bir sinema arkadaşı edinmek içindir.',
      do: 'Eşleştiğiniz sinemaseverlerle film önerileri paylaşın, vizyon buluşmaları planlayın ve seviyeli sohbetler kurun.',
      dont: 'Sohbetlerde taciz, istenmeyen reklam, ticari spam veya rahatsız edici mesajlar göndermeyin.',
    },
    {
      id: 'kural-05',
      number: '05',
      title: 'PUANLAMA VE SIRALAMA DÜRÜSTLÜĞÜ',
      subtitle: 'Adil Kanon ve Zevk Uyumu Şeffaflığı',
      icon: CinemaStarIcon,
      summary: 'Puanlama sistemi filmlerin ve üyelerin zevk uyumunu hesaplayan temel sinir ağıdır.',
      do: 'Filmleri izledikten sonra adil, özenli ve kendi şahsi kanonunuza uygun şekilde 1-10 arası puanlayın.',
      dont: 'İnceleme bombardımanı (review-bombing), organize linç veya sahte hesaplarla puan manipülasyonu yapmayın.',
    },
  ];

  const handleCopyRuleLink = (ruleId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/topluluk#${ruleId}`;
      navigator.clipboard.writeText(url);
      setCopiedRuleId(ruleId);
      setTimeout(() => setCopiedRuleId(null), 2500);
    }
  };

  return (
    <div className="space-y-10 font-mono">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Sayfa yolu" className="flex items-center gap-2 text-xs  text-[#A3A3A3]">
        <Link 
          href="/" 
          className="min-h-[44px] inline-flex items-center gap-1.5  hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>KEŞFET (ANA SAYFA)</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className=" text-[#FAFAFA] font-black" aria-current="page">
          TOPLULUK KURALLARI
        </span>
      </nav>

      {/* Page Header Marquee */}
      <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8  shadow-[6px_6px_0px_#000000] space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
            <MasterpieceLaurelIcon size={13} className="text-white" />
            <span>SİNEFİL KULÜP ETİĞİ</span>
          </span>
          <span className="text-xs text-[#A3A3A3] uppercase tracking-wider">
            EST. &apos;26 • BAĞIMSIZ SİNEMA KULÜBÜ KANUNLARI
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-sans">
          TOPLULUK KURALLARI
        </h1>

        <p className="text-xs sm:text-sm text-[#D4D4D4] font-sans leading-relaxed max-w-2xl">
          izledin.com, sinemayı seven insanların bir araya gelip samimiyetle tartıştığı bağımsız bir salondur. Bu salonun huzurunu, kalitesini ve derinliğini korumak için 5 altın kuralımız geçerlidir:
        </p>
      </header>

      {/* Quick-Jump Anchor Bar */}
      <div className=" bg-[#171717] border-2  border-[#404040] p-3 sm:p-4  shadow-[4px_4px_0px_#000000] flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-xs font-black text-[#737373] uppercase shrink-0 mr-1">
          HIZLI GEÇİŞ:
        </span>
        {rules.map((r) => (
          <a
            key={r.id}
            href={`#${r.id}`}
            className="px-3 py-2 min-h-[44px]  bg-neutral-800   hover:bg-[#EF4444] hover:text-[#0A0A0A] border  border-[#404040] text-xs font-black uppercase whitespace-nowrap transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>#{r.number}</span>
            <span className="hidden sm:inline">{r.title.split(' ')[0]}</span>
          </a>
        ))}
      </div>

      {/* 5 Rules Ordered List */}
      <ol className="space-y-6 list-none p-0 m-0">
        {rules.map((rule) => {
          const Icon = rule.icon;
          const isCopied = copiedRuleId === rule.id;

          return (
            <li 
              key={rule.id}
              id={rule.id}
              className="scroll-mt-24  bg-[#171717]  text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6  shadow-[6px_6px_0px_#000000] space-y-4 relative"
            >
              {/* Header Strip */}
              <div className="flex items-start justify-between gap-4 border-b-2  border-[#333333] pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#0A0A0A] text-[#FAFAFA] border-2  border-[#404040] flex items-center justify-center font-black text-sm shrink-0 shadow-[2px_2px_0px_#000000]">
                    {rule.number}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                      {rule.title}
                    </h2>
                    <p className="text-xs text-neutral-500 font-bold hidden sm:block">
                      {rule.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyRuleLink(rule.id)}
                    className="p-2 min-h-[44px] min-w-[44px]  bg-neutral-800  hover:bg-neutral-700 border  border-[#404040] text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Bu kuralın doğrudan bağlantısını kopyala"
                    aria-label={`Kural ${rule.number} bağlantısını kopyala`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                        <span className="text-[11px] text-[#10B981] font-bold hidden sm:inline">KOPYALANDI</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4  text-neutral-300" aria-hidden="true" />
                        <span className="text-[11px]  text-neutral-300 font-bold hidden sm:inline">PAYLAŞ</span>
                      </>
                    )}
                  </button>
                  <div className="w-10 h-10 flex items-center justify-center  text-[#EF4444]">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs sm:text-sm  text-neutral-300 leading-relaxed font-sans">
                {rule.summary}
              </p>

              {/* Do & Don't Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Doğru Yaklaşım */}
                <div className=" bg-neutral-900 border-2 border-emerald-600/40 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5  text-emerald-400 font-black uppercase text-xs">
                    <CinemaVerifiedSeal size={14} className=" text-emerald-400" />
                    <h3>DOĞRU YAKLAŞIM</h3>
                  </div>
                  <p className=" text-[#FAFAFA] font-sans text-xs leading-relaxed">
                    {rule.do}
                  </p>
                </div>

                {/* Yasaklanan Davranış */}
                <div className=" bg-neutral-900 border-2 border-[#DC2626]/40 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5  text-[#EF4444] font-black uppercase text-xs">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black">✕</span>
                    <h3>YASAKLANAN DAVRANIŞ</h3>
                  </div>
                  <p className=" text-[#FAFAFA] font-sans text-xs leading-relaxed">
                    {rule.dont}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Sinefil Manifestosu Taahhüdü (Closing Peak Charter) */}
      <section 
        aria-labelledby="manifesto-heading"
        className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8 shadow-[6px_6px_0px_#DC2626] space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <CinemaVerifiedSeal size={28} className="text-[#F59E0B]" />
          <div>
            <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest block">
              İZLEDİN.COM CHARTER
            </span>
            <h2 id="manifesto-heading" className="text-lg sm:text-xl font-black uppercase text-white font-sans">
              SİNEFİL MANİFESTOSU VE KULÜP TAAHHÜDÜ
            </h2>
          </div>
        </div>

        <blockquote className="border-l-3 border-[#DC2626] pl-4 text-xs sm:text-sm text-neutral-300 italic font-mono leading-relaxed">
          &ldquo;Sinema bir ışık ve gölge sanatıdır; bu salonda her fikir, her bakış ve her samimi sinefil saygıya değerdir. Bağımsız sinema kültürünü birlikte yaşatıyoruz.&rdquo;
        </blockquote>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Link
            href="/diary"
            className="px-6 py-3.5 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-white shadow-[3px_3px_0px_#ffffff] inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 text-center"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>35MM GÜNLÜĞÜ OKU</span>
          </Link>

          <Link
            href="/matches"
            className="px-6 py-3.5 min-h-[44px] bg-neutral-900 hover:bg-neutral-800 text-[#F59E0B] text-xs font-black uppercase tracking-wider border-2 border-[#404040] inline-flex items-center justify-center gap-2 cursor-pointer transition-colors text-center"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>İZDAŞ RADARINI KEŞFET</span>
          </Link>
        </div>
      </section>

      {/* Violations Notice Banner */}
      <section 
        aria-labelledby="violation-notice-heading"
        className=" bg-neutral-900  text-[#FAFAFA] border-2  border-[#404040] p-6 space-y-2  shadow-[4px_4px_0px_#000000]"
      >
        <div className="flex items-center gap-2  text-[#EF4444] font-black text-xs uppercase">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          <h2 id="violation-notice-heading">KURAL İHLALİ BİLDİRİMİ VE DENETİM</h2>
        </div>
        <p className="text-xs  text-neutral-400 font-sans leading-relaxed">
          Topluluk kurallarını çiğneyen, spoiler veren veya rahatsız edici içerik paylaşan bir üyeye rastlarsanız eşleşme sohbetiniz üzerinden moderasyona iletebilir veya{' '}
          <a
            href="mailto:topluluk@izledin.com?subject=Topluluk%20Kural%20%C4%B0hlali%20Bildirimi"
            className=" text-[#EF4444] underline font-bold"
          >
            topluluk@izledin.com
          </a>{' '}
          adresine iletebilirsiniz. Moderasyon ekibimiz 24 saat içinde inceleyip gerekli tedbirleri almaktadır.
        </p>
      </section>
    </div>
  );
}
