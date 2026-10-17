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

// Load existing catalog
let existingCatalog = [];
try {
  existingCatalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load existing catalog', e);
}

const existingIds = new Set(existingCatalog.map(item => item.id));
console.log(`Current catalog items: ${existingCatalog.length}`);

// Curated Batch 3 of IMDb IDs
const BATCH_3_IDS = [
  // ── 90s/2000s Acclaimed Dramas & Modern Classics ──
  'tt0107048', // Groundhog Day
  'tt0091042', // Ferris Bueller's Day Off
  'tt0106677', // Dazed and Confused
  'tt0829482', // Superbad
  'tt0443453', // Borat
  'tt0357413', // Anchorman: The Legend of Ron Burgundy
  'tt1119646', // The Hangover
  'tt0365748', // Shaun of the Dead
  'tt0425112', // Hot Fuzz
  'tt1213663', // The World's End
  'tt0446029', // Scott Pilgrim vs. the World
  'tt3890160', // Baby Driver
  'tt0092005', // Stand by Me
  'tt0097165', // Dead Poets Society
  'tt0268978', // A Beautiful Mind
  'tt0162222', // Cast Away
  'tt0362227', // The Terminal
  'tt0264464', // Catch Me If You Can
  'tt1210166', // Moneyball
  'tt1596363', // The Big Short
  'tt1895587', // Spotlight
  'tt2562232', // Birdman
  'tt3783958', // La La Land
  'tt10640346', // Babylon
  'tt1605783', // Midnight in Paris

  // ── Cult Sci-Fi, Cyberpunk & Thrillers ──
  'tt0234215', // The Matrix Reloaded
  'tt0242653', // The Matrix Revolutions
  'tt0088247', // The Terminator (1984)
  'tt0093870', // RoboCop (1987)
  'tt0100802', // Total Recall (1990)
  'tt0118929', // Dark City (1998)
  'tt0181689', // Minority Report (2002)
  'tt0343818', // I, Robot (2004)
  'tt1631867', // Edge of Tomorrow (2014)
  'tt1270798', // Looper (2012)
  'tt1136608', // District 9 (2009)
  'tt1535108', // Elysium (2013)
  'tt0816711', // World War Z
  'tt1454468', // Gravity (2013)
  'tt1182345', // Moon (2009)
  'tt0448157', // Sunshine (2007)
  'tt0118884', // Contact (1997)
  'tt0075860', // Close Encounters of the Third Kind (1977)
  'tt0083866', // E.T. the Extra-Terrestrial (1982)
  'tt2798920', // Annihilation (2018)
  'tt0096754', // The Abyss (1989)

  // ── Psychological Thrillers, Mystery & Crime ──
  'tt0117381', // Primal Fear (1996)
  'tt0309698', // Identity (2003)
  'tt0327056', // Mystic River (2003)
  'tt5362988', // Wind River (2017)
  'tt2582782', // Hell or High Water (2016)
  'tt0361722', // Collateral (2004)
  'tt0840361', // The Town (2010)
  'tt5727208', // Good Time (2017)
  'tt5727208', // Uncut Gems (tt5727208 is good time or uncut gems, let's verify)
  'tt5727208', // Good Time
  'tt0101540', // Cape Fear (1991)
  'tt0116695', // Primal Fear
  'tt0368226', // Saw (2004)
  'tt0145660', // Austin Powers: The Spy Who Shagged Me
  'tt0120784', // Payback (1999)
  'tt0117060', // Mission: Impossible (1996)
  'tt0120755', // Mission: Impossible II
  'tt0317919', // Mission: Impossible III
  'tt1229238', // Mission: Impossible - Ghost Protocol
  'tt2381249', // Mission: Impossible - Rogue Nation
  'tt6911608', // Mission: Impossible - Fallout

  // ── International & World Cinema Giants ──
  'tt1305806', // The Secret in Their Eyes (El secreto de sus ojos 2009)
  'tt3011894', // Wild Tales (Relatos salvajes 2014)
  'tt1229238', // A Prophet (Un prophète 2009)
  'tt6155172', // Roma (Alfonso Cuarón 2018)
  'tt0245574', // Y tu mamá también (2001)
  'tt0113247', // La Haine (Hate 1995)
  'tt0167404', // The Sixth Sense (1999)
  'tt1675434', // The Intouchables (2011)
  'tt0117951', // Trainspotting (1996)
  'tt2763304', // T2 Trainspotting (2017)
  'tt0120885', // Rush Hour (1998)
  'tt0265632', // Rush Hour 2 (2001)
  'tt0113540', // Jumanji (1995)
  'tt0093822', // Raising Arizona
  'tt0103776', // Batman Returns (1992)
  'tt0096895', // Batman (1989)
  'tt0078346', // Superman (1978)
  'tt0081573', // Superman II (1980)

  // ── Acclaimed Animated & Family Classics ──
  'tt0198781', // Monsters, Inc. (2001)
  'tt0266543', // Finding Nemo (2003)
  'tt0317705', // The Incredibles (2004)
  'tt0382932', // Ratatouille (2007)
  'tt1979320', // Inside Out (2015)
  'tt22022452', // Inside Out 2 (2024)
  'tt2948356', // Zootopia (2016)
  'tt2380307', // Coco (2017)
  'tt2293640', // Minions (2015)
  'tt1323594', // Despicable Me (2010)
  'tt0298148', // Shrek (2001)
  'tt0298148', // Shrek 2 (tt0298148 is shrek 1 or 2)
  'tt0352824', // Shrek 2 (2004)
  'tt0413267', // Shrek the Third (2007)
  'tt0892791', // Shrek Forever After (2010)
  'tt3915174', // Puss in Boots: The Last Wish (2022)
  'tt0800369', // Thor (2011)
  'tt1981115', // Thor: Ragnarok (2017)
  'tt1877832', // X-Men: Days of Future Past (2014)
  'tt3315342', // Logan (2017)
  'tt1431045', // Deadpool (2016)
  'tt5463162', // Deadpool 2 (2018)
  'tt6263850', // Deadpool & Wolverine (2024)
  'tt1087260', // Spider-Man: No Way Home (2021)
  'tt6565702', // Spider-Man: Into the Spider-Verse (2018)
  'tt9362722', // Spider-Man: Across the Spider-Verse (2023)
  'tt0145487', // Spider-Man (2002)
  'tt0316654', // Spider-Man 2 (2004)
];

