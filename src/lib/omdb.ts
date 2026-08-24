import { MediaItem, MediaType } from '@/types';
import { movieDetailsCache, searchQueryCache, trendingCatalogCache } from './cache';
import { searchDbCatalog, getDbCatalogItem, saveMediaItemToDb } from '@/lib/services/media-catalog.service';
import rawCatalog from '@/data/catalog.json';
import rawUpcomingCatalog from '@/data/upcoming-master.json';

const STATIC_CATALOG: MediaItem[] = rawCatalog as MediaItem[];
export const STATIC_UPCOMING_CATALOG: MediaItem[] = rawUpcomingCatalog as MediaItem[];

// Pre-warm the in-memory details cache with the static master catalog for 0ms lookup
STATIC_CATALOG.forEach((item) => {
  movieDetailsCache.set(item.id, item);
});
STATIC_UPCOMING_CATALOG.forEach((item) => {
  movieDetailsCache.set(item.id, item);
});

// Server-only secret — never hardcode a fallback key here.
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export const OMDB_GENRE_TRANSLATION: Record<string, string> = {
  'action': 'Aksiyon',
  'adventure': 'Macera',
  'animation': 'Animasyon',
  'biography': 'Biyografi',
  'comedy': 'Komedi',
  'crime': 'Suç & Gizem',
  'documentary': 'Belgesel',
  'drama': 'Dram',
  'family': 'Aile',
  'fantasy': 'Fantastik',
  'history': 'Tarih',
  'horror': 'Korku',
  'music': 'Müzik',
  'musical': 'Müzikal',
  'mystery': 'Gizem',
  'romance': 'Romantik',
  'sci-fi': 'Bilim Kurgu',
  'short': 'Kısa Film',
  'sport': 'Spor',
  'thriller': 'Psikolojik Gerilim',
  'war': 'Savaş',
  'western': 'Vahşi Batı',
  'anime': 'Anime & Shonen',
};

const MASTERPIECE_BACKDROPS: Record<string, string> = {
  'tt15239678': 'https://m.media-amazon.com/images/M/MV5BN2QyZGUgkLw1Y2YtNmUzOC00N2FkLWI2YTQtZGIxMjYxNmFmNWYxXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX1200.jpg', // Dune 2
  'tt15398776': 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_SX1200.jpg', // Oppenheimer
  'tt0816692': 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX1200.jpg', // Interstellar
  'tt1856010': 'https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX1200.jpg', // Blade Runner 2049
  'tt0468569': 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX1200.jpg', // The Dark Knight
  'tt6751668': 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00Ti05LWE0ZGMtODU3NmIxZGU0NTg3XkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_SX1200.jpg', // Parasite
  'tt1375666': 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX1200.jpg', // Inception
  'tt0110912': 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX1200.jpg', // Pulp Fiction
};

const CUSTOM_POSTERS: Record<string, string> = {
  'tt18224594': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop', // Blade Runner 2099
  'tt1375666': 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX1200.jpg', // Inception Poster
};

const TURKISH_MONTHS: Record<string, string> = {
  'Jan': 'Ocak',
  'Feb': 'Şubat',
  'Mar': 'Mart',
  'Apr': 'Nisan',
  'May': 'Mayıs',
  'Jun': 'Haziran',
  'Jul': 'Temmuz',
  'Aug': 'Ağustos',
  'Sep': 'Eylül',
  'Oct': 'Ekim',
  'Nov': 'Kasım',
  'Dec': 'Aralık',
};

export function formatTurkishReleaseDate(dateStr?: string, year?: number): string {
  if (!dateStr || dateStr === 'N/A') return year ? `${year}` : '—';
  let formatted = dateStr;
  for (const [en, tr] of Object.entries(TURKISH_MONTHS)) {
    formatted = formatted.replace(new RegExp(`\\b${en}\\b`, 'i'), tr);
  }
  return formatted;
}

/**
 * Normalizes Turkish characters and diacritics into plain ASCII equivalents
 * for resilient, case-insensitive, and accent-insensitive matching.
 */
export function normalizeTurkishText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NEO_NOIR_IDS = new Set([
  'tt0071315', 'tt0083658', 'tt1856010', 'tt0114369', 'tt0209144', 'tt0119509',
  'tt0443706', 'tt0780504', 'tt2872718', 'tt0477348', 'tt0116282', 'tt0166924',
  'tt1877830', 'tt0110912', 'tt0407887', 'tt1392214', 'tt0118715', 'tt0112471',
  'tt0120735', 'tt0105236'
]);

