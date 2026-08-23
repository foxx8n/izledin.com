const fs = require('fs');
const path = require('path');
const https = require('https');

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');

let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load existing catalog:', e);
  process.exit(1);
}

const existingIds = new Set(catalog.map(c => c.id));
const existingTitles = new Set(catalog.map(c => c.title.toLowerCase().trim()));
console.log(`Starting Anime & TV expansion. Initial catalog: ${catalog.length} items.`);

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
  'science-fiction': 'Bilim Kurgu',
  'science fiction': 'Bilim Kurgu',
  'sci-fi': 'Bilim Kurgu',
  'thriller': 'Psikolojik Gerilim',
  'war': 'Savaş',
  'western': 'Vahşi Batı',
  'anime': 'Anime & Shonen',
  'supernatural': 'Korku',
  'legal': 'Suç & Gizem',
  'medical': 'Dram',
  'espionage': 'Suç & Gizem',
};

function parseGenres(rawGenres, isAnime = false) {
  let list = [];
  if (Array.isArray(rawGenres)) {
    for (const g of rawGenres) {
      const lower = g.toLowerCase().trim();
      const tr = OMDB_GENRE_TRANSLATION[lower] || OMDB_GENRE_TRANSLATION[lower.replace('-', ' ')];
      if (tr && !list.includes(tr)) {
        list.push(tr);
      }
    }
  }
  if (isAnime && !list.includes('Anime & Shonen')) {
    list.unshift('Anime & Shonen');
  }
  return list.length > 0 ? list : [isAnime ? 'Anime & Shonen' : 'Dram'];
}

function cleanHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim();
}

