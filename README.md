# 🎬 izledin.com — Sosyal Sinema Kulübü & İzdaş Keşif Platformu

```
  ██╗███████╗██╗     ███████╗██████╗ ██╗███╗   ██╗    ██████╗ ██████╗ ███╗   ███╗
  ██║╚══███╔╝██║     ██╔════╝██╔══██╗██║████╗  ██║   ██╔════╝██╔═══██╗████╗ ████║
  ██║  ███╔╝ ██║     █████╗  ██║  ██║██║██╔██╗ ██║   ██║     ██║   ██║██╔████╔██║
  ██║ ███╔╝  ██║     ██╔══╝  ██║  ██║██║██║╚██╗██║   ██║     ██║   ██║██║╚██╔╝██║
  ██║███████╗███████╗███████╗██████╔╝██║██║ ╚████║██╗╚██████╗╚██████╔╝██║ ╚═╝ ██║
  ╚═╝╚══════╝╚══════╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝
```

> **EST. '26 • Bağımsız Gece Gösterimi Sinema Kulübü, 35mm Daktilo Günlüğü ve İzdaş Eşleşme Radarı**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2017-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel_Edge-black?style=for-the-badge&logo=vercel)](https://www.izledin.com)

---

## 1. 🌟 Projenin Vizyonu ve Temel Değeri

### 1.1. Sinefil Kültürü ve Sosyal Bağlantı
Geleneksel film takip platformları (Letterboxd, IMDb, Serializd) kullanıcılara bireysel izleme listesi tutma imkanı sunsa da, **sinefillerin birbirini bulmasını sağlayan organik bir mekanizma barındırmaz**.

`izledin.com`, film günlüğü tutma eylemini **35mm analog fanzin estetiğinde** bir gece gösterimi sinema kulübüne dönüştürür. Platformun kalbinde, sinema zevkleri ve frekansları örtüşen insanları buluşturan **"İzdaş"** (sinema arkadaşı) eşleşme ekosistemi yer alır.

### 1.2. Temel Değer Önermeleri
* **Gece Gösterimi & Brutalist Fanzin Estetiği:** Modern SaaS tekdüzeliği yerine, 35mm film perforasyonları, kırmızı kadife gece marquis ışıkları, damga rozetleri ve katı gölgelerle örülü neobrutalist tasarım.
* **İzdaş Eşleşme Radarı:** Tür ağırlıkları, yayın servisleri ve niyet filtrelerine dayalı çok vektörlü eşleştirme motoru.
* **Sıfır Sahte Profil / %100 Canlı Veritabanı:** Mock kullanıcı içermeyen, yalnızca gerçek Supabase kullanıcılarından oluşan şeffaf radar.
* **0ms Gecikmeli Hibrit Katalog:** 2,012 kült başyapıtı içeren yerel JSON kütüphanesi + küresel OMDB API canlı arama köprüsü.
* **Güvenli ve Asenkron İletişim:** Spam'ı önleyen *"Mesaj İsteği"* onay mekanizması, RLS ile mühürlenmiş veritabanı ve gizlilik odaklı mimari.

---

## 2. 🛠️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Kütüphane | Versiyon | Görevi & Mimari Rolü |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js (App Router)** | `16.3.1` | React Server Components (RSC), Turbopack, Route Handlers, Dinamik Metadata & OG Üretimi |
| **UI Library** | **React** | `19.2.8` | Modern Hook mimarisi, Asenkron UI durumları ve DOM yönetimi |
| **Language** | **TypeScript** | `^5.0.0` | Katı tip denetimi, Type-safe veritabanı arayüzleri (`database.types.ts`) |
| **Styling** | **Tailwind CSS** | `^4.0.0` | Modern CSS-first PostCSS motoru, CSS Değişkenleri ve Neobrutalist tokenlar |
| **Database & Auth**| **Supabase** | `PostgreSQL 17` | GoTrue Auth (Google OAuth + Email), Row Level Security (RLS), PL/pgSQL Stored Procedures (RPCs) |
| **Realtime** | **Supabase Realtime** | `@supabase/supabase-js 2.112.3` | WebSockets üzerinden anlık sohbet ve gelen kutusu bildirim senkronizasyonu |
| **SSR / Cookie Auth**| **@supabase/ssr** | `^0.12.4` | Next.js Server & Client arasında güvenli cookie/session yönetimi |
| **Icons & Media** | **Lucide React & Custom SVG** | `^1.31.0` | 24×24 grid, 2px monoline, keskin köşeli 35mm sinema ikonografi sistemi |
| **External Movie API**| **OMDB API** | REST | Genişletilmiş film künyeleri, IMDb puanları ve poster senkronizasyonu |
| **Mail Delivery** | **Resend** | `^6.20.0` | İletişim formu ve sistem bildirimleri için transactional e-posta |