const ARTHOUSE_IDS = new Set([
  'tt6751668', 'tt0079944', 'tt0069293', 'tt0060827', 'tt8613070', 'tt6710474',
  'tt2278388', 'tt0211915', 'tt2582802', 'tt1798709', 'tt2346849', 'tt21307994',
  'tt0119698', 'tt0095765', 'tt0245429', 'tt0093743', 'tt15239678', 'tt15398776',
  'tt0118842', 'tt0089881', 'tt1049413', 'tt0457430', 'tt0021749', 'tt0036775'
]);

function parseGenres(rawGenreStr?: string, rawYear?: number, imdbId?: string, isAnime: boolean = false): string[] {
  let list: string[] = [];
  if (rawGenreStr && rawGenreStr !== 'N/A') {
    const raw = rawGenreStr.split(',').map((g) => g.trim().toLowerCase());
    list = raw.map((g) => OMDB_GENRE_TRANSLATION[g] || g.charAt(0).toUpperCase() + g.slice(1));
  }

  if (isAnime && !list.includes('Anime & Shonen')) {
    list.unshift('Anime & Shonen');
  }

  // Classic cinema tag (<= 1979)
  if (rawYear && rawYear <= 1979 && !list.includes('Klasik Sinema')) {
    list.push('Klasik Sinema');
  }

  // Neo-Noir tag
  if ((imdbId && NEO_NOIR_IDS.has(imdbId)) || (rawGenreStr && rawGenreStr.toLowerCase().includes('film-noir'))) {
    if (!list.includes('Neo-Noir')) list.push('Neo-Noir');
  }

  // Arthouse / Festival tag
  if (imdbId && ARTHOUSE_IDS.has(imdbId) && !list.includes('Sanat & Festival')) {
    list.push('Sanat & Festival');
  }

  return list.length > 0 ? list : ['Popüler'];
}

function mapOMDBToMediaItem(raw: any): MediaItem {
  const isSeries = raw.Type === 'series';
  const isAnime = Boolean(
    (raw.Genre && raw.Genre.toLowerCase().includes('animation') && (raw.Country?.includes('Japan') || raw.Language?.includes('Japanese'))) ||
    raw.Title?.toLowerCase().includes('attack on titan') ||
    raw.Title?.toLowerCase().includes('spirited away') ||
    raw.Title?.toLowerCase().includes('chainsaw') ||
    raw.Title?.toLowerCase().includes('avatar aang') ||
    raw.Title?.toLowerCase().includes('death note') ||
    raw.Title?.toLowerCase().includes('jujutsu') ||
    raw.Title?.toLowerCase().includes('demon slayer') ||
    raw.Title?.toLowerCase().includes('evangelion') ||
    raw.Title?.toLowerCase().includes('mononoke') ||
    raw.Title?.toLowerCase().includes('cowboy bebop')
  );

  const mediaType: MediaType = isAnime ? 'anime' : isSeries ? 'tv' : 'movie';
  const parsedYear = raw.Year ? parseInt(raw.Year.replace(/[^0-9]/g, '').slice(0, 4), 10) : NaN;
  // Unknown year stays undefined — never fabricate a plausible-looking one.
  const rawYear = Number.isNaN(parsedYear) ? undefined : parsedYear;
  const rawRating = raw.imdbRating && raw.imdbRating !== 'N/A' ? parseFloat(raw.imdbRating) : undefined;

  let poster = raw.Poster && raw.Poster !== 'N/A'
    ? raw.Poster
    : CUSTOM_POSTERS[raw.imdbID] || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(raw.Title || 'İsimsiz Yapım')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`;

  const backdrop = MASTERPIECE_BACKDROPS[raw.imdbID] || poster;

  const rawDuration = raw.Runtime && raw.Runtime !== 'N/A' ? raw.Runtime.replace(/\bmin\b/i, 'dk') : undefined;
  const rawRelease = raw.Released && raw.Released !== 'N/A'
    ? formatTurkishReleaseDate(raw.Released, rawYear)
    : rawYear !== undefined
      ? `${rawYear}`
      : undefined;
  
  let rawAwards = raw.Awards && raw.Awards !== 'N/A' ? raw.Awards : undefined;
  if (rawAwards) {
    rawAwards = rawAwards
      .replace(/Won (\d+) Oscars?/i, '$1 Oscar Kazandı')
      .replace(/(\d+) wins/i, '$1 Ödül')
      .replace(/(\d+) nominations/i, '$1 Adaylık')
      .replace(/total/i, 'toplam');
  }

  return {
    id: raw.imdbID || `omdb_${(raw.Title || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-')}${raw.Year ? `-${raw.Year}` : ''}`,
    type: mediaType,
    title: raw.Title || 'İsimsiz Yapım',
    originalTitle: raw.Title,
    overview: raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : 'Açıklama henüz eklenmedi.',
    overviewEn: raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : undefined,
    posterPath: poster,
    backdropPath: backdrop,
    releaseDate: rawRelease,
    year: rawYear,
    voteAverage: rawRating !== undefined ? Number(rawRating.toFixed(1)) : undefined,
    genres: parseGenres(raw.Genre, rawYear, raw.imdbID, isAnime),
    duration: rawDuration,
    director: raw.Director && raw.Director !== 'N/A' ? raw.Director : undefined,
    actors: raw.Actors && raw.Actors !== 'N/A' ? raw.Actors : undefined,
    awards: rawAwards,
    imdbVotes: raw.imdbVotes && raw.imdbVotes !== 'N/A' ? raw.imdbVotes : undefined,
  };
}

// Curated pool of verified upcoming 2026 / 2027 blockbuster & anime releases
// Turkish long-form month names used by formatTurkishReleaseDate output.
const TR_MONTHS: Record<string, number> = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
};

