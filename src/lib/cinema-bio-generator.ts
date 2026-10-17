import { Locale } from './i18n/types';
import { translateGenre } from './i18n/genres';

export interface CinemaProfileData {
  favoriteGenres?: string[];
  top4Favorites?: Array<{ title?: string; year?: string | number }>;
  matchIntent?: string;
  location?: string;
}

export const CINEMA_PROMPT_STARTERS_TR = [
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

export const CINEMA_PROMPT_STARTERS_EN = [
  'Cult masterpiece I rewatch the most: ',
  'Greatest director in cinema history: ',
  'What I enjoy most watching in a dark cinema hall: ',
  'Hidden cinematic gem that deserved more recognition: ',
  'Film whose cinematography and frames mesmerized me: ',
  'Masterpiece that left the deepest impression on first watch: ',
  'Trilogy or franchise that best sums up my cinema taste: ',
  'Genre I love watching alone at midnight: ',
  'Movie whose score and soundtrack album spellbinds me: ',
  'Film that blew my mind with its screenplay and plot twist: ',
  'Classic I never get tired of rewatching: ',
  'First movie that made me fall in love with 35mm celluloid: ',
];

export const CINEMA_PROMPT_STARTERS = CINEMA_PROMPT_STARTERS_TR;

export function getCinemaPromptStarters(locale: Locale = 'tr'): string[] {
  return locale === 'en' ? CINEMA_PROMPT_STARTERS_EN : CINEMA_PROMPT_STARTERS_TR;
}

export function generateDynamicBio(profile?: CinemaProfileData | null, locale: Locale = 'tr'): string {
  if (!profile) {
    return locale === 'en'
      ? '35mm celluloid regular and independent cinema follower.'
      : '35mm perde müdavimi ve bağımsız sinema takipçisi.';
  }

  const genres = (profile.favoriteGenres || []).filter(Boolean);
  const favorites = (profile.top4Favorites || []).map(f => f.title).filter(Boolean);

  if (genres.length > 0 && favorites.length > 0) {
    const genreStr = genres.slice(0, 2).map(g => translateGenre(g, locale)).join(locale === 'en' ? ' & ' : ' ve ');
    const favStr = favorites.slice(0, 2).join(locale === 'en' ? ' & ' : ' ve ');
    return locale === 'en'
      ? `${genreStr} focused 35mm cinephile taste. Admirer of ${favStr}.`
      : `${genreStr} odaklı 35mm sinefil zevki. ${favStr} hayranı.`;
  }

  if (genres.length > 0) {
    const genreStr = genres.slice(0, 2).map(g => translateGenre(g, locale)).join(locale === 'en' ? ' & ' : ' ve ');
    return locale === 'en'
      ? `${genreStr} enthusiast, dark room and film festival regular.`
      : `${genreStr} tutkunu, karanlık salon ve festival müdavimi.`;
  }

  if (favorites.length > 0) {
    const favStr = favorites.slice(0, 2).join(locale === 'en' ? ' & ' : ' ve ');
    return locale === 'en'
      ? `Admirer of ${favStr}, cult cinema and typewriter diary follower.`
      : `${favStr} hayranı, kült sinema ve daktilo günlüğü takipçisi.`;
  }

  return locale === 'en'
    ? '35mm celluloid regular and independent cinema follower.'
    : '35mm perde müdavimi ve bağımsız sinema takipçisi.';
}
