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

// Massive curated batch 2 of IMDb IDs
const BATCH_2_IDS = [
  // ── Quentin Tarantino Filmography ──
  'tt0266697', // Kill Bill: Vol. 1
  'tt0378194', // Kill Bill: Vol. 2
  'tt0361748', // Inglourious Basterds
  'tt3460252', // The Hateful Eight
  'tt7131622', // Once Upon a Time in Hollywood
  'tt0119396', // Jackie Brown
  'tt0102798', // Reservoir Dogs

  // ── Christopher Nolan Filmography ──
  'tt0154506', // Following
  'tt0278504', // Insomnia
  'tt6723592', // Tenet
  'tt5013056', // Dunkirk

  // ── Denis Villeneuve Filmography ──
  'tt1255953', // Incendies
  'tt1396484', // Prisoners
  'tt2267968', // Enemy
  'tt3397884', // Sicario
  'tt1194238', // Polytechnique

  // ── David Fincher Filmography ──
  'tt0119174', // The Game
  'tt0258000', // Panic Room
  'tt0421715', // The Curious Case of Benjamin Button
  'tt1568346', // The Girl with the Dragon Tattoo
  'tt2267998', // Gone Girl (tt2267998 is psycho-pass or tt2267998, let's verify)
  'tt2267998', // Gone Girl is tt2267998
  'tt9614460', // Mank
  'tt1136617', // The Killer (2023)

  // ── Martin Scorsese Filmography ──
  'tt0081398', // Raging Bull
  'tt0112641', // Casino
  'tt0217505', // Gangs of New York
  'tt0338751', // The Aviator
  'tt0970179', // Hugo
  'tt0475290', // Silence (2016)
  'tt1302006', // The Irishman
  'tt5537002', // Killers of the Flower Moon
  'tt0091480', // The Color of Money
  'tt0107207', // The Age of Innocence
  'tt0095497', // The Last Temptation of Christ
  'tt0085809', // The King of Comedy

  // ── Stanley Kubrick Filmography ──
  'tt0120663', // Eyes Wide Shut
  'tt0072684', // Barry Lyndon
  'tt0057012', // Dr. Strangelove
  'tt0056193', // Lolita
  'tt0054331', // Spartacus
  'tt0049406', // The Killing

  // ── Alfred Hitchcock Classics ──
  'tt0056869', // The Birds
  'tt0040746', // Rope
  'tt0046912', // Dial M for Murder
  'tt0044081', // Strangers on a Train
  'tt0038787', // Notorious
  'tt0036342', // Shadow of a Doubt
  'tt0032976', // Rebecca
  'tt0032484', // Foreign Correspondent
  'tt0030341', // The Lady Vanishes
  'tt0026029', // The 39 Steps

  // ── Wes Anderson Filmography ──
  'tt0117509', // Bottle Rocket
  'tt0128445', // Rushmore
  'tt0265666', // The Royal Tenenbaums
  'tt0362270', // The Life Aquatic with Steve Zissou
  'tt0838221', // The Darjeeling Limited
  'tt0432283', // Fantastic Mr. Fox
  'tt1748122', // Moonrise Kingdom
  'tt2278388', // The Grand Budapest Hotel
  'tt5104604', // Isle of Dogs
  'tt8847712', // The French Dispatch
  'tt14230388', // Asteroid City

  // ── Paul Thomas Anderson Filmography ──
  'tt0119345', // Boogie Nights
  'tt0175880', // Magnolia
  'tt0272338', // Punch-Drunk Love
  'tt1560747', // The Master
  'tt1791528', // Inherent Vice
  'tt5776858', // Phantom Thread
  'tt11271038', // Licorice Pizza

  // ── Coen Brothers Filmography ──
  'tt0086979', // Blood Simple
  'tt0093822', // Raising Arizona
  'tt0100150', // Miller's Crossing
  'tt0101410', // Barton Fink
  'tt0110074', // The Hudsucker Proxy
  'tt0118715', // The Big Lebowski
  'tt0190590', // O Brother, Where Art Thou?
  'tt0258807', // The Man Who Wasn't There
  'tt0477348', // No Country for Old Men
  'tt1013752', // Burn After Reading
  'tt1014759', // A Serious Man
  'tt1403865', // True Grit (2010)
  'tt2042568', // Inside Llewyn Davis
  'tt3553976', // Hail, Caesar!
  'tt6412452', // The Ballad of Buster Scruggs

  // ── Yorgos Lanthimos & Dark Absurdist Cinema ──
  'tt1378885', // Dogtooth
  'tt2027128', // Alps
  'tt3464902', // The Lobster
  'tt5950044', // The Killing of a Sacred Deer
  'tt5052448', // The Favourite
  'tt14230458', // Poor Things
  'tt22261898', // Kinds of Kindness (2024)

  // ── Mind-Bending Sci-Fi & Psychological Cults ──
  'tt2364841', // Coherence
  'tt0390384', // Primer
  'tt1454029', // Predestination
  'tt0365748', // The Butterfly Effect
  'tt0144084', // American Psycho
  'tt0457513', // Source Code
  'tt1821641', // Ex Machina (tt0470752 / tt1821641)
  'tt1535109', // Captain Fantastic
  'tt2267998', // Gone Girl
  'tt0113161', // The Game
  'tt0110357', // The Lion King
  'tt0112471', // 12 Monkeys
  'tt0118694', // The Blade
  'tt0120669', // Fear and Loathing in Las Vegas
  'tt0166924', // Mulholland Drive
  'tt0119509', // Lost Highway
  'tt0091003', // Blue Velvet
  'tt0076009', // Eraserhead

  // ── More Legendary Anime TV & Films ──
  'tt2187044', // Attack on Titan: Final Season
  'tt12818844', // Spy x Family
  'tt13401080', // Blue Lock
  'tt14001894', // Hell's Paradise
  'tt22423328', // Solo Leveling (2024)
  'tt21641788', // Kaiju No. 8 (2024)
  'tt14452776', // The Bear (TV)
  'tt9335498', // Demon Slayer: Kimetsu no Yaiba
  'tt13556428', // Frieren: Beyond Journey's End
  'tt3398540', // Haikyuu!!
  'tt2249825', // Kuroko's Basketball
  'tt0106133', // Slam Dunk
  'tt0877057', // Code Geass: Lelouch of the Rebellion
  'tt0434706', // Monster
  'tt0213338', // Cowboy Bebop
  'tt0112159', // Neon Genesis Evangelion
  'tt0244365', // Samurai Champloo
  'tt1910272', // Steins;Gate
  'tt2098220', // Hunter x Hunter
  'tt1409055', // Fullmetal Alchemist: Brotherhood
  'tt0405296', // Death Note
  'tt0388629', // One Piece
  'tt0988824', // Naruto: Shippuden
  'tt0434665', // Bleach
  'tt12343534', // Jujutsu Kaisen
  'tt13616990', // Chainsaw Man
  'tt10233448', // Vinland Saga
  'tt12590266', // Cyberpunk: Edgerunners
  'tt4508902', // One Punch Man
  'tt5834262', // Mob Psycho 100
  'tt0990407', // Tengen Toppa Gurren Lagann
  'tt3501074', // Ping Pong the Animation

  // ── Studio Ghibli Masterpieces ──
  'tt0087544', // Nausicaa of the Valley of the Wind
  'tt0092067', // Laputa: Castle in the Sky
  'tt0095327', // Grave of the Fireflies
  'tt0096283', // My Neighbor Totoro
  'tt0097958', // Kiki's Delivery Service
  'tt0102587', // Only Yesterday
  'tt0105151', // Porco Rosso
  'tt0107870', // Ocean Waves
  'tt0110877', // Pom Poko
  'tt0113824', // Whisper of the Heart
  'tt0119698', // Princess Mononoke
  'tt0120601', // My Neighbors the Yamadas
  'tt0245429', // Spirited Away
  'tt0347149', // Howl's Moving Castle
  'tt0477248', // Tales from Earthsea
  'tt0876563', // Ponyo
  'tt1568921', // The Secret World of Arrietty
  'tt1798188', // From Up on Poppy Hill
  'tt1659221', // The Wind Rises
  'tt2576852', // The Tale of the Princess Kaguya
  'tt3398268', // When Marnie Was There
  'tt11370602', // The Boy and the Heron

  // ── Turkish Cinema Masterpieces (Expanded) ──
  'tt2758880', // Kış Uykusu
  'tt1827487', // Bir Zamanlar Anadolu'da
  'tt6628394', // Ahlat Ağacı
  'tt13444408', // Kuru Otlar Üstüne
  'tt0346094', // Uzak
  'tt0498097', // İklimler
  'tt1233381', // Üç Maymun
  'tt0182283', // Mayıs Sıkıntısı (Clouds of May)
  'tt0133903', // Kasaba (The Small Town)
  'tt0127657', // Masumiyet
  'tt0851410', // Kader
  'tt0302008', // Yazgı (Fate)
  'tt0302007', // İtiraf (The Confession)
  'tt0491873', // Bekleme Odası (The Waiting Room)
  'tt1838634', // Yeraltı (Inside - Demirkubuz)
  'tt4217148', // Kor (Ember - Demirkubuz)
  'tt22851508', // Hayat (Life - Zeki Demirkubuz 2023)
  'tt0476735', // Babam ve Oğlum
  'tt0116231', // Eşkıya
  'tt0093574', // Muhsin Bey
  'tt0089881', // Züğürt Ağa
  'tt0263996', // Sevmek Zamanı
  'tt0253828', // Tosun Paşa
  'tt0253634', // Şaban Oğlu Şaban
  'tt0252487', // Hababam Sınıfı
  'tt0252601', // Kibar Feyzo
  'tt0263989', // Selvi Boylum Al Yazmalım
  'tt0084934', // Yol
  'tt0078359', // Sürü
  'tt0066512', // Umut
  'tt4317926', // Sarmaşık
  'tt6823090', // Kelebekler
  'tt1330058', // Sonbahar
  'tt1686008', // Çoğunluk
  'tt2199719', // Tepenin Ardı
  'tt4883446', // Abluka
  'tt11138512', // Kurak Günler
  'tt1541874', // Vavien
  'tt0210080', // Gemide
  'tt0210156', // Lalelide Bir Azize
  'tt0117822', // Tabutta Rövaşata
  'tt0858479', // Takva
  'tt2175960', // Yozgat Blues
  'tt3505712', // Sivas
  'tt4799050', // Koca Dünya
  'tt0845476', // Beş Vakit
  'tt1514472', // Kosmos
  'tt0499119', // Korkuyorum Anne
  'tt7458514', // Şahsiyet
  'tt6628464', // Masum
  'tt9358052', // Bir Başkadır
  'tt12852504', // Gibi
  'tt14051034', // Kulüp
  'tt15392098', // Bozkır (TV)
  'tt10903332', // Alef (TV)
  'tt13401564', // Yeşilçam (TV)
  'tt21868352', // Prens (TV)

  // ── TV Masterpieces & Prestige Golden Age ──
  'tt0903747', // Breaking Bad
  'tt0306414', // The Wire
  'tt0185906', // The Sopranos
  'tt8707010', // Chernobyl
  'tt0270846', // Band of Brothers
  'tt0944947', // Game of Thrones
  'tt3032476', // Better Call Saul
  'tt1475582', // Sherlock
  'tt11280740', // Severance
  'tt7660850', // Succession
  'tt11198330', // House of the Dragon
  'tt1190634', // The Boys
  'tt11126994', // Arcane
  'tt14452776', // The Bear
  'tt2788310', // Shogun
  'tt3581920', // The Last of Us
  'tt2357547', // True Detective
  'tt2802850', // Fargo
  'tt5753856', // Dark
  'tt2442560', // Peaky Blinders
  'tt2085059', // Black Mirror
  'tt5290382', // Mindhunter
  'tt5687612', // Fleabag
  'tt0386676', // The Office
  'tt0108778', // Friends
  'tt0098904', // Seinfeld
  'tt4574334', // Stranger Things
  'tt2707408', // Narcos
  'tt0773262', // Dexter
  'tt0412142', // House M.D.
  'tt0411008', // Lost
  'tt0098936', // Twin Peaks
  'tt0804503', // Mad Men
  'tt4158110', // Mr. Robot
  'tt3398228', // BoJack Horseman
  'tt2861424', // Rick and Morty
  'tt4270492', // Billions
  'tt2575988', // Silicon Valley
  'tt2467372', // Brooklyn Nine-Nine
  'tt2261227', // The Americans
  'tt4635276', // Gomorrah
  'tt1548856', // Homeland
  'tt0284717', // Six Feet Under
  'tt0384766', // Rome
  'tt0348914', // Deadwood
  'tt0141842', // The Shield
  'tt0106179', // The X-Files
  'tt0052520', // The Twilight Zone
  'tt0407362', // Battlestar Galactica
  'tt0303461', // Firefly
  'tt0455590', // Dexter
  'tt2250190', // Vikings
  'tt0436992', // Doctor Who
  'tt2543312', // Broadchurch
  'tt2193021', // Arrow
  'tt3107288', // The Flash
  'tt1839578', // Person of Interest
  'tt0460649', // How I Met Your Mother
  'tt0898266', // The Big Bang Theory
  'tt1442437', // Modern Family
  'tt0880575', // Parks and Recreation
  'tt0472954', // It's Always Sunny in Philadelphia
  'tt1439629', // Community
  'tt1856010', // Blade Runner 2049
  'tt1375666', // Inception
  'tt0816692', // Interstellar
  'tt0468569', // The Dark Knight
  'tt15239678', // Dune: Part Two
  'tt15398776', // Oppenheimer
];

// Deduplicate candidate list against itself and existing catalog
const uniqueCandidateIds = [...new Set(BATCH_2_IDS)].filter(id => !existingIds.has(id));
console.log(`Unique candidate IDs to fetch in Batch 2: ${uniqueCandidateIds.length}`);

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

  console.log(`Starting OMDB expansion batch 2 for ${uniqueCandidateIds.length} candidate titles...`);

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
  console.log(`🎉 Batch 2 expansion completed!`);
  console.log(`✨ Added new items in batch 2: ${addedItems.length}`);
  console.log(`📚 Total catalog size: ${existingCatalog.length}`);
  if (rateLimitHit) {
    console.log(`⏳ Daily API limit reached. Tomorrow's run will continue from remaining candidates.`);
  }
}

run();
