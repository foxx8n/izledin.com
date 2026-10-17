const fs = require('fs');
const path = require('path');
const https = require('https');
const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');

let OMDB_API_KEY = process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY || '';
if (!OMDB_API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    const m = envFile.match(/(?:OMDB_API_KEY|NEXT_PUBLIC_OMDB_API_KEY)=([^\r\n]+)/);
    if (m) OMDB_API_KEY = m[1].trim();
  } catch {}
}
if (!OMDB_API_KEY) {
  console.error('Error: OMDB_API_KEY is required in environment variables or .env.local');
  process.exit(1);
}
const TARGET_NEW_MOVIES = 1000;

// Load existing catalog
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load existing catalog:', e);
  process.exit(1);
}

const existingIds = new Set(catalog.map(item => item.id));
const initialCount = catalog.length;
console.log(`Starting bulk expansion. Initial catalog size: ${initialCount} items.`);

const OMDB_GENRE_TRANSLATION = {
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
  'mystery': 'Suç & Gizem',
  'romance': 'Romantik',
  'sci-fi': 'Bilim Kurgu',
  'short': 'Kısa Film',
  'sport': 'Spor',
  'thriller': 'Psikolojik Gerilim',
  'war': 'Savaş',
  'western': 'Vahşi Batı',
  'anime': 'Anime & Shonen',
};

const TURKISH_MONTHS = {
  'Jan': 'Ocak', 'Feb': 'Şubat', 'Mar': 'Mart', 'Apr': 'Nisan',
  'May': 'Mayıs', 'Jun': 'Haziran', 'Jul': 'Temmuz', 'Aug': 'Ağustos',
  'Sep': 'Eylül', 'Oct': 'Ekim', 'Nov': 'Kasım', 'Dec': 'Aralık',
};

function formatTurkishReleaseDate(dateStr, year) {
  if (!dateStr || dateStr === 'N/A') return year ? `${year}` : '2026';
  let formatted = dateStr;
  for (const [en, tr] of Object.entries(TURKISH_MONTHS)) {
    formatted = formatted.replace(new RegExp(`\\b${en}\\b`, 'i'), tr);
  }
  return formatted;
}

function parseGenres(rawGenreStr, rawYear, isAnime = false) {
  let list = [];
  if (rawGenreStr && rawGenreStr !== 'N/A') {
    const raw = rawGenreStr.split(',').map((g) => g.trim().toLowerCase());
    list = raw.map((g) => OMDB_GENRE_TRANSLATION[g] || g.charAt(0).toUpperCase() + g.slice(1));
  }
  if (isAnime && !list.includes('Anime & Shonen')) {
    list.unshift('Anime & Shonen');
  }
  if (rawYear && rawYear <= 1979 && !list.includes('Klasik Sinema')) {
    list.push('Klasik Sinema');
  }
  return list.length > 0 ? list : ['Popüler'];
}

