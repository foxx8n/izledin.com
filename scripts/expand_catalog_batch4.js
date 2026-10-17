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

// Curated Batch 4 of IMDb IDs
const BATCH_4_IDS = [
  // ── Asian Cinema Cult & Masterpieces ──
  'tt0266308', // Battle Royale (2000)
  'tt0145653', // Cure (1997 - Kiyoshi Kurosawa)
  'tt0286751', // Pulse (Kairo 2001)
  'tt0235198', // Audition (1999 - Takashi Miike)
  'tt0296042', // Ichi the Killer (2001)
  'tt1430132', // 13 Assassins (2010)
  'tt0056058', // Harakiri (1962 - Masaki Kobayashi)
  'tt0062000', // Samurai Rebellion (1967)
  'tt0060277', // The Sword of Doom (1966)
  'tt0058279', // Kwaidan (1964)
  'tt0058430', // Onibaba (1964)
  'tt23289160', // Godzilla Minus One (2023)
  'tt4262980', // Shin Godzilla (2016)
  'tt0365376', // A Tale of Two Sisters (2003)
  'tt1190539', // The Chaser (2008)
  'tt1230385', // The Yellow Sea (2010)
  'tt1646959', // Bedevilled (2010)
  'tt5215952', // The Wailing (2016)
  'tt5700672', // Train to Busan (2016)
  'tt0456882', // A Bittersweet Life (2005)
  'tt2625030', // New World (2013)
  'tt6738136', // The Villainess (2017)
  'tt6878038', // A Taxi Driver (2017)
  'tt2070649', // Silenced (2011)
  'tt2798650', // Miracle in Cell No. 7 (2013)
  'tt10883506', // A Sun (2019)
  'tt0244316', // Yi Yi (2000 - Edward Yang)
  'tt0101985', // A Brighter Summer Day (1991 - Edward Yang)
  'tt0293416', // Millennium Mambo (2001 - Hou Hsiao-hsien)
  'tt0379225', // Goodbye, Dragon Inn (2003 - Tsai Ming-liang)
  'tt0105211', // Rebels of the Neon God (1992)
  'tt0111654', // Vive L'Amour (1994)
  'tt0101640', // Raise the Red Lantern (1991 - Zhang Yimou)
  'tt0299977', // Hero (2002 - Zhang Yimou)
  'tt0365778', // House of Flying Daggers (2004)
  'tt0190332', // Crouching Tiger, Hidden Dragon (2000)
  'tt0106332', // Farewell My Concubine (1993 - Chen Kaige)
  'tt0110081', // To Live (1994 - Zhang Yimou)
  'tt7297914', // Ash Is Purest White (2018 - Jia Zhangke)
  'tt2852400', // A Touch of Sin (2013 - Jia Zhangke)

  // ── European & Scandinavian Cult Masterpieces ──
  'tt0405094', // The Lives of Others (2006)
  'tt0363163', // Downfall (2004)
  'tt0324216', // Good Bye Lenin! (2003)
  'tt0130827', // Run Lola Run (1998)
  'tt0082096', // Das Boot (1981)
  'tt0093870', // Wings of Desire (1987)
  'tt0087884', // Paris, Texas (1984)
  'tt0083949', // Fitzcarraldo (1982)
  'tt0068182', // Aguirre, the Wrath of God (1972)
  'tt0079641', // Nosferatu the Vampyre (1979)
  'tt0013442', // Nosferatu (1922)
  'tt0017136', // Metropolis (1927)
  'tt0010323', // The Cabinet of Dr. Caligari (1920)
  'tt1139797', // Let the Right One In (2008)
  'tt1614989', // Headhunters (2011)
  'tt3655680', // The Square (2017)
  'tt2121382', // Force Majeure (2014)
  'tt0825232', // Reprise (2006)
  'tt1734433', // Oslo, August 31st (2011)
  'tt10370710', // The Worst Person in the World (2021)
  'tt0053619', // L'Avventura (1960)
  'tt0055230', // La Notte (1961)
  'tt0056166', // L'Eclisse (1962)
  'tt0060176', // Blow-Up (1966)
  'tt0058000', // Red Desert (1964)
  'tt0073580', // The Passenger (1975)
  'tt0065571', // The Conformist (1970)
  'tt0074084', // 1900 (Novecento 1976)
  'tt0068833', // Last Tango in Paris (1972)
  'tt0076786', // Suspiria (1977)
  'tt0073582', // Deep Red (Profondo Rosso 1975)
  'tt0087909', // Phenomena (1985)
  'tt0084777', // Tenebre (1982)
  'tt2358891', // The Great Beauty (2013 - Paolo Sorrentino)
  'tt3312830', // Youth (2015 - Sorrentino)
  'tt12680684', // The Hand of God (2021 - Sorrentino)
  'tt0929425', // Gomorrah (2008 Film)
  'tt4025514', // Suburra (2015 Film)
  'tt6768578', // Dogman (2018 - Matteo Garrone)
  'tt1105753', // Il Divo (2008)
  'tt3278330', // Tale of Tales (2015)
  'tt6980546', // Martin Eden (2019)

  // ── French Cinema Heavyweights & Extremity ──
  'tt2278871', // Blue Is the Warmest Color (2013)
  'tt1655442', // The Artist (2011)
  'tt0372824', // The Chorus (Les Choristes 2004)
  'tt1922777', // Dheepan (2015)
  'tt2053425', // Rust and Bone (2012)
  'tt0411270', // The Beat That My Heart Skipped (2005)
  'tt8359848', // Climax (2018 - Gaspar Noé)
  'tt4954522', // Raw (2016 - Julia Ducournau)
  'tt10944760', // Titane (2021 - Ducournau)
  'tt0290673', // Irréversible (2002 - Gaspar Noé)
  'tt1191111', // Enter the Void (2009)
  'tt3774694', // Love (2015 - Noé)
  'tt14867020', // Vortex (2021 - Noé)

  // ── 90s/2000s Pop Culture Icons & Blockbusters ──
  'tt0111161', // The Shawshank Redemption
  'tt0107290', // Jurassic Park (1993)
  'tt0119567', // The Lost World: Jurassic Park (1997)
  'tt0163025', // Jurassic Park III (2001)
  'tt0369610', // Jurassic World (2015)
  'tt0109151', // The Mask (1994)
  'tt0109686', // Dumb and Dumber (1994)
  'tt0109040', // Ace Ventura: Pet Detective (1994)
  'tt0112281', // Ace Ventura: When Nature Calls (1995)
  'tt0119523', // Liar Liar (1997)
  'tt0315327', // Bruce Almighty (2003)
  'tt0120744', // The Man in the Iron Mask (1998)
  'tt0144117', // The Beach (2000)
  'tt0364970', // Blood Diamond (2006)
  'tt0440963', // Revolutionary Road (2008)
  'tt0117281', // Primal Fear
  'tt0120804', // The Parent Trap (1998)
  'tt0120794', // Practical Magic (1998)
  'tt0120657', // The Sweet Hereafter
  'tt0103776', // Batman Returns
  'tt0112462', // Batman Forever
  'tt0118688', // Batman & Robin
  'tt0280590', // Die Another Day (2002)
  'tt0143145', // The World Is Not Enough (1999)
  'tt0120347', // Tomorrow Never Dies (1997)
  'tt0113189', // GoldenEye (1995)
  'tt0114814', // Waterworld (1995)
  'tt0117998', // Twister (1996)
  'tt0119314', // Men in Black (1997)
  'tt0120915', // Armageddon (1998)
  'tt0120647', // Deep Impact (1998)
  'tt0119177', // Gattaca
  'tt0119229', // Gross Anatomy / G.I. Jane
];

// Deduplicate candidate list against itself and existing catalog
const uniqueCandidateIds = [...new Set(BATCH_4_IDS)].filter(id => !existingIds.has(id));
console.log(`Unique candidate IDs to fetch in Batch 4: ${uniqueCandidateIds.length}`);

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

  console.log(`Starting OMDB expansion batch 4 for ${uniqueCandidateIds.length} candidate titles...`);

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
  console.log(`🎉 Batch 4 expansion completed!`);
  console.log(`✨ Added new items in batch 4: ${addedItems.length}`);
  console.log(`📚 Total catalog size: ${existingCatalog.length}`);
  if (rateLimitHit) {
    console.log(`⏳ Daily API limit reached. Tomorrow's run will continue from remaining candidates.`);
  }
}

run();
