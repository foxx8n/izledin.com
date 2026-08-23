# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Birincil Kullanıcı:** Türkiye ve küresel Türkçe konuşan sinema, dizi ve anime tutkunları, sinefiller ve film kulübü meraklıları.
- **Kullanıcı İhtiyacı & Durumu:** İzlediklerini analog fanzin rahatlığında kaydetmek, puanlamak ve aynı zamanda kendi zevkine (yönetmen, tür, felsefe, favori 4'lü) tam uyan yeni film arkadaşları ("İzdaşlar") ile tanışıp sohbet etmek isteyen sinemaseverler.
- **İkincil Kitle:** Belirli platformlara (MUBI, BluTV, Netflix, Crunchyroll) abone olup "ne izlesem?" diyen ve vizyondaki gelecek yapımları takip eden izleyiciler.

## Product Purpose

- **Ne Yapar:** `izledin.com` (EST. '26), kullanıcıların film, dizi ve anime izleme geçmişini daktilo estetiğinde tuttuğu, puanladığı, incelemeler yazdığı ve çok vektörlü bir zevk algoritmasıyla en uyumlu İzdaşlarıyla eşleşip mesajlaştığı sosyal-öncelikli bir sinema kulübüdür.
- **Varoluş Nedeni:** Geleneksel izleme takip siteleri (Letterboxd, IMDb, Serializd) bireysel liste tutmaya odaklıdır ve gerçek anlamda zevk eşleştirme ve sıcak fanzin ruhu sunmaz. `izledin.com`, izleme günlüğünü gerçek bir sinema kulübü ve İzdaş keşif deneyimine dönüştürür.
- **Başarı Kriteri:** Kullanıcıların düzenli izleme kayıtları girmesi, yüksek uyumlu İzdaşlarla sohbet başlatması ve profillerini (Favori 4'lü & Sinema DNA) tamamlaması.

## Positioning

- **Ayırt Edici Mekanizma:** **Çok Vektörlü İzdaş Eşleştirme Motoru** (Tür ağırlıkları %30 + Ortak Favori 4'lü %30 + Puan Korelasyonu %20 + Ortak İzleme Sinerjisi %20), **Asenkron Mesaj İsteği Onay Akışı** (Pending -> Matched) ve **35mm Fanzine Kimlik Kartı**.
- **Sıfır Mock / %100 Gerçek Veritabanı:** Sentetik ya da sahte profil asla barındırılmaz; gerçek Supabase kullanıcıları radara düşer.
- **Sıfır Maliyetli / 0ms Hibrit Katalog:** 276 kült başyapıttan oluşan statik master kütüphane (15 rafine tür) ve OMDB destekli küresel arama.
- **35mm Daktilo Günlüğü & Topluluk Algoritması:** Yerçekimli zaman aşımı (gravity time decay) formülüyle derin incelemeleri ve İzledin+ üyelerini organik öne çıkaran akış motoru.

## Operating Context

- **Kullanım Sahnesi:** Film veya dizi izledikten hemen sonra mobil veya masaüstünden hızlı puanlama ve günlük kaydı; sinema eşi radarından yeni zevkdaşlar bulup mesaj isteği iletme; 2026/2027 vizyon takvimini takip etme.
- **Cihazlar:** Mobil-öncelikli (Swipe Deck & Grid modları, 48px dokunmatik hedefler, haptic geri bildirim) ve masaüstünde tam duyarlı (responsive) web deneyimi.

## Capabilities and Constraints

- **Kimlik Doğrulama & Veritabanı:** Supabase Auth (Google 1-Click OAuth + Doğrulanmış E-posta Koruması) + Supabase PostgreSQL (RLS, Asenkron Mesaj İstekleri, Gerçek Zamanlı Mesajlaşma, `watch_log_likes` tekil beğeni kısıtı).
- **Medya Katalog Altyapısı:** 276 yapımlık dahili statik master katalog (`src/data/catalog.json`) + OMDB API entegrasyonu ve çok kademeli (RAM + LocalStorage) önbellekleme.
- **Performans & Derleme:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, 0ms anında açılan statik katalog.
- **Veritabanı Yükü:** 0 MB film verisi yükü (Supabase 500MB Free Tier kotası tamamen kullanıcı etkileşimlerine ayrılmıştır).

## Brand Commitments

- **İsim & Kimlik:** `izledin.com` (EST. '26) • Bağımsız Sinema Kulübü ve Eşleşme Platformu.
- **Görsel Dil:** Gece Gösterimi & 35mm Analog Fanzin Estetiği (Sinema Kırmızısı `#DC2626` / `#EF4444`, Saf Siyah `#0A0A0A`, Mat Beyaz `#FAFAFA`, Kehribar Sarısı `#F59E0B`, özel vektör ikonlar, katı drop-shadow'lar).
- **Ses & Ton:** Samimi, sinema terminolojisine hakim, entelektüel ama sıcak, keşfe teşvik eden sinefil dili. Emojisiz, özgün sinematik vektör dili.

## Evidence on Hand

- Çalışır durumdaki Next.js 16 + TypeScript codebase (`src/app/`, `src/components/`, `src/lib/`).
- 276 filmlik 15 kategorili eksiksiz master katalog (`src/data/catalog.json`).
- Supabase veritabanı şeması ve RLS politikaları (`profiles`, `watch_logs`, `watch_log_likes`, `movie_mate_matches`, `messages`).
- Test edilmiş çok vektörlü eşleştirme algoritması (`src/lib/matching-algorithm.ts`).
- Asenkron Mesaj İsteği ve Gelen Kutusu onay motoru (`src/lib/services/inbox.service.ts`, `src/components/matches/ChatModal.tsx`).

## Product Principles

1. **Sosyal Öncelikli Deneyim:** İzleme kaydı sadece bireysel bir arşiv değil; aynı sinematik dili konuştuğun insanlarla tanışmanın anahtarıdır.
2. **Asenkron İletişim Güvenliği:** Doğrudan sohbet yerine "Mesaj İsteği" gönderilir; alıcı onay verene kadar spam engellenir.
3. **Sıfır Sürtünmeli Günlük:** Bir yapımı puanlamak ve daktilo günlüğüne eklemek en fazla iki tık almalıdır.
4. **Küratör & Zengin Keşif:** Sayfa her açıldığında farklı ve dengeli başyapıtlar sunulmalı, tek bir türe sıkışmamalıdır.
5. **Gerçek Sinefiller:** Sahte veya mock profil barındırılmaz; radarda sadece gerçek veritabanı üyeleri listelenir.

## Accessibility & Inclusion

- WCAG AA kontrast standartları, ekran okuyucu dostu semantik HTML5, klavye ile modal kapatma (Esc tuşu), dokunmatik hedefler (minimum 44px - 48px) ve Türkçe tarih/süre lokalizasyonu.