async function translateWithClients5(text) {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=tr&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json) && json[0]) {
      return json[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function translateWithMyMemory(text) {
  const truncated = text.length > 500 ? text.slice(0, 500) : text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=en|tr`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.responseData?.translatedText) {
      return json.responseData.translatedText;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function translateToTurkish(text) {
  if (!text || text.length < 5) return 'Açıklama henüz eklenmedi.';
  let tr = await translateWithClients5(text);
  if (tr && tr !== text) return tr;
  tr = await translateWithMyMemory(text);
  if (tr && tr !== text) return tr;
  return text;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function generateCinemaNotes(title, genres, type, rating) {
  const typeStr = type === 'anime' ? 'anime yapımı' : 'televizyon dizisi';
  return `⭐ ${rating} puan ortalamasına sahip bu ${typeStr}, ${genres.slice(0, 2).join(' ve ')} türünde güçlü hikaye örgüsü, derin karakter gelişimleri ve atmosferiyle izleyicileri ekrana bağlayan bir kült eserdir.`;
}

// Check if show is anime based on genres, country, language, or title
function isAnimeShow(show) {
  const name = (show.name || '').toLowerCase();
  const country = (show.network?.country?.code || show.webChannel?.country?.code || '').toUpperCase();
  const lang = (show.language || '').toLowerCase();
  const genres = (show.genres || []).map(g => g.toLowerCase());
  
  if (genres.includes('anime') || lang === 'japanese' || country === 'JP') return true;
  
  const animeKeywords = [
    'naruto', 'bleach', 'dragon ball', 'hunter x hunter', 'jujutsu', 'demon slayer',
    'titan', 'hero academia', 'tokyo ghoul', 'death note', 'evangelion', 'cowboy bebop',
    'steins;gate', 'chainsaw man', 'vinland saga', 'fullmetal', 'mob psycho', 'one punch',
    'sailor moon', 'inuyasha', 'yu-gi-oh', 'code geass', 'fate/', 'berserk', 'sword art online',
    'gundam', 'fairy tail', 'black clover', 'haikyuu', 'slam dunk', 'clannad', 'gintama',
    'monster', 'parasyte', 'dororo', 'erased', 'violet evergarden', 'bocchi', 'frieren',
    'solo leveling', 'kaiju', 'dungeon', 'dandadan', 'blue lock', 'spy x family', 'horimiya'
  ];
  
  return animeKeywords.some(kw => name.includes(kw));
}

async function run() {
  const targetAnimeCount = 120;
  const targetTvCount = 120;

  const collectedAnime = [];
  const collectedTv = [];

  console.log('Fetching top series and anime from TVMaze pages...');

  for (let page = 0; page <= 8; page++) {
    try {
      const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`);
      if (!res.ok) continue;
      const shows = await res.json();
      if (!Array.isArray(shows)) continue;

      for (const show of shows) {
        if (!show.name || !show.image?.original || !show.summary) continue;
        const cleanSummary = cleanHtml(show.summary);
        if (cleanSummary.length < 80) continue;

        const titleLower = show.name.toLowerCase().trim();
        if (existingTitles.has(titleLower)) continue;

        const rating = show.rating?.average || 7.5;
        const year = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : 2020;
        const isAnime = isAnimeShow(show);

        // Filter for top rated
        if (isAnime) {
          if (collectedAnime.length < targetAnimeCount && rating >= 7.2) {
            collectedAnime.push({ show, isAnime: true, rating, year, cleanSummary });
            existingTitles.add(titleLower);
          }
        } else {
          if (collectedTv.length < targetTvCount && rating >= 8.0) {
            collectedTv.push({ show, isAnime: false, rating, year, cleanSummary });
            existingTitles.add(titleLower);
          }
        }

        if (collectedAnime.length >= targetAnimeCount && collectedTv.length >= targetTvCount) break;
      }
    } catch (err) {
      console.warn(`Error on page ${page}:`, err.message);
    }
  }

  console.log(`Collected ${collectedAnime.length} candidate Anime and ${collectedTv.length} candidate TV Series.`);

  const allNewCandidates = [...collectedAnime, ...collectedTv];
  console.log(`Processing translations for ${allNewCandidates.length} total items in parallel chunks...`);

  const CHUNK_SIZE = 10;
  let addedCount = 0;

  for (let i = 0; i < allNewCandidates.length; i += CHUNK_SIZE) {
    const chunk = allNewCandidates.slice(i, i + CHUNK_SIZE);

    await Promise.all(chunk.map(async ({ show, isAnime, rating, year, cleanSummary }, idx) => {
      const globalIdx = i + idx + 1;
      const type = isAnime ? 'anime' : 'tv';
      const cleanId = `tt_tv_${type}_${show.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24)}_${year}`;
      
      const genres = parseGenres(show.genres, isAnime);
      const turkishOverview = await translateToTurkish(cleanSummary);

      const mediaItem = {
        id: cleanId,
        type: type,
        title: show.name,
        originalTitle: show.name,
        overview: turkishOverview,
        overviewEn: cleanSummary,
        posterPath: show.image.original || show.image.medium,
        backdropPath: show.image.original || show.image.medium,
        releaseDate: show.premiered || `${year}`,
        year: year,
        voteAverage: Number(rating.toFixed(1)),
        genres: genres,
        duration: show.averageRuntime ? `${show.averageRuntime} dk` : show.runtime ? `${show.runtime} dk` : undefined,
        cinemaNotes: generateCinemaNotes(show.name, genres, type, rating),
      };

      catalog.push(mediaItem);
      existingIds.add(mediaItem.id);
      addedCount++;

      process.stdout.write(`[${globalIdx}/${allNewCandidates.length}] Added [${type.toUpperCase()}]: ${show.name} (${year}) - ⭐ ${rating} [Catalog total: ${catalog.length}]\n`);
    }));

    if (addedCount % 30 === 0 || i + CHUNK_SIZE >= allNewCandidates.length) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      console.log(`💾 Checkpoint: Saved catalog with ${catalog.length} items.`);
    }

    await sleep(80);
  }

  // Final verification sweep
  console.log('──────────────────────────────────────────────────────');
  console.log(`🔍 Final verification sweep across all ${catalog.length} items...`);
  let missingTr = 0;
  let missingEn = 0;

  for (const item of catalog) {
    if (!item.overview || item.overview.length < 10) missingTr++;
    if (!item.overviewEn || item.overviewEn.length < 10) missingEn++;
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 Expansion Complete!`);
  console.log(`📚 Final catalog size: ${catalog.length} items`);
  console.log(`🎬 Movies: ${catalog.filter(c => c.type === 'movie').length}`);
  console.log(`⛩️ Anime: ${catalog.filter(c => c.type === 'anime').length}`);
  console.log(`📺 TV Series: ${catalog.filter(c => c.type === 'tv').length}`);
  console.log(`✅ Missing Turkish overviews: ${missingTr}`);
  console.log(`✅ Missing English overviews: ${missingEn}`);
}

run();
