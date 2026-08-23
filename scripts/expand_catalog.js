const fs = require('fs');
const path = require('path');
const https = require('https');

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || '9e6a1e9c';

// Load existing catalog
let existingCatalog = [];
try {
  existingCatalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load existing catalog', e);
}

const existingIds = new Set(existingCatalog.map(item => item.id));
console.log(`Current catalog items: ${existingCatalog.length}`);

// Curated pool of high-value IMDb IDs (Movies, TV, Anime, Turkish Cinema, Cult, Classics, Arthouse)
const CANDIDATE_IMDB_IDS = [
  // ── IMDb Top 250 & Masterpieces ──
  'tt0111161', // The Shawshank Redemption
  'tt0068646', // The Godfather
  'tt0071562', // The Godfather Part II
  'tt0050083', // 12 Angry Men
  'tt0108052', // Schindler's List
  'tt0167260', // LOTR: The Return of the King
  'tt0110912', // Pulp Fiction
  'tt0120737', // LOTR: The Fellowship of the Ring
  'tt0060196', // The Good, the Bad and the Ugly
  'tt0137523', // Fight Club
  'tt0109830', // Forrest Gump
  'tt0167261', // LOTR: The Two Towers
  'tt0133093', // The Matrix
  'tt0099685', // Goodfellas
  'tt0073486', // One Flew Over the Cuckoo's Nest
  'tt0114369', // Se7en
  'tt0047478', // Seven Samurai
  'tt0038650', // It's a Wonderful Life
  'tt0102926', // The Silence of the Lambs
  'tt0317248', // City of God
  'tt0120815', // Saving Private Ryan
  'tt0118799', // Life Is Beautiful
  'tt0120689', // The Green Mile
  'tt0076759', // Star Wars: Ep IV
  'tt0080684', // Star Wars: Ep V
  'tt0245429', // Spirited Away
  'tt0110413', // Léon: The Professional
  'tt0253474', // The Pianist
  'tt0103064', // Terminator 2
  'tt0088763', // Back to the Future
  'tt0054215', // Psycho
  'tt0172495', // Gladiator
  'tt0110357', // The Lion King
  'tt0407887', // The Departed
  'tt2582802', // Whiplash
  'tt0482571', // The Prestige
  'tt0078788', // Apocalypse Now
  'tt0078748', // Alien
  'tt0090605', // Aliens
  'tt0043014', // Sunset Blvd.
  'tt0209144', // Memento
  'tt0095765', // Cinema Paradiso
  'tt0095327', // Grave of the Fireflies
  'tt0047396', // Rear Window
  'tt0034583', // Casablanca
  'tt0064116', // Once Upon a Time in the West
  'tt0027977', // Modern Times
  'tt0032553', // The Great Dictator
  'tt0021749', // City Lights
  'tt0050825', // Paths of Glory
  'tt1853728', // Django Unchained
  'tt0081505', // The Shining
  'tt0910970', // WALL·E
  'tt0211915', // Amélie
  'tt0169547', // American Beauty
  'tt0075314', // Taxi Driver
  'tt0364569', // Oldboy
  'tt0119698', // Princess Mononoke
  'tt0112573', // Braveheart
  'tt0052357', // Vertigo
  'tt0062622', // 2001: A Space Odyssey
  'tt0105236', // Reservoir Dogs
  'tt0087843', // Once Upon a Time in America
  'tt0033467', // Citizen Kane
  'tt0022100', // M
  'tt0053125', // North by Northwest
  'tt0036775', // Double Indemnity
  'tt0071315', // Chinatown
  'tt0113277', // Heat
  'tt0119217', // Good Will Hunting
  'tt0180093', // Requiem for a Dream
  'tt0338013', // Eternal Sunshine of the Spotless Mind
  'tt0086250', // Scarface
  'tt0066921', // A Clockwork Orange
  'tt0056172', // Lawrence of Arabia
  'tt0093058', // Full Metal Jacket
  'tt0040522', // Bicycle Thieves
  'tt0070735', // The Sting
  'tt0086879', // Amadeus
  'tt0056592', // To Kill a Mockingbird
  'tt0361748', // Inglorious Basterds
  'tt0114702', // Toy Story
  'tt0120363', // Toy Story 2
  'tt0435761', // Toy Story 3
  'tt0208092', // Snatch
  'tt1187043', // 3 Idiots
  'tt0119488', // L.A. Confidential
  'tt0079470', // Monty Python's Life of Brian
  'tt0071853', // Monty Python and the Holy Grail
  'tt0093779', // The Princess Bride
  'tt0089881', // Ran
  'tt0042876', // Rashomon
  'tt0044741', // Ikiru
  'tt0057115', // High and Low
  'tt0055630', // Yojimbo
  'tt0056801', // 8½
  'tt0053779', // La Dolce Vita
  'tt0050783', // Nights of Cabiria
  'tt0053198', // The 400 Blows
  'tt0053472', // Breathless
  'tt0056124', // Jules and Jim
  'tt0055852', // Cleo from 5 to 7
  'tt0079944', // Stalker
  'tt0069293', // Solaris
  'tt0072443', // The Mirror
  'tt0060827', // Persona
  'tt0050976', // The Seventh Seal
  'tt0050986', // Wild Strawberries
  'tt0083922', // Fanny and Alexander
  'tt0046438', // Tokyo Story
  'tt0041154', // Late Spring

  // ── Acclaimed Modern Cinema & Festival Masterpieces ──
  'tt1160419', // Dune: Part One (2021)
  'tt15398776', // Oppenheimer (2023)
  'tt14230458', // Poor Things (2023)
  'tt23300042', // Anatomy of a Fall (2023)
  'tt7160372',  // The Zone of Interest (2023)
  'tt9603212',  // Past Lives (2023)
  'tt6710474',  // Everything Everywhere All at Once (2022)
  'tt8960382',  // The Banshees of Inisherin (2022)
  'tt14444726', // Tár (2022)
  'tt13651794', // Triangle of Sadness (2022)
  'tt1049413',  // Up (2009)
  'tt0457430',  // Pan's Labyrinth (2006)
  'tt0892769',  // How to Train Your Dragon (2010)
  'tt0363163',  // Oldeuboi (2003)
  'tt0353969',  // Memories of Murder (2003)
  'tt4016934',  // The Handmaiden (2016)
  'tt12477380', // Decision to Leave (2022)
  'tt1588170',  // I Saw the Devil (2010)
  'tt7282468',  // Burning (2018)
  'tt1392190',  // Mad Max: Fury Road (2015)
  'tt1856010',  // Blade Runner 2049 (2017)
  'tt0083658',  // Blade Runner (1982)
  'tt1025100',  // Arrival (2016)
  'tt0470752',  // Ex Machina (2014)
  'tt1798709',  // Her (2013)
  'tt0114709',  // 12 Monkeys (1995)
  'tt0119051',  // The Fifth Element (1997)
  'tt0120903',  // The Truman Show (1998)
  'tt0120669',  // Fear and Loathing in Las Vegas (1998)
  'tt0166924',  // Mulholland Drive (2001)
  'tt0119509',  // Lost Highway (1997)
  'tt0091003',  // Blue Velvet (1986)
  'tt0076009',  // Eraserhead (1977)
  'tt0381061',  // Casino Royale (2006)
  'tt1074638',  // Skyfall (2012)
  'tt0848228',  // The Avengers (2012)
  'tt4154756',  // Avengers: Infinity War (2018)
  'tt4154796',  // Avengers: Endgame (2019)
  'tt1877830',  // The Batman (2022)
  'tt0372784',  // Batman Begins (2005)
  'tt1345836',  // The Dark Knight Rises (2012)
  'tt0109831',  // Four Rooms (1995)
  'tt0116282',  // Fargo (Movie 1996)
  'tt0118715',  // The Big Lebowski (1998)
  'tt0119116',  // Gattaca (1997)
  'tt0274558',  // Donnie Darko (2001)
  'tt0443706',  // Zodiac (2007)
  'tt0780504',  // Drive (2011)
  'tt2872718',  // Nightcrawler (2014)
  'tt0477348',  // No Country for Old Men (2007)
  'tt0469494',  // There Will Be Blood (2007)
  'tt1130884',  // Shutter Island (2010)
  'tt0993846',  // The Wolf of Wall Street (2013)
  'tt1285016',  // The Social Network (2010)
  'tt0381849',  // Sin City (2005)
  'tt0388795',  // Children of Men (2006)
  'tt0434409',  // V for Vendetta (2005)
  'tt0120735',  // Lock, Stock and Two Smoking Barrels (1998)
  'tt0111495',  // The Usual Suspects (1995)
  'tt0107290',  // Jurassic Park (1993)
  'tt0120338',  // Titanic (1997)
  'tt0499549',  // Avatar (2009)
  'tt1630029',  // Avatar: The Way of Water (2022)

  // ── Anime Masterpieces & Shonen Icons ──
  'tt0405296',  // Death Note (TV)
  'tt2560140',  // Attack on Titan (TV)
  'tt1409055',  // Fullmetal Alchemist: Brotherhood (TV)
  'tt2098220',  // Hunter x Hunter (TV)
  'tt1910272',  // Steins;Gate (TV)
  'tt0213338',  // Cowboy Bebop (TV)
  'tt10233448', // Vinland Saga (TV)
  'tt0112159',  // Neon Genesis Evangelion (TV)
  'tt0434706',  // Monster (TV)
  'tt12343534', // Jujutsu Kaisen (TV)
  'tt9335498',  // Demon Slayer (TV)
  'tt13616990', // Chainsaw Man (TV)
  'tt0347149',  // Howl's Moving Castle (Movie)
  'tt5311514',  // Your Name (Movie)
  'tt5323662',  // A Silent Voice (Movie)
  'tt0094625',  // Akira (Movie)
  'tt0113568',  // Ghost in the Shell (Movie)
  'tt0156887',  // Perfect Blue (Movie)
  'tt0851578',  // Paprika (Movie)
  'tt0097958',  // Kiki's Delivery Service (Movie)
  'tt0105151',  // Porco Rosso (Movie)
  'tt0363771',  // Nausicaä of the Valley of the Wind (Movie)
  'tt0092067',  // Castle in the Sky (Movie)
  'tt0096283',  // My Neighbor Totoro (Movie)
  'tt1659221',  // The Wind Rises (Movie)
  'tt11370602', // The Boy and the Heron (Movie)
  'tt15428940', // Suzume (Movie)
  'tt0244365',  // Samurai Champloo (TV)
  'tt0877057',  // Code Geass (TV)
  'tt5834262',  // Mob Psycho 100 (TV)
  'tt4508902',  // One Punch Man (TV)
  'tt12590266', // Cyberpunk: Edgerunners (TV)
  'tt14331144', // Jujutsu Kaisen 0 (Movie)
  'tt0434665',  // Bleach (TV)
  'tt0409591',  // Naruto (TV)
  'tt0988824',  // Naruto: Shippuden (TV)
  'tt0388629',  // One Piece (TV)
  'tt0214341',  // Dragon Ball Z (TV)
  'tt3398540',  // Haikyuu!! (TV)
  'tt0990407',  // Gurren Lagann (TV)
  'tt3501074',  // Ping Pong the Animation (TV)
  'tt13556428', // Frieren: Beyond Journey's End (TV)
  'tt0379632',  // Berserk (1997)
  'tt0235917',  // Initial D (TV)
  'tt2267998',  // Psycho-Pass (TV)
  'tt3743702',  // Parasyte: The Maxim (TV)
  'tt3570618',  // Tokyo Ghoul (TV)
  'tt0268884',  // Hellsing (TV)
  'tt0495212',  // Hellsing Ultimate (TV)
  'tt1637725',  // Erased (TV)
  'tt2301451',  // Dororo (TV)
  'tt14389024', // Oshi no Ko (TV)
  'tt14001894', // Hell's Paradise (TV)
  'tt13401080', // Blue Lock (TV)

  // ── TV Drama Masterpieces & Prestige Shows ──
  'tt0903747', // Breaking Bad
  'tt0306414', // The Wire
  'tt0185906', // The Sopranos
  'tt8707010', // Chernobyl
  'tt0270846', // Band of Brothers
  'tt0944947', // Game of Thrones
  'tt3032476', // Better Call Saul
  'tt1475582', // Sherlock
  'tt0475784', // Westworld
  'tt11280740', // Severance
  'tt7660850', // Succession
  'tt11198330', // House of the Dragon
  'tt1190634', // The Boys
  'tt11126994', // Arcane
  'tt14452776', // The Bear
  'tt2788310', // Shogun (2024)
  'tt3581920', // The Last of Us
  'tt2357547', // True Detective
  'tt2802850', // Fargo (TV)
  'tt5753856', // Dark
  'tt2442560', // Peaky Blinders
  'tt2085059', // Black Mirror
  'tt5290382', // Mindhunter
  'tt5687612', // Fleabag
  'tt0386676', // The Office (US)
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
  'tt4635276', // Gomorrah (TV)
  'tt1548856', // Homeland
  'tt0284717', // Six Feet Under
  'tt0384766', // Rome
  'tt0348914', // Deadwood
  'tt0141842', // The Shield

  // ── Turkish Cinema Masterpieces & Cult Classics ──
  'tt2758880', // Kış Uykusu
  'tt1827487', // Bir Zamanlar Anadolu'da
  'tt6628394', // Ahlat Ağacı
  'tt13444408', // Kuru Otlar Üstüne
  'tt0127657', // Masumiyet
  'tt0851410', // Kader
  'tt0346094', // Uzak
  'tt0498097', // İklimler
  'tt1233381', // Üç Maymun
  'tt0476735', // Babam ve Oğlum
  'tt0116231', // Eşkıya
  'tt0093574', // Muhsin Bey
  'tt0263996', // Sevmek Zamanı
  'tt0089881', // Züğürt Ağa
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

  // ── Arthouse & World Cinema Giants ──
  'tt0108394', // Three Colors: Blue
  'tt0111507', // Three Colors: White
  'tt0111495', // Three Colors: Red
  'tt0102685', // The Double Life of Véronique
  'tt0096563', // Dekalog
  'tt0387898', // Caché
  'tt1028528', // The White Ribbon
  'tt1602620', // Amour
  'tt0254686', // The Piano Teacher
  'tt0119167', // Funny Games
  'tt2076220', // Holy Motors
  'tt8613070', // Portrait of a Lady on Fire
  'tt14039582', // Drive My Car
  'tt0113703', // Fallen Angels
  'tt0245238', // In the Mood for Love
  'tt0109424', // Chungking Express
  'tt0212712', // 2046
  'tt0118842', // Happy Together
  'tt0099077', // Days of Being Wild
  'tt0120265', // Taste of Cherry
  'tt0100234', // Close-Up
  'tt0120484', // The Wind Will Carry Us
  'tt1407049', // Certified Copy
  'tt1832382', // A Separation
  'tt5186714', // The Salesman
  'tt2404435', // The Past
  'tt4377468', // Taxi
  'tt0247745', // Talk to Her
  'tt0185125', // All About My Mother
  'tt1189073', // The Skin I Live In
  'tt8291806', // Pain and Glory
  'tt0119360', // The Ice Storm
  'tt0120657', // The Sweet Hereafter
  'tt0118694', // The Blade
  'tt0472476', // 4 Months, 3 Weeks and 2 Days
  'tt1663662', // The Hunt
  'tt10288566', // Another Round
  'tt0154420', // Festen
  'tt0115751', // Breaking the Waves
  'tt0168629', // Dancer in the Dark
  'tt0342304', // Dogville
  'tt0870984', // Melancholia
  'tt1560977', // Antichrist
];

// Deduplicate candidate list against itself and existing catalog
const uniqueCandidateIds = [...new Set(CANDIDATE_IMDB_IDS)].filter(id => !existingIds.has(id));
console.log(`Unique candidate IDs to fetch: ${uniqueCandidateIds.length}`);

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

  console.log(`Starting OMDB expansion for ${uniqueCandidateIds.length} candidate titles...`);

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

    // Save incrementally every 25 items so nothing is lost
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
  console.log(`🎉 Expansion completed!`);
  console.log(`✨ Added new items today: ${addedItems.length}`);
  console.log(`📚 Total catalog size: ${existingCatalog.length}`);
  if (rateLimitHit) {
    console.log(`⏳ Daily API limit reached. Tomorrow's run will continue from remaining candidates.`);
  }
}

run();
