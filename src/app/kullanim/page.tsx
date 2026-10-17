import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Film,
  Ticket,
  ArrowLeft,
  Scale
} from 'lucide-react';
import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Terms of Service & Cinephile Charter — izledin.com',
      description: 'izledin.com terms of service, community laws, intellectual property rights, and cinephile club usage charter.',
      alternates: {
        canonical: 'https://www.izledin.com/terms',
        languages: {
          en: 'https://www.izledin.com/terms',
          tr: 'https://www.izledin.com/tr/kullanim',
          'x-default': 'https://www.izledin.com/terms',
        },
      },
    };
  }

  return {
    title: 'Kullanım Koşulları & Üyelik Sözleşmesi — izledin.com',
    description: 'izledin.com hizmet şartları, topluluk kuralları, fikri mülkiyet ve kulüp kullanım sözleşmesi.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/kullanim',
      languages: {
        en: 'https://www.izledin.com/terms',
        tr: 'https://www.izledin.com/tr/kullanim',
        'x-default': 'https://www.izledin.com/terms',
      },
    },
  };
}

export default async function TermsPage() {
  const { locale } = await getServerTranslation();
  const prefix = locale === 'tr' ? '/tr' : '';

  const sections = locale === 'en' ? [
    { id: 'kural-01', title: '1. Scope of Service' },
    { id: 'kural-02', title: '2. Membership & 18+ Criteria' },
    { id: 'kural-03', title: '3. Intellectual Property' },
    { id: 'kural-04', title: '4. Izledin+ Club Privileges' },
    { id: 'kural-05', title: '5. Limitation of Liability' },
  ] : [
    { id: 'kural-01', title: '1. Hizmet Kapsamı' },
    { id: 'kural-02', title: '2. Üyelik & Yaş Kriteri' },
    { id: 'kural-03', title: '3. Fikri Mülkiyet & İncelemeler' },
    { id: 'kural-04', title: '4. İzledin+ Kulüp & İptal' },
    { id: 'kural-05', title: '5. Sorumluluk Reddi' },
  ];

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150 font-mono">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-neutral-400">
          <Link 
            href={`${prefix}/`} 
            className="min-h-[44px] inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{locale === 'en' ? 'DISCOVER (HOME)' : 'KEŞFET (ANA SAYFA)'}</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#FAFAFA] font-black" aria-current="page">
            {locale === 'en' ? 'TERMS OF SERVICE & CANON' : 'KULLANIM KOŞULLARI & KANON'}
          </span>
        </nav>

        {/* Page Header Marquee */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4 border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <Scale className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? 'SERVICE & CINEPHILE MEMBERSHIP AGREEMENT' : 'HİZMET & SİNEFİL KULLANIM SÖZLEŞMESİ'}</span>
            </span>
            <span className="text-xs text-neutral-400 uppercase">
              {locale === 'en' ? 'LAST UPDATED: 2026 • OFFICIAL DOCUMENT' : 'SON GÜNCELLEME: 2026 • RESMİ METİN'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            {locale === 'en' ? 'TERMS OF SERVICE' : 'KULLANIM KOŞULLARI'}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-2xl">
            {locale === 'en'
              ? 'By accessing and using izledin.com, its mobile views, and services, you acknowledge and agree to comply with all guidelines, rights, and community standards set forth in this agreement.'
              : 'izledin.com web sitesini, mobil sürümlerini veya servislerini kullanarak bu sözleşmede belirtilen tüm kuralları, hak ve topluluk yükümlülüklerini kabul etmiş sayılırsınız.'}
          </p>
        </header>

        {/* Table of Contents Quick Jump Bar */}
        <nav aria-label="Table of Contents" className="bg-[#171717] border-2 border-[#404040] p-4 shadow-[4px_4px_0px_#000000] space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#FAFAFA]">
            <FileText className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>{locale === 'en' ? 'TABLE OF CONTENTS & QUICK JUMP:' : 'İÇİNDEKİLER & HIZLI GEÇİŞ:'}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="px-3 py-2 min-h-[44px] inline-flex items-center bg-[#0A0A0A] hover:bg-[#EF4444] hover:text-black border border-[#404040] text-xs font-bold transition-colors cursor-pointer"
              >
                {sec.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Terms Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-neutral-200 font-sans">
          
          <div className="p-4 bg-[#0A0A0A] text-white font-mono text-xs border-l-4 border-[#DC2626]">
            <strong>{locale === 'en' ? 'AGREEMENT ACCEPTANCE:' : 'SÖZLEŞMENİN ONAYLANMASI:'}</strong>{' '}
            {locale === 'en'
              ? 'This Terms of Service and Membership Agreement enters into effect upon your use of the platform. By creating an account or browsing the site, you express full agreement with these binding terms.'
              : 'Bu Kullanım Koşulları ve Üyelik Sözleşmesi (“Sözleşme”), izledin.com web sitesini ve hizmetlerini kullanan her Kullanıcı (“Üye”) ile İzledin Bilgi Teknolojileri (“Platform”) arasında, Üye’nin elektronik ortamda onay vermesiyle yürürlüğe girer. Sitemizi kullanarak bu şartları kabul etmiş sayılırsınız.'}
          </div>

          {/* Section 1 */}
          <section id="kural-01" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <Film className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '1. Scope of Service & Legal Bounds' : '1. Taraflar ve Hizmetin Kapsamı'}
              </h2>
            </div>
            <p>
              {locale === 'en'
                ? 'izledin.com is a specialized cinephile social platform that provides tools to curate personal 35mm typewriter diaries, rate movies, and connect with movie mates sharing mutual cinema taste.'
                : 'izledin.com, üyelerine izledikleri sinema eserlerini arşivleme, puanlama, inceleme (daktilo günlüğü) yazma ve algoritmik olarak benzer zevklere sahip diğer üyelerle (İzdaş) eşleşme imkanı sunan bir sosyal ağ hizmetidir.'}
            </p>
            <p>
              <strong>{locale === 'en' ? 'Strict Legal Limitation:' : 'Yasal Sınırlandırma:'}</strong>{' '}
              {locale === 'en'
                ? 'The platform does NOT host, stream, or facilitate downloading of copyrighted video content. izledin.com operates strictly as a text, rating, and metadata archival platform.'
                : 'Platform doğrudan veya dolaylı olarak telif hakkına tabi herhangi bir video içeriğini, filmi veya diziyi izinsiz barındırmaz, oynatmaz (streaming) veya indirilmesine (download) olanak sağlamaz. Platform sadece metin tabanlı veritabanı hizmeti sunar.'}
            </p>
          </section>

          {/* Section 2 */}
          <section id="kural-02" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '2. Membership Terms & 18+ Age Requirement' : '2. Üyelik Şartları ve Kullanıcı Yükümlülükleri'}
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>{locale === 'en' ? 'To join and access the Movie Mate radar, users must be at least 18 years of age.' : 'Platforma üye olmak ve sunulan eşleştirme (İzdaş) hizmetlerinden faydalanabilmek için kullanıcının 18 yaşını doldurmuş olması zorunludur.'}</li>
              <li>{locale === 'en' ? 'Members agree to provide accurate information during Google authentication and protect account security.' : 'Üye, kayıt sırasında verdiği bilgilerin doğruluğunu taahhüt eder. Şifre güvenliğinden üye tek başına sorumludur.'}</li>
              <li>{locale === 'en' ? 'Automated scraping, harvesting, bot indexing or malicious API abuse is strictly forbidden.' : 'Sisteme API veya otomasyon araçları (botlar, scraperlar vb.) ile izinsiz veri girişi veya veri çekimi yapılması kesinlikle yasaktır.'}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="kural-03" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <FileText className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '3. Intellectual Property and Content Policy' : '3. Fikri Mülkiyet ve İçerik Politikası'}
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>{locale === 'en' ? 'Platform branding, visual system, algorithms, and code belong entirely to izledin.com.' : 'Platformun tasarımı, yazılım kodları, veritabanı, İzdaş eşleştirme algoritması ve marka hakları tamamen İzledin Bilgi Teknolojileri’ne aittir.'}</li>
              <li>{locale === 'en' ? 'Members retain authorship of their reviews while granting izledin.com a royalty-free license to display them.' : 'Üyelerin platformda oluşturduğu inceleme (daktilo yazıları) ve yorumların hukuki sorumluluğu doğrudan üyeye aittir.'}</li>
              <li>{locale === 'en' ? 'We operate a strict Notice-and-Takedown policy for copyright, harassment, or unlawful content.' : 'Platformda 5651 Sayılı Kanun kapsamında yer alan Uyar-Kaldır mekanizması işletilir.'}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="kural-04" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <Ticket className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '4. Izledin+ Club Privileges & Cancellation' : '4. İzledin+ Kulüp Üyeliği ve Üyeliğin Sonlandırılması'}
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>{locale === 'en' ? 'The core experience (typewriter diary, ratings, radar, protected chat) is free for all cinephiles. Izledin+ is an honorary club membership awarded by invitation and community contribution.' : 'Daktilo günlüğü, puanlama, İzdaş keşif radarı ve mesajlaşma dahil çekirdek deneyim herkese ücretsizdir. “İzledin+” ücretli bir abonelik değil, kulüp üyeliğidir.'}</li>
              <li>{locale === 'en' ? 'Zero payment transactions are processed. No recurring credit card charges or automatic renewals exist.' : 'Platform üzerinden hiçbir ödeme tahsil edilmez; üyeliğin otomatik yenilenmesi veya iade süreci söz konusu değildir.'}</li>
              <li>{locale === 'en' ? 'Members can request closure of their account or removal of club perks at any time via contact or privacy@izledin.com.' : 'Üyelik, üyenin talebi üzerine iletişim formu veya gizlilik@izledin.com üzerinden sonlandırılabilir.'}</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="kural-05" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <AlertCircle className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '5. Liability Boundaries and Dispute Resolution' : '5. Sorumluluk Sınırları ve Uyuşmazlık Çözümü'}
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>{locale === 'en' ? 'Compatibility vectors reflect mathematical similarities in cinema taste; we make no guarantees regarding interpersonal relationships.' : 'İzdaş sonuçlarının doğruluğu sinema zevki verilerine dayanmakta olup platform gerçek hayattaki uyuma dair taahhütte bulunmaz.'}</li>
              <li>{locale === 'en' ? 'Any legal disputes shall be governed by the laws of the Republic of Turkey with Istanbul Courts having jurisdiction.' : 'İşbu Sözleşme’nin uygulanmasından doğabilecek her türlü uyuşmazlığın çözümünde Türkiye Cumhuriyeti kanunları uygulanacaktır.'}</li>
            </ul>
          </section>
        </div>

        {/* Official Legal Charter Seal */}
        <section aria-label="Official Seal" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4 border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#DC2626] text-center space-y-4">
          <div className="w-16 h-16 bg-[#DC2626] text-white mx-auto flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_#000000]">
            <Scale size={32} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase font-sans tracking-tight">
              {locale === 'en' ? 'OFFICIAL CINEPHILE TERMS OF SERVICE' : 'RESMİ KULLANIM KOŞULLARI VE ÜYELİK SÖZLEŞMESİ'}
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              {locale === 'en' ? 'EFFECTIVE: 2026 • IZLEDIN INFORMATION TECHNOLOGIES' : 'YÜRÜRLÜK: 2026 • İZLEDİN BİLGİ TEKNOLOJİLERİ'}
            </p>
          </div>
          <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
            {locale === 'en'
              ? 'This agreement regulates the terms of participation in our independent 35mm cinema and movie mate network.'
              : 'Bu sözleşme, T.C. yasal mevzuatlarına ve 6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun hükümlerine uygun olarak düzenlenmiştir.'}
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