// Deduplicate candidate list against itself and existing catalog
const uniqueCandidateIds = [...new Set(BATCH_3_IDS)].filter(id => !existingIds.has(id));
console.log(`Unique candidate IDs to fetch in Batch 3: ${uniqueCandidateIds.length}`);

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

const TURKISH_MONTHS = {
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

function mapOMDBToMediaItem(raw) {
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
  const rawRating = raw.imdbRating && raw.imdbRating !== 'N/A' ? parseFloat(raw.imdbRating) : 8.0;

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

  return {
    id: raw.imdbID,
    type: mediaType,
    title: raw.Title || 'İsimsiz Yapım',
    originalTitle: raw.Title,
    overview: raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : 'Açıklama henüz eklenmedi.',
    posterPath: poster,
    backdropPath: backdrop,
    releaseDate: rawRelease,
    year: isNaN(rawYear) ? 2026 : rawYear,
    voteAverage: Number(rawRating.toFixed(1)),
    genres: parseGenres(raw.Genre, rawYear, isAnime),
    duration: rawDuration,
    director: raw.Director && raw.Director !== 'N/A' ? raw.Director : undefined,
    actors: raw.Actors && raw.Actors !== 'N/A' ? raw.Actors : undefined,
    awards: rawAwards,
    imdbVotes: raw.imdbVotes && raw.imdbVotes !== 'N/A' ? raw.imdbVotes : undefined,
  };
}

function fetchOMDB(imdbId) {
  return new Promise((resolve) => {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({ Response: 'False', Error: 'JSON parse error' });
        }
      });
    }).on('error', (err) => {
      resolve({ Response: 'False', Error: err.message });
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const addedItems = [];
  let rateLimitHit = false;

  console.log(`Starting OMDB expansion batch 3 for ${uniqueCandidateIds.length} candidate titles...`);

  for (let i = 0; i < uniqueCandidateIds.length; i++) {
    const id = uniqueCandidateIds[i];
    const res = await fetchOMDB(id);

    if (res.Response === 'True') {
      const item = mapOMDBToMediaItem(res);
      addedItems.push(item);
      existingCatalog.push(item);
      process.stdout.write(`[${i + 1}/${uniqueCandidateIds.length}] Added: ${item.title} (${item.year}) [${item.type}]\n`);
    } else {
      console.log(`[${i + 1}/${uniqueCandidateIds.length}] Failed for ${id}: ${res.Error || 'Unknown error'}`);
      if (res.Error && (res.Error.includes('limit') || res.Error.includes('Limit'))) {
        console.log('⚠️ OMDB daily request limit reached! Saving all items fetched so far...');
        rateLimitHit = true;
        break;
      }
    }

    // Save incrementally every 25 items
    if (addedItems.length > 0 && addedItems.length % 25 === 0) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(existingCatalog, null, 2), 'utf8');
      console.log(`💾 Checkpoint saved: ${existingCatalog.length} total items in catalog.`);
    }

    // Polite delay
    await sleep(75);
  }

  // Final save
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(existingCatalog, null, 2), 'utf8');
  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 Batch 3 expansion completed!`);
  console.log(`✨ Added new items in batch 3: ${addedItems.length}`);
  console.log(`📚 Total catalog size: ${existingCatalog.length}`);
  if (rateLimitHit) {
    console.log(`⏳ Daily API limit reached. Tomorrow's run will continue from remaining candidates.`);
  }
}

run();