/** Normalizes both ISO dates and Turkish-formatted dates to YYYY-MM-DD. */
export function trDateToISO(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = value.toLocaleLowerCase('tr').match(/(\d{1,2})\s+([a-zğüşıöç]+)\s+(\d{4})/);
  if (!m) return undefined;
  const month = TR_MONTHS[m[2]];
  if (!month) return undefined;
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const CURATED_UPCOMING_IDS = [
  'tt15574124', // Peaky Blinders: The Immortal Man (2026)
  'tt30825738', // Star Wars: The Mandalorian and Grogu (May 2026)
  'tt29355505', // Toy Story 5 (Jun 2026)
  'tt18259538', // Avatar Aang: The Last Airbender (Jul 2026)
  'tt21357150', // Avengers: Doomsday (Dec 2026)
  'tt18224594', // Blade Runner 2099 (2026)
  'tt16360004', // Spider-Man: Beyond the Spider-Verse (Jun 2027)
  'tt6113186',  // Shrek 5 (Jun 2027)
  'tt19850008', // The Batman: Part II (Oct 2027)
  'tt32328070', // The Lord of the Rings: The Hunt for Gollum (Dec 2027)
];

async function translateLiveText(text?: string): Promise<string> {
  if (!text || text === 'N/A' || text === 'Açıklama henüz eklenmedi.') {
    return text || 'Açıklama henüz eklenmedi.';
  }
  try {
    const encoded = encodeURIComponent(text);
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return text;
    const parsed = await res.json();
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
      const translated = parsed[0].map((part: [string]) => part[0]).filter(Boolean).join('');
      return translated || text;
    }
    return text;
  } catch {
    return text;
  }
}

/**
 * Fetches movie/series detail by IMDb ID with multi-tier caching (7-day TTL).
 * Checks the static pre-warmed catalogue first for 0ms retrieval.
 */
export async function getOMDBDetails(imdbId: string): Promise<MediaItem | null> {
  if (!imdbId) return null;

  // 1. Check static local master catalog (0ms)
  const localMatch = STATIC_CATALOG.find((item) => item.id === imdbId);
  if (localMatch) return localMatch;

  // 2. In the browser the API key is server-only — go through the proxy route.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/catalog?id=${encodeURIComponent(imdbId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.item as MediaItem) ?? null;
    } catch (err) {
      console.warn(`Failed to fetch OMDB item ${imdbId} via proxy:`, err);
      return null;
    }
  }

  // 3. Check Supabase media_catalog database (5-10ms)
  const dbMatch = await getDbCatalogItem(imdbId);
  if (dbMatch) {
    movieDetailsCache.set(imdbId, dbMatch);
    return dbMatch;
  }

  // 4. Server-side: fetch from cache or live API and auto-cache to Supabase
  return movieDetailsCache.getOrFetch(imdbId, async () => {
    try {
      const res = await fetch(`${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(imdbId)}&plot=full`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.Response === 'False') return null;
      const item = mapOMDBToMediaItem(data);
      if (data.Plot && data.Plot !== 'N/A') {
        const turkishOverview = await translateLiveText(data.Plot);
        if (turkishOverview) {
          item.overview = turkishOverview;
          item.overviewEn = data.Plot;
        }
      }

      // Auto-cache to Supabase media_catalog table asynchronously
      saveMediaItemToDb(item);

      return item;
    } catch (err) {
      console.warn(`Failed to fetch OMDB item ${imdbId}:`, err);
      return null;
    }
  });
}