---

## 3. 🎯 Temel Özellikler

### 3.1. 2,012 Başlıklı İki Dilli (TR/EN) Master Film & Dizi Kataloğu
* **0ms Yanıt Süresi:** 2,002 başyapıt (`catalog.json`) + 10 gelecek vizyon yapımı (`upcoming-master.json`) ile toplam **2,012** medya başlığı sıfır veritabanı maliyetiyle istemciye anında ulaştırılır.
* **Zengin Sinefil Metadatası:** Her yapım için Türkçe ve İngilizce sinopsis, 35mm sinefil notları (`cinemaNotes`), yönetmen, oyuncu kadrosu, ödüller, IMDb puanları ve yüksek çözünürlüklü afişler.

### 3.2. İzdaş Eşleşme Radarı (Match Radar)
* **İki Farklı Keşif Modu:**
  * **Swipe Deck:** Mobil öncelikli, sürükle-bırak animasyonlu, Tinder tarzı karar kartları (Beğen / Geç / Geri Al).
  * **Grid Matrix:** Masaüstü kullanıcıları için 12 kolonlu, hızlı taranabilir sinefil kart matrisi.
* **Gelişmiş Filtreleme Çekirdeği:** Niyet filtresi (*Sinefil Sohbeti*, *Sinema Randevusu*, *Her İkisi*), Tür seçimi (*15+ ana tür*), Yaş aralığı ve Türkiye'nin **81 İli ve Tüm İlçeleri** (`locations.ts`).
* **PostgreSQL Uyum Algoritması (`calculate_cinephile_matches`):**
  Postgres üzerinde çalışan `SECURITY DEFINER` RPC fonksiyonu ile sub-5ms hızında uyumluluk hesaplanır.

### 3.3. Gerçek Zamanlı Sohbet ve Gelen Kutusu (Realtime Inbox)
* **Asenkron Mesaj İsteği Akışı:** Bir kullanıcı diğerine ulaştığında doğrudan sohbet açılmaz; önce *"Mesaj İsteği"* iletilir (`status: 'pending'`).
* **Onay ve Engelleme Protokolü:** Alıcı isteği onaylarsa (`status: 'matched'`) çift yönlü gerçek zamanlı sohbet açılır ve sol alttan 10 saniyelik kabul bildirimi fırlar.
* **Realtime WebSocket Senkronizasyonu:** `supabase_realtime` kanalı ile yeni mesajlar, okundu bilgileri ve gelen kutusu bildirim rozetleri anlık senkronize edilir.

### 3.4. Sinema Günlüğü (35mm Daktilo Diary)
* **Hızlı Günlük Kaydı (Quick Log):** 2 tıkla film seçme, 5 yıldızlı (0.5 adımlı) veya 10'luk puan verme, izleme tarihi, favori/tekrar izleme bayrakları.
* **Daktilo Formatında İnceleme:** Genişletilebilir inceleme alanı ve yerel taslak saklama mekanizması (`sessionStorage`).
* **Topluluk Akış Algoritması (Gravity Time Decay):**
  İncelemelerin derinliği (200+ karakterlik sinefil yazıları), beğeni sayısı ve üyelik durumuna göre puanlanan ve zamanla sönen organik sıralama algoritması.

### 3.5. Gelecek Yapımlar & Canlı Vizyon Ajandası (Upcoming Radar)
* **2026/2027 Sinematik Takvim:** Vizyona girecek kült yapımların geri sayım sayaçları (gün/saat bazlı).
* **iCal (.ICS) Takvim Entegrasyonu:** Tek tıkla Apple Calendar, Google Calendar ve Microsoft Outlook için standart `.ics` dosyası üreterek prömiyer hatırlatıcısı kurma.

