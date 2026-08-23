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
  Scale,
  ShieldCheck
} from 'lucide-react';
import { 
  MasterpieceLaurelIcon, 
  CinemaVerifiedSeal 
} from '@/components/icons/CinemaIcons';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları & Üyelik Sözleşmesi — izledin.com',
  description: 'izledin.com hizmet şartları, topluluk kuralları, fikri mülkiyet ve kulüp kullanım sözleşmesi.',
  alternates: {
    canonical: 'https://www.izledin.com/kullanim',
  },
};

export default function TermsPage() {
  const sections = [
    { id: 'kural-01', title: '1. Hizmet Kapsamı' },
    { id: 'kural-02', title: '2. Üyelik & Yaş Kriteri' },
    { id: 'kural-03', title: '3. Fikri Mülkiyet & İncelemeler' },
    { id: 'kural-04', title: '4. İzledin+ Kulüp & İptal' },
    { id: 'kural-05', title: '5. Sorumluluk Reddi' },
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
            KULLANIM KOŞULLARI & KANON
          </span>
        </nav>

        {/* Page Header Marquee */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <Scale className="w-3.5 h-3.5" />
              <span>HİZMET & SİNEFİL KULLANIM SÖZLEŞMESİ</span>
            </span>
            <span className="text-xs text-neutral-400 uppercase">
              SON GÜNCELLEME: 2026 • RESMİ METİN
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            KULLANIM KOŞULLARI
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-2xl">
            izledin.com web sitesini, mobil sürümlerini veya servislerini kullanarak bu sözleşmede belirtilen tüm kuralları, hak ve topluluk yükümlülüklerini kabul etmiş sayılırsınız.
          </p>
        </header>

        {/* Table of Contents Quick Jump Bar */}
        <nav aria-label="İçindekiler" className=" bg-[#171717] border-2  border-[#404040] p-4  shadow-[4px_4px_0px_#000000] space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase  text-[#FAFAFA]">
            <FileText className="w-3.5 h-3.5  text-[#EF4444]" />
            <span>İÇİNDEKİLER & HIZLI GEÇİŞ:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="px-3 py-2 min-h-[44px] inline-flex items-center  bg-[#0A0A0A]   hover:bg-[#EF4444] hover:text-black border  border-[#404040] text-xs font-bold transition-colors cursor-pointer"
              >
                {sec.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Terms Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed  text-neutral-200 font-sans">
          
          <div className="p-4 bg-[#0A0A0A] text-white font-mono text-xs border-l-4 border-[#DC2626]">
            <strong>SÖZLEŞMENİN ONAYLANMASI:</strong> Bu Kullanım Koşulları ve Üyelik Sözleşmesi (&ldquo;Sözleşme&rdquo;), izledin.com web sitesini ve hizmetlerini kullanan her Kullanıcı (&ldquo;Üye&rdquo;) ile İzledin Bilgi Teknolojileri (&ldquo;Platform&rdquo;) arasında, Üye&apos;nin elektronik ortamda onay vermesiyle yürürlüğe girer. Sitemizi kullanarak bu şartları kabul etmiş sayılırsınız.
          </div>

          {/* Section 1 */}
          <section id="kural-01" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Film className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                1. Taraflar ve Hizmetin Kapsamı
              </h2>
            </div>
            <p>
              İşbu Sözleşme, hizmet sağlayan İzledin Bilgi Teknolojileri ile platforma üye olan gerçek kişi arasında akdedilmiştir. 
            </p>
            <p>
              izledin.com, üyelerine izledikleri sinema eserlerini arşivleme, puanlama, inceleme (daktilo günlüğü) yazma ve algoritmik olarak benzer zevklere sahip diğer üyelerle (İzdaş) eşleşme imkanı sunan bir sosyal ağ hizmetidir.
            </p>
            <p>
              <strong>Yasal Sınırlandırma:</strong> Platform doğrudan veya dolaylı olarak telif hakkına tabi herhangi bir video içeriğini, filmi veya diziyi izinsiz barındırmaz, oynatmaz (streaming) veya indirilmesine (download) olanak sağlamaz. Platform sadece metin tabanlı veritabanı hizmeti sunar.
            </p>
          </section>

          {/* Section 2 */}
          <section id="kural-02" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <CheckCircle2 className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                2. Üyelik Şartları ve Kullanıcı Yükümlülükleri
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Platforma üye olmak ve sunulan eşleştirme (İzdaş) hizmetlerinden faydalanabilmek için kullanıcının <strong>18 yaşını doldurmuş olması</strong> zorunludur. Yanlış beyanlardan doğacak hukuki sorumluluk tamamen üyeye aittir.</li>
              <li>Üye, kayıt sırasında verdiği bilgilerin doğruluğunu taahhüt eder. Şifre güvenliğinden ve hesabın üçüncü şahıslarca kullanımından üye tek başına sorumludur.</li>
              <li>Üyeler, platformu Türkiye Cumhuriyeti yasalarına, genel ahlak kurallarına ve işbu sözleşmeye uygun kullanmakla yükümlüdür.</li>
              <li>Sisteme API veya otomasyon araçları (botlar, scraperlar vb.) ile izinsiz veri girişi veya veri çekimi yapılması kesinlikle yasaktır ve yasal işlem sebebidir.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="kural-03" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <FileText className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                3. Fikri Mülkiyet ve İçerik Politikası
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Platformun tasarımı, yazılım kodları, veritabanı, İzdaş eşleştirme algoritması ve marka hakları tamamen İzledin Bilgi Teknolojileri&apos;ne aittir.</li>
              <li>Üyelerin platformda oluşturduğu inceleme (daktilo yazıları) ve yorumların hukuki ve cezai sorumluluğu doğrudan üyeye aittir.</li>
              <li>Platformda 5651 Sayılı Kanun kapsamında yer alan <strong>Uyar-Kaldır</strong> mekanizması işletilir. Hakaret, tehdit, telif hakkı ihlali veya suç unsuru teşkil eden içerikler bildirim üzerine derhal kaldırılır.</li>
              <li>Üye, platforma eklediği içeriklerin izledin.com tarafından bedelsiz olarak ve süre sınırı olmaksızın platform içerisinde kullanılmasına (örneğin ana sayfada öne çıkarılmasına) izin vermiş sayılır.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="kural-04" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Ticket className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                4. İzledin+ Kulüp Üyeliği ve Üyeliğin Sonlandırılması
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Daktilo günlüğü, puanlama, İzdaş keşif radarı ve mesajlaşma dahil çekirdek deneyim herkese ücretsizdir. Ayrıcalık sunan &ldquo;İzledin+&rdquo; ise ücretli bir abonelik değil, kulüp üyeliğidir.</li>
              <li>Kulüp üyeliği satışa açık değildir; davetiye ve platforma katkı usulüyle yönetim tarafından atanır. Platform üzerinden hiçbir ödeme tahsil edilmez; üyeliğin otomatik yenilenmesi, yenileme iptali veya iade süreci söz konusu değildir.</li>
              <li>Kredi kartı, banka hesabı veya benzeri hiçbir finansal veri toplanmaz ve işlenmez.</li>
              <li>Üyelik, üyenin talebi üzerine iletişim formu veya gizlilik@izledin.com adresi üzerinden yönetimle iletişim kurularak sonlandırılabilir; talep en kısa sürede sonuçlandırılır.</li>
              <li>Üyelik sonlandırıldığında kulüp ayrıcalıkları kaldırılır; üyenin hesabı, daktilo günlüğü ve içeriği etkilenmez.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="kural-05" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <AlertCircle className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                5. Sorumluluk Sınırları ve Uyuşmazlık Çözümü
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Platform, teknik bakım, altyapı güncellemeleri veya mücbir sebeplerden ötürü hizmetin geçici olarak durdurulmasından sorumlu tutulamaz.</li>
              <li>Kullanıcılar arası eşleşme (İzdaş) sonuçlarının doğruluğu, üyelerin paylaştığı sinema zevki verilerine dayanmakta olup, bu eşleşmelerin gerçek hayattaki uyumuna dair platform hiçbir garanti veya taahhütte bulunmaz.</li>
              <li>İşbu Sözleşme&apos;nin uygulanmasından doğabilecek her türlü uyuşmazlığın çözümünde Türkiye Cumhuriyeti kanunları uygulanacak olup, İstanbul Merkez Mahkemeleri ve İcra Daireleri yetkilidir.</li>
            </ul>
          </section>
        </div>

        {/* Official Legal Charter Seal */}
        <section aria-label="Resmi Yasal Taahhüt Mührü" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#DC2626] text-center space-y-4">
          <div className="w-16 h-16 bg-[#DC2626] text-white mx-auto flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_#000000]">
            <Scale size={32} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase font-sans tracking-tight">
              RESMİ KULLANIM KOŞULLARI VE ÜYELİK SÖZLEŞMESİ
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              YÜRÜRLÜK: 2026 • İZLEDİN BİLGİ TEKNOLOJİLERİ
            </p>
          </div>
          <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
            Bu sözleşme, T.C. yasal mevzuatlarına ve 6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun hükümlerine uygun olarak düzenlenmiştir.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
