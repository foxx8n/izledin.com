/**
 * Cinema Bio Generator & Prompt Templates for izledin.com
 * Provides dynamic cinema DNA summaries and rich prompt starters.
 * STRICTLY NO EMOJIS — Uses brutalist typography and cinema metadata.
 */

export interface CinemaProfileData {
  favoriteGenres?: string[];
  top4Favorites?: Array<{ title?: string; year?: string | number }>;
  matchIntent?: string;
  location?: string;
}

export const CINEMA_PROMPT_STARTERS = [
  'En çok tekrar izlediğim kült başyapıt: ',
  'Bence sinema tarihinin en iyi yönetmeni: ',
  'Karanlık sinema salonunda izlemekten en keyif aldığım: ',
  'Hak ettiği değeri görmediğini düşündüğüm gizli sinema hazinesi: ',
  'Sinematografisine ve kadrajlarına hayran kaldığım yapım: ',
  'İlk izlediğimde üzerimde en derin etkiyi bırakan başyapıt: ',
  'Sinema zevkimi en iyi özetleyen üçleme veya seri: ',
  'Gece yarısı yalnız izlemeyi en çok sevdiğim tür: ',
  'Müzikleri ve soundtrack albümüyle beni büyüleyen film: ',
  'Senaryo kurgusu ve ters köşesiyle aklımı alan film: ',
  'Tekrar tekrar izlemekten asla bıkmadığım klasik: ',
  'Beni sinemaya ve 35mm perdeye bağlayan ilk yapım: ',
];

export function generateDynamicBio(profile?: CinemaProfileData | null): string {
  if (!profile) {
    return '35mm perde müdavimi ve bağımsız sinema takipçisi.';
  }

  const genres = (profile.favoriteGenres || []).filter(Boolean);
  const favorites = (profile.top4Favorites || []).map(f => f.title).filter(Boolean);

  if (genres.length > 0 && favorites.length > 0) {
    const genreStr = genres.slice(0, 2).join(' ve ');
    const favStr = favorites.slice(0, 2).join(' ve ');
    return `${genreStr} odaklı 35mm sinefil zevki. ${favStr} hayranı.`;
  }

  if (genres.length > 0) {
    const genreStr = genres.slice(0, 2).join(' ve ');
    return `${genreStr} tutkunu, karanlık salon ve festival müdavimi.`;
  }

  if (favorites.length > 0) {
    const favStr = favorites.slice(0, 2).join(' ve ');
    return `${favStr} hayranı, kült sinema ve daktilo günlüğü takipçisi.`;
  }

  return '35mm perde müdavimi ve bağımsız sinema takipçisi.';
}
