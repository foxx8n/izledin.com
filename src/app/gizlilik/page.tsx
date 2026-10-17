import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Database, 
  Trash2, 
  ArrowLeft,
  Mail,
  FileText
} from 'lucide-react';
import { CinemaVerifiedSeal } from '@/components/icons/CinemaIcons';
import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Privacy Policy & Data Security — izledin.com',
      description: 'izledin.com 35mm cinema club personal data protection, privacy guidelines and data security protocol.',
      alternates: {
        canonical: 'https://www.izledin.com/privacy',
        languages: {
          en: 'https://www.izledin.com/privacy',
          tr: 'https://www.izledin.com/tr/gizlilik',
          'x-default': 'https://www.izledin.com/privacy',
        },
      },
    };
  }

  return {
    title: 'Gizlilik Politikası & KVKK — izledin.com',
    description: 'izledin.com 35mm sinema kulübü kişisel veri koruma, KVKK uyumu ve veri güvenliği protokolü.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/gizlilik',
      languages: {
        en: 'https://www.izledin.com/privacy',
        tr: 'https://www.izledin.com/tr/gizlilik',
        'x-default': 'https://www.izledin.com/privacy',
      },
    },
  };
}

export default async function PrivacyPage() {
  const { locale } = await getServerTranslation();
  const prefix = locale === 'tr' ? '/tr' : '';

  const sections = locale === 'en' ? [
    { id: 'bolum-01', title: '1. Data Controller' },
    { id: 'bolum-02', title: '2. Processed Data & Purposes' },
    { id: 'bolum-03', title: '3. Data Transfers & Security' },
    { id: 'bolum-04', title: '4. Legal Grounds & Retention' },
    { id: 'bolum-05', title: '5. Rights & Erasure' },
  ] : [
    { id: 'bolum-01', title: '1. Toplanan Veriler' },
    { id: 'bolum-02', title: '2. Kullanım Amacı' },
    { id: 'bolum-03', title: '3. 3. Taraflarla Paylaşım' },
    { id: 'bolum-04', title: '4. Unutulma Hakkı & Veri Silme' },
    { id: 'bolum-05', title: '5. Çerezler & İletişim' },
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
            {locale === 'en' ? 'PRIVACY POLICY & DATA SECURITY' : 'GİZLİLİK POLİTİKASI & KVKK'}
          </span>
        </nav>

        {/* Page Header Marquee */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4 border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? '35MM DATA SECURITY & PRIVACY CHARTER' : 'KVKK & 35MM VERİ GÜVENLİĞİ PROTOKOLÜ'}</span>
            </span>
            <span className="text-xs text-neutral-400 uppercase">
              {locale === 'en' ? 'EFFECTIVE: JANUARY 1, 2026 • OFFICIAL NOTICE' : 'YÜRÜRLÜK: 1 OCAK 2026 • RESMİ BİLDİRİM'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            {locale === 'en' ? 'PRIVACY POLICY' : 'GİZLİLİK POLİTİKASI'}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-2xl">
            {locale === 'en' 
              ? 'izledin.com treats cinephile members’ typewriter logs, ratings, and taste analytics with the utmost respect. Your personal data is never sold to commercial ad networks, brokers, or third parties.'
              : 'izledin.com (“Platform”), sinefil üyelerinin daktilo günlüğüne, puanlamalarına ve zevk verilerine en yüksek saygıyla yaklaşır. Verileriniz asla ticari reklam ağlarına satılmaz veya 3. şahıslara devredilmez.'}
          </p>
        </header>

        {/* Sticky Table of Contents Quick Jump Bar */}
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

        {/* Policy Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-neutral-200 font-sans">
          
          <div className="p-4 bg-[#0A0A0A] text-white font-mono text-xs border-l-4 border-[#DC2626]">
            <strong>{locale === 'en' ? 'PRELIMINARY DISCLOSURE:' : 'AYDINLATMA METNİ HAKKINDA ÖN BİLGİLENDİRME:'}</strong>{' '}
            {locale === 'en'
              ? 'Under global data protection standards and 6698 Turkish KVKK Law, izledin.com acts as data controller. This charter outlines how we collect, process, secure, and permanently erase your cinephile data upon request.'
              : '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) m. 10 uyarınca, veri sorumlusu sıfatıyla İzledin Bilgi Teknolojileri (“izledin.com” veya “Platform”) olarak; siz değerli kullanıcılarımızı kişisel verilerinizin toplanma yöntemi, işlenme amaçları, hukuki sebepleri ve haklarınız konusunda bilgilendirmek isteriz.'}
          </div>

          {/* Section 1 */}
          <section id="bolum-01" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <Database className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '1. Identity of the Data Controller' : '1. Veri Sorumlusunun Kimliği'}
              </h2>
            </div>
            <p>
              {locale === 'en'
                ? 'Your personal data shared across izledin.com is processed by izledin.com (“Platform”) as the data controller within the scope detailed in this policy.'
                : '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, izledin.com üzerinden paylaştığınız kişisel verileriniz; veri sorumlusu sıfatıyla izledin.com (“Şirket” veya “Platform”) tarafından aşağıda açıklanan kapsamda işlenebilecektir.'}
            </p>
          </section>

          {/* Section 2 */}
          <section id="bolum-02" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <Lock className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '2. Processed Personal Data and Purposes' : '2. İşlenen Kişisel Veriler ve İşlenme Amaçları'}
              </h2>
            </div>
            <p>{locale === 'en' ? 'The following categories of data are processed when using our platform:' : 'Platformumuzu kullanımınız kapsamında aşağıdaki kişisel verileriniz toplanmaktadır:'}</p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li><strong>{locale === 'en' ? 'Identity & Contact:' : 'Kimlik ve İletişim Verileri:'}</strong> {locale === 'en' ? 'Name, email, avatar — account creation occurs solely via Google OAuth with your consent.' : 'Ad, soyad, e-posta adresi, kullanıcı adı — üyelik kaydı yalnızca Google hesabıyla (OAuth) yapılır ve bu bilgiler onayınızla Google hesabınızdan alınır.'}</li>
              <li><strong>{locale === 'en' ? 'Security & Access Logs:' : 'İşlem Güvenliği Verileri:'}</strong> {locale === 'en' ? 'IP address, browser user-agent, session timestamps for fraud prevention and system security.' : 'IP adresi, tarayıcı bilgileri, sisteme giriş-çıkış saatleri.'}</li>
              <li><strong>{locale === 'en' ? 'Cinema DNA & Usage:' : 'Kullanım ve Profilleme Verileri:'}</strong> {locale === 'en' ? 'Logged movies, ratings, typewriter notes, favorite genres, and Movie Mate taste vectors.' : 'Platform üzerinde izlenen, puanlanan filmler, yapılan yorumlar, favori film listeleri, eşleşme (“İzdaş”) sistemi kullanıcı tercihleri.'}</li>
              <li><strong>{locale === 'en' ? 'Age Verification:' : 'Doğum Tarihi ve Yaş:'}</strong> {locale === 'en' ? 'Birth date is stored strictly to verify 18+ eligibility and is never shown to other members.' : 'Doğum tarihiniz yalnızca 18 yaş şartı doğrulaması amacıyla saklanır ve diğer üyelere gösterilmez.'}</li>
              <li><strong>{locale === 'en' ? 'Protected Chat:' : 'Eşleşme Sohbet İçeriği:'}</strong> {locale === 'en' ? 'Direct messages remain strictly confidential between matched members.' : 'Eşleştiğiniz üyelerle kurduğunuz sohbet mesajları yalnızca o eşleşmenin tarafları arasında kalır.'}</li>
              <li><strong>{locale === 'en' ? 'Zero Financial Data:' : 'Finansal Veri İşlenmez:'}</strong> {locale === 'en' ? 'The platform does not collect credit cards, bank details or payment information.' : 'Platform üzerinden kredi kartı veya fatura bilgisi gibi hiçbir finansal veri toplanmaz ve işlenmez.'}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="bolum-03" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <EyeOff className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '3. Data Transfers and Storage' : '3. İşlenen Kişisel Verilerin Aktarımı'}
              </h2>
            </div>
            <p>
              {locale === 'en'
                ? 'Your data is hosted with enterprise infrastructure partners (Supabase, Vercel) under encrypted protocols. We never sell, lease, or monetize your cinephile profile with third-party ad brokers.'
                : 'Toplanan kişisel verileriniz; KVKK’nın 8. ve 9. maddelerinde belirtilen şartlar dahilinde güvenli altyapı tedarikçileriyle (Supabase, Vercel) şifrelenmiş olarak tutulur. Verileriniz kesinlikle ticari reklam ağlarına satılmaz.'}
            </p>
          </section>

          {/* Section 4 */}
          <section id="bolum-04" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <Trash2 className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '4. Data Collection Methods & Legal Basis' : '4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi'}
              </h2>
            </div>
            <p>
              {locale === 'en'
                ? 'Data is collected digitally via website interactions and authentication flows. It is processed on the basis of contract fulfillment, legitimate cinephile platform interests, and explicit consent for AI matching vectors.'
                : 'Kişisel verileriniz elektronik ortamda otomatik yollarla toplanmaktadır. Sözleşmenin ifası, yasal yükümlülükler ve açık rızanız doğrultusunda işlenmektedir.'}
            </p>
          </section>

          {/* Section 5 */}
          <section id="bolum-05" className="bg-[#141414] border-2 border-[#333333] p-6 shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2 border-[#333333] pb-2 font-mono">
              <Mail className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase text-[#FAFAFA] font-sans tracking-tight">
                {locale === 'en' ? '5. Your Rights & Right to be Forgotten' : '5. İlgili Kişinin Hakları (KVKK Madde 11)'}
              </h2>
            </div>
            <p>
              {locale === 'en'
                ? 'You have the full right to access, rectify, export, or permanently erase (Right to be Forgotten) all your personal data, typewriter notes, and ratings.'
                : 'KVKK Madde 11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme ve silinmesini (Unutulma Hakkı) talep etme hakkına sahipsiniz.'}
            </p>
            <div className="pt-2">
              <p className="font-bold text-[#FAFAFA]">
                {locale === 'en' ? 'Contact Data Protection Desk:' : 'Veri Sorumlusuna Başvuru:'}
              </p>
              <p className="text-neutral-400 font-mono text-xs">
                {locale === 'en' ? 'Direct requests to ' : 'Haklarınıza ilişkin taleplerinizi '}
                <a href="mailto:gizlilik@izledin.com" className="text-[#EF4444] underline">gizlilik@izledin.com</a>
                {locale === 'en' ? '. All requests are resolved free of charge within 30 days.' : ' adresi üzerinden iletebilirsiniz. En geç 30 gün içinde sonuçlandırılır.'}
              </p>
            </div>
          </section>
        </div>

        {/* Official Seal of Compliance */}
        <section aria-label="Official Seal" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4 border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#DC2626] text-center space-y-4">
          <div className="w-16 h-16 bg-[#DC2626] text-white mx-auto flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_#000000]">
            <CinemaVerifiedSeal size={32} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase font-sans tracking-tight">
              {locale === 'en' ? 'OFFICIAL DATA PRIVACY CHARTER' : 'KVKK ONAYLI AYDINLATMA METNİ'}
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              {locale === 'en' ? 'EFFECTIVE: 2026 • IZLEDIN INFORMATION TECHNOLOGIES' : 'YÜRÜRLÜK TARİHİ: 2026 • İZLEDİN BİLGİ TEKNOLOJİLERİ'}
            </p>
          </div>
          <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
            {locale === 'en'
              ? 'This charter is prepared in full compliance with international privacy protocols and Turkish Law No. 6698 on Protection of Personal Data.'
              : 'İşbu aydınlatma metni, 6698 Sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuata tam uyum çerçevesinde hazırlanmıştır.'}
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