function translateToTurkish(text) {
  if (!text || text === 'N/A' || text === 'Açıklama henüz eklenmedi.') {
    return Promise.resolve(text || 'Açıklama henüz eklenmedi.');
  }

  return new Promise((resolve) => {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encoded}`;

    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
            const translated = parsed[0].map(part => part[0]).filter(Boolean).join('');
            resolve(translated || text);
          } else {
            resolve(text);
          }
        } catch (e) {
          resolve(text);
        }
      });
    });

    req.on('error', () => resolve(text));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(text);
    });
  });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function generateCinemaNotes(title, director, genres, year) {
  if (director && director !== 'N/A') {
    return `${director} yönetmenliğindeki ${title}, ${genres.slice(0, 2).join(' ve ')} türünde güçlü atmosferi, kadraj derinliği ve sürükleyici sinematografisiyle öne çıkıyor.`;
  }
  return `${year} yapımı bu eser, ${genres.slice(0, 2).join(' ve ')} temalarını işleyen özgün anlatımı ve karakter dinamikleriyle izlenmeye değer bir sinematik deneyim sunuyor.`;
}

async function mapOMDBToMediaItem(raw) {
  const isSeries = raw.Type === 'series';
  const isAnime = Boolean(
    (raw.Genre && raw.Genre.toLowerCase().includes('animation') && (raw.Country?.includes('Japan') || raw.Language?.includes('Japanese'))) ||
    raw.Title?.toLowerCase().includes('attack on titan') ||
    raw.Title?.toLowerCase().includes('death note') ||
    raw.Title?.toLowerCase().includes('jujutsu') ||
    raw.Title?.toLowerCase().includes('demon slayer') ||
    raw.Title?.toLowerCase().includes('evangelion') ||
    raw.Title?.toLowerCase().includes('mononoke') ||
    raw.Title?.toLowerCase().includes('cowboy bebop')
  );

  const mediaType = isAnime ? 'anime' : isSeries ? 'tv' : 'movie';
  const rawYear = raw.Year ? parseInt(raw.Year.replace(/[^0-9]/g, '').slice(0, 4), 10) : 2026;
  const rawRating = raw.imdbRating && raw.imdbRating !== 'N/A' ? parseFloat(raw.imdbRating) : 7.0;

  const poster = raw.Poster && raw.Poster !== 'N/A'
    ? raw.Poster
    : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop';

  const backdrop = poster;
  const rawDuration = raw.Runtime && raw.Runtime !== 'N/A' ? raw.Runtime.replace(/\bmin\b/i, 'dk') : undefined;
  const rawRelease = raw.Released && raw.Released !== 'N/A' ? formatTurkishReleaseDate(raw.Released, rawYear) : `${rawYear}`;
  
  let rawAwards = raw.Awards && raw.Awards !== 'N/A' ? raw.Awards : undefined;
  if (rawAwards) {
    rawAwards = rawAwards
      .replace(/Won (\d+) Oscars?/i, '$1 Oscar Kazandı')
      .replace(/(\d+) wins/i, '$1 Ödül')
      .replace(/(\d+) nominations/i, '$1 Adaylık')
      .replace(/total/i, 'toplam');
  }

  const rawPlot = raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : '';
  const turkishPlot = rawPlot ? await translateToTurkish(rawPlot) : 'Açıklama henüz eklenmedi.';
  const genres = parseGenres(raw.Genre, rawYear, isAnime);
  const director = raw.Director && raw.Director !== 'N/A' ? raw.Director : undefined;

  return {
    id: raw.imdbID,
    type: mediaType,
    title: raw.Title || 'İsimsiz Yapım',
    originalTitle: raw.Title,
    overview: turkishPlot,
    overviewEn: rawPlot || turkishPlot,
    posterPath: poster,
    backdropPath: backdrop,
    releaseDate: rawRelease,
    year: isNaN(rawYear) ? 2026 : rawYear,
    voteAverage: Number(rawRating.toFixed(1)),
    genres: genres,
    duration: rawDuration,
    director: director,
    actors: raw.Actors && raw.Actors !== 'N/A' ? raw.Actors : undefined,
    awards: rawAwards,
    imdbVotes: raw.imdbVotes && raw.imdbVotes !== 'N/A' ? raw.imdbVotes : undefined,
    cinemaNotes: generateCinemaNotes(raw.Title, director, genres, rawYear),
  };
}

// Curated keywords & years to harvest high-rating cinema gems
const SEARCH_KEYWORDS = [
  'love', 'night', 'man', 'woman', 'city', 'world', 'dark', 'war', 'day', 'time',
  'house', 'road', 'blood', 'dead', 'life', 'story', 'dream', 'last', 'girl', 'boy',
  'red', 'blue', 'black', 'white', 'fire', 'water', 'gold', 'death', 'king', 'sun',
  'shadow', 'secret', 'wind', 'rain', 'lost', 'silent', 'wild', 'summer', 'winter', 'moon',
  'space', 'star', 'memory', 'heart', 'mind', 'eye', 'mirror', 'river', 'sea', 'sky'
];

const SEARCH_YEARS = [
  2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
  2014, 2013, 2012, 2011, 2010, 2008, 2005, 2000, 1999, 1995,
  1990, 1985, 1980, 1975, 1970, 1965, 1960
];

async function runBulkFetch() {
  console.log(`Goal: Add ${TARGET_NEW_MOVIES} new verified movies to catalog.`);
  let addedCount = 0;

  for (const year of SEARCH_YEARS) {
    if (addedCount >= TARGET_NEW_MOVIES) break;

    for (const kw of SEARCH_KEYWORDS) {
      if (addedCount >= TARGET_NEW_MOVIES) break;

      const searchUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(kw)}&y=${year}&type=movie`;
      const searchRes = await fetchJson(searchUrl);

      if (!searchRes || searchRes.Response !== 'True' || !Array.isArray(searchRes.Search)) {
        await sleep(50);
        continue;
      }

      for (const item of searchRes.Search) {
        if (addedCount >= TARGET_NEW_MOVIES) break;
        if (!item.imdbID || existingIds.has(item.imdbID)) continue;
        if (!item.Poster || item.Poster === 'N/A') continue;

        // Fetch full details
        const detailUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${item.imdbID}&plot=full`;
        const detail = await fetchJson(detailUrl);

        if (!detail || detail.Response !== 'True') continue;
        if (!detail.Poster || detail.Poster === 'N/A') continue;
        
        // Filter for good movies (rating >= 6.0 or significant votes)
        const rating = parseFloat(detail.imdbRating);
        if (isNaN(rating) || rating < 6.0) continue;

        const mediaItem = await mapOMDBToMediaItem(detail);
        catalog.push(mediaItem);
        existingIds.add(mediaItem.id);
        addedCount++;

        process.stdout.write(`[+${addedCount}/${TARGET_NEW_MOVIES}] Added: ${mediaItem.title} (${mediaItem.year}) - ⭐ ${mediaItem.voteAverage} [Total: ${catalog.length}]\n`);

        if (addedCount % 25 === 0) {
          fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
          console.log(`💾 Checkpoint: Saved ${catalog.length} total items (${addedCount} new).`);
        }

        await sleep(60);
      }

      await sleep(60);
    }
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 Finished! Added ${addedCount} new movies.`);
  console.log(`📚 Final catalog size: ${catalog.length} items.`);
}

runBulkFetch();
