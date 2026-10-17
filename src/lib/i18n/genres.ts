import { Locale } from './types';

export const GENRE_TRANSLATIONS: Record<string, { en: string; tr: string }> = {
  'Bilim Kurgu': { en: 'Sci-Fi', tr: 'Bilim Kurgu' },
  'Psikolojik Gerilim': { en: 'Psychological Thriller', tr: 'Psikolojik Gerilim' },
  'Dram': { en: 'Drama', tr: 'Dram' },
  'Anime & Shonen': { en: 'Anime & Shonen', tr: 'Anime & Shonen' },
  'Suç & Gizem': { en: 'Crime & Mystery', tr: 'Suç & Gizem' },
  'Korku': { en: 'Horror', tr: 'Korku' },
  'Aksiyon': { en: 'Action', tr: 'Aksiyon' },
  'Sanat & Festival': { en: 'Art & Festival', tr: 'Sanat & Festival' },
  'Komedi': { en: 'Comedy', tr: 'Komedi' },
  'Romantik': { en: 'Romance', tr: 'Romantik' },
  'Fantastik': { en: 'Fantasy', tr: 'Fantastik' },
  'Belgesel': { en: 'Documentary', tr: 'Belgesel' },
  'Animasyon': { en: 'Animation', tr: 'Animasyon' },
  'Neo-Noir': { en: 'Neo-Noir', tr: 'Neo-Noir' },
  'Klasik Sinema': { en: 'Classic Cinema', tr: 'Klasik Sinema' },
  'Macera': { en: 'Adventure', tr: 'Macera' },
  'Gerilim': { en: 'Thriller', tr: 'Gerilim' },
  'Suç': { en: 'Crime', tr: 'Suç' },
  'Gizem': { en: 'Mystery', tr: 'Gizem' },
  'Müzik': { en: 'Music', tr: 'Müzik' },
  'Tarih': { en: 'History', tr: 'Tarih' },
  'Savaş': { en: 'War', tr: 'Savaş' },
  'Western': { en: 'Western', tr: 'Western' },
  'Biyografi': { en: 'Biography', tr: 'Biyografi' },
  'Sinema': { en: 'Cinema', tr: 'Sinema' },
  'Film': { en: 'Movie', tr: 'Film' },
  'Dizi': { en: 'TV Series', tr: 'Dizi' },
  'Anime': { en: 'Anime', tr: 'Anime' },
};

export function translateGenre(genre: string, locale: Locale): string {
  if (!genre) return '';
  const match = GENRE_TRANSLATIONS[genre];
  if (match) {
    return locale === 'en' ? match.en : match.tr;
  }
  // Try case-insensitive lookup
  const key = Object.keys(GENRE_TRANSLATIONS).find(
    (k) => k.toLowerCase() === genre.toLowerCase()
  );
  if (key) {
    return locale === 'en' ? GENRE_TRANSLATIONS[key].en : GENRE_TRANSLATIONS[key].tr;
  }
  return genre;
}