### 3.6. Brutalist Sinematik Tasarım Sistemi (Gece Gösterimi)
* **Renk Paleti:**
  * Obsidian Siyah Tuval (`#0A0A0A`), Dokulu Yüzey (`#171717`), İkincil Yüzey (`#262626`)
  * Velvet Sinema Kırmızısı (`#DC2626` / `#EF4444`), Kehribar Sarısı Yıldızlar (`#FBBF24`)
  * Yüksek Kontrastlı Beyaz Tipografi (`#FAFAFA`)
* **Neobrutalist Derinlik & Şekiller:** Yumuşatılmış gölgeler yerine katı 2px/4px/8px siyah offset gölgeler (`box-shadow: 4px 4px 0px #000000`), keskin köşeler (`rounded-none` / `rounded-sm`), 35mm film şeridi kenar delikleri (`.film-strip`).
* **Sıfır Emoji Kuralı:** Tamamı 24×24 grid üzerinde çizilmiş 20+ özel SVG sinema ikonu (`CinemaIcons.tsx`).

### 3.7. Dinamik Sinema DNA'sı ve Emojisiz Typewriter Bio Oluşturucu
* `cinema-bio-generator.ts` modülü, kullanıcının favori türlerini ve seçtiği "Top 4" başyapıtını analiz ederek daktilo fanzin dilinde dinamik biyografi ve 12 adet özgün sinefil sohbet başlatıcısı (`CINEMA_PROMPT_STARTERS`) üretir.

### 3.8. Gelişmiş SEO & Schema.org Yapısal Veri
* **2,038 URL'lik Dinamik Sitemap:** `sitemap.ts` üzerinden tüm film detay sayfaları, vizyon takvimi ve topluluk rotaları Google Search Console için endekslenir.
* **JSON-LD Yapısal Veri:** Her film sayfasında Schema.org `Movie`, `AggregateRating`, `Person` (Yönetmen) ve `BreadcrumbList` etiketleri tam geçerli (`PASS`) olarak serialize edilir.

---

## 4. 🗄️ Veritabanı Şeması

```
├── profiles (Kullanıcı profilleri, Sinema DNA'sı, Top 4, Tercihler)
├── watch_logs (İzleme kayıtları, 5 yıldızlı puanlar, daktilo incelemeleri)
├── watch_log_likes (İnceleme beğenileri, tekil kullanıcı kısıtı)
├── movie_mate_matches (İzdaş eşleşmeleri, durumlar: pending/matched/passed/blocked)
├── messages (Eşleşme içi anlık mesajlar, okundu durumu)
├── watch_together_items (İzdaş ile ortak izleme listesi)
├── custom_lists (Kullanıcı özel listeleri ve koleksiyonları)
└── site_settings (Genel duyurular, bakım modu bayrakları)
```

---

## 5. 🚀 Yerel Kurulum ve Çalıştırma

### 5.1. Gereksinimler
* **Node.js:** `v20.x` veya `v22.x`
* **Paket Yöneticisi:** `npm`, `pnpm` veya `yarn`
* **Supabase Hesabı:** [supabase.com](https://supabase.com) (PostgreSQL 17)
* **OMDB API Anahtarı:** [omdbapi.com](https://www.omdbapi.com/)

### 5.2. Adım Adım Kurulum

```bash
# 1. Depoyu klonlayın
git clone https://github.com/foxx8n/izledin.com.git
cd izledin.com

# 2. Bağımlılıkları yükleyin
npm install

# 3. Çevre değişkenlerini oluşturun
cp .env.example .env.local
```

`.env.local` dosyanıza anahtarlarınızı girin:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OMDB_API_KEY=your-omdb-key
NEXT_PUBLIC_SITE_URL=https://www.izledin.com
RESEND_API_KEY=re_your_resend_key
```

```bash
# 4. Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak platformu test edebilirsiniz.

---

## 6. ⚖️ Lisans ve Haklar
© 2026 **izledin.com**. Tüm Hakları Saklıdır.  
*Gece Gösterimi, 35mm Fanzin Tasarım Sistemi ve İzdaş Algoritması izledin.com tescilli konseptleridir.*