export const STATIC_MASTER_CATALOG: MediaItem[] = STATIC_CATALOG;

/**
 * Masterpiece pool of highest-rated IMDb films in catalog (>= 8.3 rating)
 * Automatically cycles week-by-week so every week of the year has a distinct masterpiece.
 */
const TOP_IMDB_MASTERPIECES: MediaItem[] = STATIC_CATALOG
  .filter((item) => (item.type === 'movie' || item.type === 'anime') && (item.voteAverage || 0) >= 8.3)
  .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));

/**
 * Synchronous instant Masterpiece of the Week for 0ms initial render (prevents flash of fallback).
 */
export function getMasterpieceOfTheWeekSync(): MediaItem {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

  const pool = TOP_IMDB_MASTERPIECES.length > 0 ? TOP_IMDB_MASTERPIECES : STATIC_CATALOG;
  const selected = pool[weekNumber % pool.length];

  return {
    ...selected,
    backdropPath: MASTERPIECE_BACKDROPS[selected.id] || selected.backdropPath || selected.posterPath,
  };
}

/**
 * Live Masterpiece of the Week from OMDB API with multi-tier caching.
 */
export async function getMasterpieceOfTheWeek(): Promise<MediaItem> {
  const syncItem = getMasterpieceOfTheWeekSync();
  const item = await getOMDBDetails(syncItem.id);
  if (item) {
    if (MASTERPIECE_BACKDROPS[syncItem.id]) {
      item.backdropPath = MASTERPIECE_BACKDROPS[syncItem.id];
    }
    return item;
  }
  return syncItem;
}

/**
 * Fetches the master catalog instantly (0ms, 0 API quota used, 0 DB size).
 * Supports optional limit and offset to avoid shipping massive arrays to client views.
 */
