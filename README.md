# 🎬 izledin.com — Sosyal Sinema Kulübü & İzdaş Keşif Platformu

```
  ██╗███████╗██╗     ███████╗██████╗ ██╗███╗   ██╗    ██████╗ ██████╗ ███╗   ███╗
  ██║╚══███╔╝██║     ██╔════╝██╔══██╗██║████╗  ██║   ██╔════╝██╔═══██╗████╗ ████║
  ██║  ███╔╝ ██║     █████╗  ██║  ██║██║██╔██╗ ██║   ██║     ██║   ██║██╔████╔██║
  ██║ ███╔╝  ██║     ██╔══╝  ██║  ██║██║██║╚██╗██║   ██║     ██║   ██║██║╚██╔╝██║
  ██║███████╗███████╗███████╗██████╔╝██║██║ ╚████║██╗╚██████╗╚██████╔╝██║ ╚═╝ ██║
  ╚═╝╚══════╝╚══════╝╚═════╝ ╚═════╝ ╚═╝╚═══╝   ╚═╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝
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
* **Gece Gösterimi & Brutalist Fanzin Estetiği:** Modern SaaS tekdüzeliği yerine, 35mm film perforasyonları, kırmızı kadefe gece marquis ışıkları, damga rozetleri ve katı gölgelerle örülü neobrutalist tasarım.
* **Matching-First Ürün:** Ana sayfa (`/` = PERDE) bir vitrin değil, doğrudan kaydırılabilir eşleşme destesidir; katalog vitrini `/kesif`'te yaşar.
* **Sıfır Sahte Profil / %100 Canlı Veritabanı:** Mock kullanıcı içermeyen, yalnızca gerçek Supabase kullanıcılarından oluşan şeffaf radar.
* **0ms Gecikmeli Hibrit Katalog:** ~2,026 kült başyapıtı içeren yerel JSON kütüphanesi + OMDB canlı arama köprüsü.
* **Güvenli ve Asenkron İletişim:** Spam'ı önleyen *"Mesaj İsteği"* onay mekanizması, RLS ile mühürlenmiş veritabanı ve gizlilik odaklı mimari.

---

## 2. 🛠️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Kütüphane | Versiyon | Görevi & Mimari Rolü |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js (App Router)** | `16.3.1` | React Server Components (RSC), Turbopack, Route Handlers, Dinamik Metadata & OG Üretimi |
| **UI Library** | **React** | `19.2.8` | Modern Hook mimarisi, Asenkron UI durumları ve DOM yönetimi |
| **Language** | **TypeScript** | `^5.0.0` | Katı tip denetimi, Type-safe veritabanı arayüzleri (`database.types.ts`) |
| **Styling** | **Tailwind CSS** | `^4.0.0` | Modern CSS-first PostCSS motoru, CSS Değişkenleri ve Neobrutalist tokenlar |
| **Database & Auth**| **Supabase** | `PostgreSQL 17` | GoTrue Auth (Google OAuth), Row Level Security (RLS), PL/pgSQL Stored Procedures (RPCs) |
| **Realtime** | **Supabase Realtime** | `@supabase/supabase-js 2.112.3` | WebSockets üzerinden anlık sohbet, gelen kutusu ve Ortak Seans senkronizasyonu |
| **SSR / Cookie Auth**| **@supabase/ssr** | `^0.12.4` | Next.js Server & Client arasında güvenli cookie/session yönetimi |
| **Icons & Media** | **Lucide React & Custom SVG** | `^1.31.0` | 24×24 grid, keskin köşeli 35mm sinema ikonografi sistemi |
| **External Movie API**| **OMDB API** | REST | Genişletilmiş film künyeleri, IMDb puanları ve poster senkronizasyonu |
| **Mail Delivery** | **Resend** | `^6.20.0` | İletişim formu + haftalık İZDAŞ radar bülteni (domain doğrulanmış: izledin.com) |

---

## 3. 🎯 Temel Özellikler

### 3.1. PERDE — Matching-First Ana Sayfa (`/`)
* **Misafir Hunisi:** Üye olmadan oynanabilir başlık destesi; her kaydırma localStorage kuyruğuna yazılır, Google ile giriş anında hesaba aktarılır (latest-wins upsert). 8 kaydırma sonrası yumuşak üyelik çağrısı.
* **Likidite Valfi (`src/lib/liquidity.ts`):** Aktif üye sayısına göre deste insan-kartları ile başlık kartları arasında şekil değiştirir — asla boş oda, asla uydurma kalabalık yok.
* **Gerçek Perde Molası:** Deste bitince kullanıcıyaLocalStorage-backed cooldown (gece yarısına kadar) kapanır; F5/new-tab kurtarmaz, sayaç canlı akar.

### 3.2. İZDAŞ RADARI (`/matches`) — Cihaza Göre Modallık
* **<1024px: Tek Kart Swipe Stack** — filtrelenmiş havuz üzerinden Tinder-tarzı sürükleme; ana dektekiyle aynı gecikmeli-yazım + geri alma motoru (`useSwipeDeck`, undo penceresi içinde hiçbir satır yazılmaz).
* **≥1024px: Dizin Grid'i** — niyet sekmeleri (TÜMÜ / Film Arkadaşı / Sinematik Flört / Fark etmez), tür+şehir+ilçe+yaş filtreleri, kart başına ✗ Pas · 🎟 BİLET · ♥ İZDAŞ OL üçlüsü.
* **SENİ BEĞENENLER Şeridi:** Gelen mesaj istekleri avatar şeridiyle yüzeye çıkar; BİLET'le gelenler altın rozetli; tıklama gelen kutusunu doğrudan istekler sekmesinde açar.
* **Yeniden Karşında:** Kendin pas geçtiğin kişiler 14 gün sonra radarına gerçek match-id ile geri gelir (karşı tarafın pas geçtikleri asla dönmez — by construction).

### 3.3. PostgreSQL Uyum Algoritması (`calculate_cinephile_matches`)
* `SECURITY DEFINER` RPC: sahiplik koruması, hesaplanmış yaş (doğum tarihi asla dışarı çıkmaz), anon erişimi kapalı.
* **Çok Vektörlü Skor:** Tür Jaccard ×35 + yayın servisleri + niyet uyumu + **tat vektörü örtüşmesi** (title_swipes like/super ∪ watch_logs watched/watching; seyrek-veri-güvenli sönümlemeli, max +10).
* `shared_titles`: ortak beğeniler media_catalog'tan çözülüp {id,title,type} objeleriyle döner.
* Client mirror (`matching-algorithm.ts`) RPC ile lockstep güncellenir.

### 3.4. BİLET (Super-Like)
* Kişi kartlarında ⭐ benzeri öne çıkan istek; **DB tarafında kota**: ücretsiz 1/gün, Kulüp (premium) sınırsız — `upsert_match_request` içinde, status bağımsız sayım (accept-zinciri oyununa kapalı), advisory-lock ile TOCTOU korumalı.
* Alıcı tarafında "BİLETLE GELDİ" rozetleri (gelen kutusu + sohbet header).

### 3.5. İZDAŞ GÜVENCESİ (Trust Bundle)
* Günlük 25 istek limiti (DB-enforced) · "Radarda görünme" toggle'ı · ilk mesajda taciz/argo bloklistesi trigger'ı · niyet bazlı sıkı eşleştirme (flört opt-in, misafirlere görünmez).

### 3.6. ORTAK SEANS (Kulüp Üyelerine Özel)
* Eşleşilen sohbette ortak "birlikte izleyeceğimiz" listesi: öner → izliyoruz → beraber izledik durum makinesi; realtime senkron (`watch_together_items` publication'da).
* Ücretsiz üyeye anchor teaser + PremiumModal upsell.

### 3.7. Sinema Günlüğü (35mm Daktilo Diary) & Topluluk Akışı
* Hızlı kayıt, daktilo incelemeler, beğeni; topluluk akışı gravity/time-decay sıralaması.
* **SEVDİM ≠ Günlük:** Perdedeki sağ kaydırma yalnızca eşleşme sinyalidir (`title_swipes`); günlük yalnızca bilinçli kayıtlarla beslenir.

### 3.8. Haftalık İZDAŞ Radar Bülteni
* Opt-in KVKK rızasıyla (`profiles.digest_opt_in`); Pazartesi 09:00 TR (Vercel Cron → `/api/cron/digest`).
* Sayaç-bazlı, gizlilik dostu içerik (partner isimleri çıkmaz); `last_digest_sent_at` idempotency guard; sessiz hafta = sessiz inbox.

### 3.9. SEO & Katalog
* Dinamik sitemap + JSON-LD (Movie/AggregateRating/Person/BreadcrumbList), ~2,026 başlıklı iki dilli katalog, OMDB köprüsü, OG görselleri.

---

## 4. 🗄️ Veritabanı Şeması

```
├── profiles            (DNA, Top4, radar_visible, is_premium, digest_opt_in...)
├── watch_logs          (Bilinçli günlük kayıtları; perde bunu YAZMAZ)
├── watch_log_likes     (İnceleme beğenileri)
├── movie_mate_matches  (pending/matched/passed/blocked + passed_by/at + is_bilet)
├── title_swipes        (Perde kaydırmaları — eşleşme tat vektörünün birincil kaynağı)
├── messages            (Eşleşme içi mesajlar + bloklist trigger)
├── watch_together_items(ORTAK SEANS listesi; realtime publication'da)
├── custom_lists        (Özel koleksiyonlar)
└── site_settings       (Duyurular, bakım modu)
```

**Migration disiplini:** `supabase/migrations/YYYYMMDD_snake_case.sql`; additive-only; fonksiyon imzası değişince eski imza açıkça DROP edilir (shadow-overload tuzağı); kolon-bazlı grant rejimine sahip tablolara yeni kolon AYNI transaction'da grant'lenir; eski function body rollback için header comment'e aynen kopyalanır. Canlı DB her zaman `schema.sql` snapshot'ından doğruudur.

---

## 5. 🚀 Yerel Kurulum ve Çalıştırma

### 5.1. Gereksinimler
* **Node.js:** `v20.x` veya üzeri
* **Supabase Hesabı** (PostgreSQL 17) · **OMDB API Key** · **Resend API Key** (bülten/iletişim için)

### 5.2. Adım Adım Kurulum

```bash
git clone https://github.com/foxx8n/izledin.com.git
cd izledin.com
npm install
cp .env.example .env.local
# .env.local değerlerini doldurun, sonra:
npm run dev
```

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # yalnızca server (cron/admin)
OMDB_API_KEY=your-omdb-key
NEXT_PUBLIC_SITE_URL=https://www.izledin.com
RESEND_API_KEY=re_your_resend_key
CRON_SECRET=random-long-secret                     # Vercel Cron auth (prod env)
```

**Production env (Vercel):** yukarıdakiler + `CRON_SECRET`. Cron tanımı `vercel.json` içinde: `/api/cron/digest`, Pazartesi 06:00 UTC. `main` push'ları Vercel'de otomatik prod deploy olur — her push koheran olmalı.

---

## 6. 📐 Mimarî Sözleşmeler (gelecek oturumlar için)

1. **SEVDİM = sadece eşleşme sinyali.** Perde `title_swipes`'a yazar, `watch_logs`'a asla. Günlük/akış/istatistik yalnızca bilinçli kayıtlardan beslenir.
2. **Cihaz başına tek etkileşim modeli:** <lg swipe stack, ≥lg grid/dizin. İki kalıcı stack yok.
3. **Gecikmeli commit geri alması:** Swipe yan etkileri undo penceresi kapanmadan DB'ye yazılmaz (`useSwipeDeck`). Geri alma görsel yalan değildir.
4. **CSP `img-src` beyaz listesi** poster kaynaklarını sınırlar — yeni katalog partisi yeni bir host getiriyorsa `next.config.ts` güncellenmelidir (yoksa onError fallback'leri sessizce görünür).
5. **Zero-fabrication:** Hiçbir sayı/sayısal gösterge uydurulamaz; veri yoksa "yok" denir.
6. **Copy dili:** Türkçe sinefil tonu, emoji yok, kullanıcı verisinde uppercase gerekiyorsa `toLocaleUpperCase('tr')`.
7. **RLS asla zayıflatılmaz;** hassas kolonlar client'a SELECT edilemez (grant listeleri `profile.service.ts`).

---

## 7. ⚖️ Lisans ve Haklar
© 2026 **izledin.com**. Tüm Hakları Saklıdır.
*Gece Gösterimi, 35mm Fanzin Tasarım Sistemi ve İzdaş Algoritması izledin.com tescilli konseptleridir.*
