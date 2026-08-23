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
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  MasterpieceLaurelIcon, 
  CinemaVerifiedSeal, 
  CinemaCheckIcon 
} from '@/components/icons/CinemaIcons';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası & KVKK — izledin.com',
  description: 'izledin.com 35mm sinema kulübü kişisel veri koruma, KVKK uyumu ve veri güvenliği protokolü.',
  alternates: {
    canonical: 'https://www.izledin.com/gizlilik',
  },
};

export default function PrivacyPage() {
  const sections = [
    { id: 'bolum-01', title: '1. Toplanan Veriler' },
    { id: 'bolum-02', title: '2. Kullanım Amacı' },
    { id: 'bolum-03', title: '3. 3. Taraflarla Paylaşım' },
    { id: 'bolum-04', title: '4. Unutulma Hakkı & Veri Silme' },
    { id: 'bolum-05', title: '5. Çerezler & İletişim' },
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
            GİZLİLİK POLİTİKASI & KVKK
          </span>
        </nav>

        {/* Page Header Marquee */}
        <header className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KVKK & 35MM VERİ GÜVENLİĞİ PROTOKOLÜ</span>
            </span>
            <span className="text-xs text-neutral-400 uppercase">
              YÜRÜRLÜK: 1 OCAK 2026 • RESMİ BİLDİRİM
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            GİZLİLİK POLİTİKASI
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-2xl">
            izledin.com (&ldquo;Platform&rdquo;), sinefil üyelerinin daktilo günlüğüne, puanlamalarına ve zevk verilerine en yüksek saygıyla yaklaşır. Verileriniz asla ticari reklam ağlarına satılmaz veya 3. şahıslara devredilmez.
          </p>
        </header>

        {/* Sticky Table of Contents Quick Jump Bar */}
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

        {/* Policy Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed  text-neutral-200 font-sans">
          
          <div className="p-4 bg-[#0A0A0A] text-white font-mono text-xs border-l-4 border-[#DC2626]">
            <strong>AYDINLATMA METNİ HAKKINDA ÖN BİLGİLENDİRME:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) m. 10 uyarınca, veri sorumlusu sıfatıyla İzledin Bilgi Teknolojileri (&ldquo;izledin.com&rdquo; veya &ldquo;Platform&rdquo;) olarak; siz değerli kullanıcılarımızı kişisel verilerinizin toplanma yöntemi, işlenme amaçları, hukuki sebepleri ve haklarınız konusunda bilgilendirmek isteriz.
          </div>

          {/* Section 1 */}
          <section id="bolum-01" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Database className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                1. Veri Sorumlusunun Kimliği
              </h2>
            </div>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, izledin.com üzerinden paylaştığınız kişisel verileriniz; veri sorumlusu sıfatıyla izledin.com (&ldquo;Şirket&rdquo; veya &ldquo;Platform&rdquo;) tarafından aşağıda açıklanan kapsamda işlenebilecektir.
            </p>
          </section>

          {/* Section 2 */}
          <section id="bolum-02" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Lock className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                2. İşlenen Kişisel Veriler ve İşlenme Amaçları
              </h2>
            </div>
            <p>Platformumuzu kullanımınız kapsamında aşağıdaki kişisel verileriniz toplanmaktadır:</p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li><strong>Kimlik ve İletişim Verileri:</strong> Ad, soyad, e-posta adresi, kullanıcı adı &mdash; üyelik kaydı yalnızca Google hesabıyla (OAuth) yapılır ve bu bilgiler onayınızla Google hesabınızdan alınır (Üyelik kaydının oluşturulması, platforma giriş yapılması ve iletişim faaliyetlerinin yürütülmesi amacıyla).</li>
              <li><strong>İşlem Güvenliği Verileri:</strong> IP adresi, tarayıcı bilgileri, sisteme giriş-çıkış saatleri (5651 sayılı Kanun kapsamındaki yükümlülüklerin yerine getirilmesi ve bilgi güvenliği süreçlerinin yürütülmesi amacıyla).</li>
              <li><strong>Kullanım ve Profilleme Verileri:</strong> Platform üzerinde izlenen, puanlanan filmler, yapılan yorumlar, favori film listeleri, eşleşme (&ldquo;İzdaş&rdquo;) sistemi kapsamında elde edilen kullanıcı tercihleri (Ürün ve hizmetlerin sizlere özelleştirilerek sunulması, algoritma destekli sinema zevki eşleştirmelerinin yapılması amacıyla).</li>
              <li><strong>Doğum Tarihi ve Yaş:</strong> Doğum tarihiniz yalnızca yaş doğrulaması (18 yaş şartı) amacıyla saklanır ve diğer üyelere asla gösterilmez; profillerde yalnızca hesaplanan yaş paylaşılır.</li>
              <li><strong>Eşleşme Sohbet İçeriği:</strong> Eşleştiğiniz üyelerle kurduğunuz sohbet mesajları yalnızca o eşleşmenin tarafları arasında kalır.</li>
              <li><strong>Finansal Veri İşlenmez:</strong> Platform üzerinden hiçbir satış yapılmadığından kredi kartı, banka hesabı veya fatura bilgisi gibi hiçbir finansal veri toplanmaz ve işlenmez. Davetiye/katkı usulüyle atanan İzledin+ kulüp üyeliğine ilişkin de herhangi bir ödeme verisi bulunmaz.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="bolum-03" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <EyeOff className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                3. İşlenen Kişisel Verilerin Aktarımı
              </h2>
            </div>
            <p>
              Toplanan kişisel verileriniz; KVKK&apos;nın 8. ve 9. maddelerinde belirtilen şartlar dahilinde aşağıdaki taraflara aktarılabilmektedir:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Yasal yükümlülüklerin yerine getirilmesi amacıyla <strong>yetkili kamu kurum ve kuruluşlarına</strong>,</li>
              <li>Hukuki süreçlerin takibi amacıyla sözleşmeli <strong>hukuk bürolarına</strong>,</li>
              <li>Platformun barındırılması, veritabanı yönetimi ve güvenliği (Hosting, Supabase, Vercel vb.) amacıyla <strong>sunucu/altyapı hizmeti alınan tedarikçilere</strong> (Bu veriler şifrelenmiş olarak yurt dışı sunucularında tutulabilir, bu işlem Kullanıcı Sözleşmesi ve Açık Rıza metnindeki onayınıza tabidir).</li>
            </ul>
            <p>Verileriniz kesinlikle ticari reklam ağlarına, veri simsarlarına veya izinsiz üçüncü şahıslara satılmaz.</p>
          </section>

          {/* Section 4 */}
          <section id="bolum-04" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Trash2 className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi
              </h2>
            </div>
            <p>
              Kişisel verileriniz, izledin.com web sitesi, mobil uygulaması veya bağlantılı entegrasyonlar üzerinden elektronik ortamda tamamen veya kısmen otomatik yollarla toplanmaktadır. Bu veriler KVKK Madde 5 ve Madde 6 kapsamında aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması (Kullanıcı Sözleşmesinin İfası),</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması (5651 sayılı kanun),</li>
              <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması,</li>
              <li>Açık rızanızın bulunması (Özel nitelikli algoritmalar, yurt dışı veri aktarımı ve ticari elektronik iletiler).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="bolum-05" className=" bg-[#141414] border-2  border-[#333333] p-6  shadow-[4px_4px_0px_#000000] space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2.5 border-b-2  border-[#333333] pb-2 font-mono">
              <Mail className="w-4 h-4  text-[#EF4444]" />
              <h2 className="text-sm sm:text-base font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
                5. İlgili Kişinin Hakları (KVKK Madde 11)
              </h2>
            </div>
            <p>
              Kişisel veri sahibi olarak KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,</li>
              <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme ve bu kapsamda yapılan işlemin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
              <li>KVKK ve ilgili diğer kanun hükümlerine uygun olarak işlenmiş olmasına rağmen, işlenmesini gerektiren sebeplerin ortadan kalkması hâlinde kişisel verilerin silinmesini veya yok edilmesini (Unutulma Hakkı) isteme.</li>
            </ul>
            <div className="pt-2">
              <p className="font-bold  text-[#FAFAFA]">
                Veri Sorumlusuna Başvuru:
              </p>
              <p className=" text-neutral-400 font-mono text-xs">
                Haklarınıza ilişkin taleplerinizi <a href="mailto:gizlilik@izledin.com" className=" text-[#EF4444] underline">gizlilik@izledin.com</a> adresi üzerinden Şirketimize iletebilirsiniz. Talebiniz niteliğine göre en kısa sürede ve en geç otuz (30) gün içinde ücretsiz olarak sonuçlandırılacaktır.
              </p>
            </div>
          </section>
        </div>

        {/* Official Fanzine Seal of Compliance */}
        <section aria-label="Resmi Fanzin Mührü" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#DC2626] text-center space-y-4">
          <div className="w-16 h-16 bg-[#DC2626] text-white mx-auto flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_#000000]">
            <CinemaVerifiedSeal size={32} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black uppercase font-sans tracking-tight">
              KVKK ONAYLI AYDINLATMA METNİ
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              YÜRÜRLÜK TARİHİ: 2026 • İZLEDİN BİLGİ TEKNOLOJİLERİ
            </p>
          </div>
          <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
            İşbu aydınlatma metni, 6698 Sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuata tam uyum çerçevesinde hazırlanmıştır.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
