import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowLeft,
  CheckSquare,
  Globe,
  Activity,
  MailCheck
} from 'lucide-react';
import { DigestConsentButton } from '@/components/common/DigestConsentButton';
import { 
  CinemaVerifiedSeal 
} from '@/components/icons/CinemaIcons';

export const metadata: Metadata = {
  title: 'Açık Rıza Metni — izledin.com',
  description: 'izledin.com Kişisel Verilerin İşlenmesine İlişkin Açık Rıza Metni.',
  alternates: {
    canonical: 'https://www.izledin.com/acik-riza',
  },
};

export default function AcikRizaPage() {
  const sections = [
    { id: 'riza-01', title: '1. Yurt Dışına Aktarım' },
    { id: 'riza-02', title: '2. Profilleme & İzdaş' },
    { id: 'riza-03', title: '3. Ticari İletiler' },
  ];

  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150 font-mono">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Sayfa yolu" className="flex items-center gap-2 text-xs  text-neutral-400">
          <Link 
            href="/" 
            className="min-h-[44px] inline-flex items-center gap-1.5  hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>KEŞFET (ANA SAYFA)</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className=" text-[#FAFAFA] font-black" aria-current="page">
            AÇIK RIZA METNİ
          </span>
        </nav>

        {/* Page Header */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>AÇIK RIZA (EXPLICIT CONSENT) BEYANI</span>
            </span>
            <span className="text-xs text-neutral-400 uppercase">
              KVKK MADDE 5/1 VE MADDE 9 KAPSAMINDA
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            AÇIK RIZA METNİ
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-2xl">
            İzledin Bilgi Teknolojileri (&ldquo;izledin.com&rdquo;) tarafından Aydınlatma Metni ile bilgilendirildim. Aşağıda belirtilen hususlarda kişisel verilerimin işlenmesine ve aktarılmasına özgür irademle açık rıza gösteriyorum.
          </p>
        </header>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed  text-neutral-200 font-sans">
          
          <div className="p-4  bg-[#171717] border-l-4 border-[#F59E0B]  text-neutral-300">
            Platforma üye olarak, aşağıdaki işlemlere elektronik ortamda <strong>kabul ve onay</strong> vermiş sayılırsınız. Dilediğiniz zaman profil ayarlarınızdan veri silme (unutulma) hakkınızı kullanarak rızanızı geri alabilirsiniz.
          </div>

          {/* Section 1 */}
          <section id="riza-01" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Globe className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                1. Yurt Dışına Veri Aktarımı
              </h2>
            </div>
            <p>
              izledin.com altyapısında sunulan hizmetlerin kesintisiz, güvenli ve global standartlarda sağlanabilmesi için bulut bilişim hizmetlerinden (örn. Vercel, Supabase) faydalanılmaktadır. Bu sebeple Kimlik, İletişim ve İşlem Güvenliği verilerimin, KVKK m. 9 kapsamında yeterli korumanın bulunduğu veya taahhüt edildiği yurt dışı merkezli güvenli bulut sunucularında barındırılmasına ve aktarılmasına açık rıza gösteriyorum.
            </p>
          </section>

          {/* Section 2 */}
          <section id="riza-02" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Activity className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                2. Profilleme ve Eşleştirme (İzdaş Algoritması)
              </h2>
            </div>
            <p>
              Platformdaki film puanlamalarımın, daktilo günlüğü yazılarımın ve favori listelerimin analiz edilerek sinema zevkime uygun içeriklerin önerilmesi ve diğer kullanıcılarla (İzdaş) algoritmik olarak eşleştirilmem (profilleme yapılması) amacıyla kişisel verilerimin KVKK m. 5/1 kapsamında işlenmesine açık rıza gösteriyorum.
            </p>
          </section>

          {/* Section 3 */}
          <section id="riza-03" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <MailCheck className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                3. Ticari Elektronik İleti Gönderimi
              </h2>
            </div>
            <p>
              6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat uyarınca; izledin.com tarafından sunulan yeni özellikler, bültenler, abonelik kampanyaları ve platform bilgilendirmeleri amacıyla tarafıma e-posta gönderilmesine açık rıza gösteriyorum.
            </p>
          </section>

        </div>

        {/* Official Consent Seal */}
        <section aria-label="Resmi Rıza Mührü" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#DC2626] text-center space-y-4">
          <div className="w-16 h-16 bg-[#DC2626] text-white mx-auto flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_#000000]">
            <CheckSquare size={32} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase font-sans tracking-tight">
              BEYAN VE ONAY
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              İŞBU METİN ÜYELİK KAYDI İLE BİRLİKTE ELEKTRONİK ORTAMDA ONAYLANIR
            </p>
          </div>
          {/* S15: persist the §3 e-posta consent into profiles.digest_opt_in */}
          <div className="pt-2 border-t-2 border-[#333333]">
            <DigestConsentButton />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