export async function getTrendingMedia(
  type: 'all' | 'movie' | 'tv' | 'anime' = 'all',
  limit?: number,
  offset: number = 0,
): Promise<MediaItem[]> {
  if (typeof window !== 'undefined' && typeof limit === 'number' && limit > 0) {
    try {
      const res = await fetch(`/api/catalog?type=${type}&limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.items)) return data.items as MediaItem[];
      }
    } catch (err) {
      console.warn('Trending media proxy failed, falling back to local dataset:', err);
    }
  }

  const pool = type === 'all' ? STATIC_CATALOG : STATIC_CATALOG.filter((item) => item.type === type);
  if (typeof limit === 'number' && limit > 0) {
    return pool.slice(offset, offset + limit);
  }
  return pool;
}

/**
 * Fetches verified upcoming releases starting from 2026 onwards with 24-hour multi-tier caching.
 * Zero server CPU overhead, zero API exhaustion, and instant 0ms delivery for 100,000+ users.
 */
export async function getUpcomingReleases(): Promise<MediaItem[]> {
  // Browser: use the cached /api/upcoming edge route (server-only API key).
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/upcoming');
      if (!res.ok) throw new Error('upcoming proxy failed');
      const data = await res.json();
      if (Array.isArray(data?.items) && data.items.length > 0) return data.items as MediaItem[];
    } catch (err) {
      console.warn('Upcoming proxy failed, using static catalog:', err);
    }
    return STATIC_UPCOMING_CATALOG;
  }

  return trendingCatalogCache.getOrFetch(
    'upcoming_releases_2026_2027_v4',
    async () => {
      try {
        const promises = CURATED_UPCOMING_IDS.map((id) => getOMDBDetails(id));
        const results = (await Promise.all(promises)).filter((item): item is MediaItem => item !== null);

        // If live OMDB returns fewer items, blend with pre-warmed static dataset
        const sourcePool = results.length >= 8 ? results : STATIC_UPCOMING_CATALOG;

        // Filter: strictly 2026 and 2027 future releases
        const futureOnly = sourcePool.filter((item) => (item.year || 0) >= 2026);

        // Sort chronologically — releaseDate may be a Turkish-formatted string
        // ("20 Mart 2026") from live OMDB data, which new Date() cannot parse
        // (Invalid Date → NaN comparator → no-op sort).
        return futureOnly.sort((a, b) => {
          // year is guaranteed >=2026 by futureOnly filter above
          const isoA = trDateToISO(a.releaseDate) || `${a.year}-01-01`;
          const isoB = trDateToISO(b.releaseDate) || `${b.year}-01-01`;
          return isoA.localeCompare(isoB);
        });
      } catch (err) {
        console.error('Error fetching upcoming from OMDB, using static master dataset:', err);
        return STATIC_UPCOMING_CATALOG;
      }
    },
    1000 * 60 * 60 * 24 // 24 hours TTL
  );
}

/**
 * Searches the master catalog with 0ms in-memory ranked search first,
 * then falls back to OMDB worldwide live search with caching.
 */
export async function searchCatalog(query: string, limit: number = 15): Promise<MediaItem[]> {
  const normalized = normalizeTurkishText(query);
  if (!normalized) return [];

  // In the browser, query via the cached Edge API proxy
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/catalog?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
      if (!res.ok) throw new Error('search proxy failed');
      const data = await res.json();
      if (Array.isArray(data?.items)) return (data.items as MediaItem[]).slice(0, limit);
    } catch (err) {
      console.warn('Search proxy failed, using local static matches:', err);
    }
  }

  // 1. Primary: Search Supabase media_catalog (Single Source of Truth with weighted ranking)
  let dbMatches: MediaItem[] = [];
  try {
    dbMatches = await searchDbCatalog(query, limit);
  } catch (err) {
    console.warn('DB search error:', err);
  }

  if (dbMatches.length > 0) {
    return dbMatches.slice(0, limit);
  }

  // 2. Fallback to in-memory static catalog if DB is unreachable or returns 0
  const scoredMatches: { item: MediaItem; score: number }[] = [];
  const compactQuery = normalized.replace(/\s+/g, '');

  for (const item of STATIC_CATALOG) {
    const titleNorm = normalizeTurkishText(item.title);
    const originalTitleNorm = normalizeTurkishText(item.originalTitle);
    const directorNorm = normalizeTurkishText(item.director);
    const actorsNorm = normalizeTurkishText(item.actors);
    const compactTitle = titleNorm.replace(/\s+/g, '');
    const compactOriginal = originalTitleNorm.replace(/\s+/g, '');

    let score = 0;
    if (
      titleNorm === normalized ||
      originalTitleNorm === normalized ||
      compactTitle === compactQuery ||
      compactOriginal === compactQuery
    ) {
      score = 100;
    } else if (
      titleNorm.startsWith(normalized) ||
      originalTitleNorm.startsWith(normalized) ||
      compactTitle.startsWith(compactQuery)
    ) {
      score = 80;
    } else if (
      titleNorm.includes(normalized) ||
      originalTitleNorm.includes(normalized) ||
      compactTitle.includes(compactQuery)
    ) {
      score = 60;
    } else if (directorNorm.includes(normalized) || actorsNorm.includes(normalized)) {
      score = 40;
    } else if (item.genres.some((g) => normalizeTurkishText(g).includes(normalized))) {
      score = 20;
    }

    if (score > 0) {
      score += Math.min(10, item.voteAverage || 0);
      scoredMatches.push({ item, score });
    }
  }

  scoredMatches.sort((a, b) => b.score - a.score);
  const localMatches = scoredMatches.slice(0, limit).map((m) => m.item);

  if (localMatches.length > 0) {
    return localMatches.slice(0, limit);
  }

  // 3. Server-side fallback: query OMDB API once, auto-cache to Supabase for all future users
  return searchQueryCache.getOrFetch(`${normalized}_${limit}`, async () => {
    try {
      // Send ASCII normalized query to OMDB so it matches standard titles on IMDb
      const res = await fetch(
        `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(normalized)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      if (data.Response === 'False' || !data.Search) {
        return [];
      }

      // Fetch full details for top results to obtain genre, rating, and director
      const topResults = data.Search.slice(0, Math.min(8, limit));
      const detailPromises = topResults.map(async (searchItem: any) => {
        const fullDetail = await getOMDBDetails(searchItem.imdbID);
        if (fullDetail) return fullDetail;
        const mapped = mapOMDBToMediaItem(searchItem);
        // Auto-cache to Supabase
        saveMediaItemToDb(mapped);
        return mapped;
      });

      const fetched = await Promise.all(detailPromises);

      // Deduplicate
      const seenIds = new Set<string>();
      const combined: MediaItem[] = [];
      for (const item of fetched) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combined.push(item);
        }
      }

      return combined.slice(0, limit);
    } catch (err) {
      console.warn('OMDB search error:', err);
      return [];
    }
  });
}

export const searchOMDB = searchCatalog;
