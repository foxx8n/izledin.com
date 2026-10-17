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
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load existing catalog:', e);
  process.exit(1);
}

const existingIds = new Set(catalog.map(item => item.id));
console.log(`Current catalog items: ${catalog.length}`);

// Curated pool of high-value IMDb IDs (Masterpieces, Cult, World Cinema, Turkish Cinema, Anime, Classics)
const CANDIDATE_IMDB_IDS = [
  // ── Cannes / Golden Palm / International Masterpieces ──
  'tt0056058', // Harakiri (1962)
  'tt0058279', // Kwaidan (1964)
  'tt0058430', // Onibaba (1964)
  'tt0062000', // Samurai Rebellion (1967)
  'tt0060277', // The Sword of Doom (1966)
  'tt0046438', // Tokyo Story (1953 - Yasujiro Ozu)
  'tt0041154', // Late Spring (1949 - Ozu)
  'tt0043509', // Early Summer (1951 - Ozu)
  'tt0053137', // Floating Weeds (1959 - Ozu)
  'tt0046478', // Ugetsu (1953 - Kenji Mizoguchi)
  'tt0047445', // Sansho the Bailiff (1954 - Mizoguchi)
  'tt0045152', // The Life of Oharu (1952 - Mizoguchi)
  'tt0050511', // The Seventh Seal (1957 - Ingmar Bergman)
  'tt0050976', // Wild Strawberries (1957 - Bergman)
  'tt0059576', // Persona (1966 - Bergman)
  'tt0068424', // Cries and Whispers (1972 - Bergman)
  'tt0084347', // Fanny and Alexander (1982 - Bergman)
  'tt0055546', // Through a Glass Darkly (1961 - Bergman)
  'tt0057590', // Winter Light (1963 - Bergman)
  'tt0057588', // The Silence (1963 - Bergman)
  'tt0063071', // Hour of the Wolf (1968 - Bergman)
  'tt0064787', // The Passion of Anna (1969 - Bergman)
  'tt0070644', // Scenes from a Marriage (1974 - Bergman)
  'tt0077711', // Autumn Sonata (1978 - Bergman)
  'tt0073582', // Deep Red (Profondo Rosso 1975)
  'tt0076786', // Suspiria (1977 - Dario Argento)
  'tt0087909', // Phenomena (1985)
  'tt0084777', // Tenebre (1982)
  'tt0053619', // L'Avventura (1960 - Antonioni)
  'tt0055230', // La Notte (1961 - Antonioni)
  'tt0056166', // L'Eclisse (1962 - Antonioni)
  'tt0058000', // Red Desert (1964 - Antonioni)
  'tt0060176', // Blow-Up (1966 - Antonioni)
  'tt0073580', // The Passenger (1975 - Antonioni)
  'tt0053976', // La Dolce Vita (1960 - Fellini)
  'tt0056801', // 8½ (1963 - Fellini)
  'tt0047155', // La Strada (1954 - Fellini)
  'tt0050783', // Nights of Cabiria (1957 - Fellini)
  'tt0069712', // Amarcord (1973 - Fellini)
  'tt0040522', // Bicycle Thieves (1948 - De Sica)
  'tt0044997', // Umberto D. (1952 - De Sica)
  'tt0038854', // Shoeshine (1946 - De Sica)
  'tt0037988', // Rome, Open City (1945 - Rossellini)
  'tt0038830', // Paisan (1946 - Rossellini)
  'tt0047649', // Journey to Italy (1954 - Rossellini)
  'tt0056108', // The Leopard (Il Gattopardo 1963 - Visconti)
  'tt0054257', // Rocco and His Brothers (1960 - Visconti)
  'tt0067445', // Death in Venice (1971 - Visconti)
  'tt0073471', // Jeanne Dielman (1975 - Chantal Akerman)
  'tt0074966', // News from Home (1977 - Akerman)
  'tt0069509', // Celine and Julie Go Boating (1974 - Jacques Rivette)
  'tt0052561', // The 400 Blows (1959 - Truffaut)
  'tt0053677', // Breathless (À bout de souffle 1960 - Godard)
  'tt0055032', // Jules and Jim (1962 - Truffaut)
  'tt0056632', // Vivre Sa Vie (1962 - Godard)
  'tt0057012', // Contempt (Le Mépris 1963 - Godard)
  'tt0058946', // Alphaville (1965 - Godard)
  'tt0059592', // Pierrot le Fou (1965 - Godard)
  'tt0060665', // Masculin Féminin (1966 - Godard)
  'tt0061405', // Belle de Jour (1967 - Buñuel)
  'tt0069415', // The Discreet Charm of the Bourgeoisie (1972 - Buñuel)
  'tt0076837', // That Obscure Object of Desire (1977 - Buñuel)
  'tt0056592', // The Exterminating Angel (1962 - Buñuel)
  'tt0042784', // Los Olvidados (1950 - Buñuel)
  'tt0055614', // Viridiana (1961 - Buñuel)
  'tt0052902', // Hiroshima Mon Amour (1959 - Alain Resnais)
  'tt0055184', // Last Year at Marienbad (1961 - Resnais)
  'tt0050858', // Mon Oncle (1958 - Jacques Tati)
  'tt0062136', // Playtime (1967 - Jacques Tati)
  'tt0046534', // Monsieur Hulot's Holiday (1953 - Tati)
  'tt0056346', // Cleo from 5 to 7 (1962 - Agnès Varda)
  'tt0059005', // Le Bonheur (1965 - Varda)
  'tt0089960', // Vagabond (Sans toit ni loi 1985 - Varda)
  'tt0249241', // The Gleaners and I (2000 - Varda)
  'tt0058708', // The Umbrellas of Cherbourg (1964 - Jacques Demy)
  'tt0062512', // The Young Girls of Rochefort (1967 - Demy)
  'tt0061809', // Mouchette (1967 - Robert Bresson)
  'tt0059527', // Au Hasard Balthazar (1966 - Bresson)
  'tt0053168', // Pickpocket (1959 - Bresson)
  'tt0049010', // A Man Escaped (1956 - Bresson)
  'tt0042627', // Diary of a Country Priest (1951 - Bresson)
  'tt0085859', // L'Argent (1983 - Bresson)
  'tt0068361', // The Mother and the Whore (1973 - Jean Eustache)

  // ── Andrei Tarkovsky, Soviet & Eastern European Masterpieces ──
  'tt0056111', // Ivan's Childhood (1962 - Tarkovsky)
  'tt0060107', // Andrei Rublev (1966 - Tarkovsky)
  'tt0069293', // Solaris (1972 - Tarkovsky)
  'tt0073906', // The Mirror (Zerkalo 1975 - Tarkovsky)
  'tt0079944', // Stalker (1979 - Tarkovsky)
  'tt0086022', // Nostalghia (1983 - Tarkovsky)
  'tt0091670', // The Sacrifice (1986 - Tarkovsky)
  'tt0091395', // Come and See (1985 - Elem Klimov)
  'tt0065063', // The Color of Pomegranates (1969 - Parajanov)
  'tt0058642', // Shadows of Forgotten Ancestors (1965 - Parajanov)
  'tt0050658', // The Cranes Are Flying (1957 - Mikhail Kalatozov)
  'tt0058223', // I Am Cuba (1964 - Kalatozov)
  'tt0053154', // Ballad of a Soldier (1959 - Grigori Chukhrai)
  'tt0060851', // Daisies (1966 - Věra Chytilová)
  'tt0059435', // The Shop on Main Street (1965)
  'tt0060807', // Closely Watched Trains (1966 - Jiří Menzel)
  'tt0067645', // Red Psalm (1972 - Miklós Jancsó)
  'tt0059887', // The Round-Up (Szegénylegények 1966 - Jancsó)
  'tt0111112', // Sátántangó (1994 - Béla Tarr)
  'tt0249221', // Werckmeister Harmonies (2000 - Béla Tarr)
  'tt1316540', // The Turin Horse (2011 - Béla Tarr)
  'tt0103759', // Damnation (1988 - Béla Tarr)
  'tt0097705', // A Short Film About Love (1988 - Kieslowski)
  'tt0095468', // A Short Film About Killing (1988 - Kieslowski)
  'tt0078768', // Camera Buff (Amator 1979 - Kieslowski)
  'tt0082933', // Blind Chance (Przypadek 1987 - Kieslowski)

  // ── Global Festival & Contemporary Masterpieces ──
  'tt13317874', // Wheel of Fortune and Fantasy (2021 - Hamaguchi)
  'tt27357497', // Evil Does Not Exist (2023 - Hamaguchi)
  'tt13651794', // The Zone of Interest (2023 - Jonathan Glazer)
  'tt2338151',  // Under the Skin (2013 - Jonathan Glazer)
  'tt0278731',  // Sexy Beast (2000 - Glazer)
  'tt21389082', // Anatomy of a Fall (2023 - Justine Triet)
  'tt13238346', // Past Lives (2023 - Celine Song)
  'tt23736044', // Monster (2023 - Hirokazu Kore-eda)
  'tt7362036',  // Shoplifters (2018 - Kore-eda)
  'tt3721936',  // Broker (2022 - Kore-eda)
  'tt2852470',  // Like Father, Like Son (2013 - Kore-eda)
  'tt0425609',  // Nobody Knows (2004 - Kore-eda)
  'tt1087578',  // Still Walking (2008 - Kore-eda)
  'tt0140786',  // After Life (1998 - Kore-eda)
  'tt19770238', // Aftersun (2022 - Charlotte Wells)
  'tt13303648', // Petite Maman (2021 - Sciamma)
  'tt1772398',  // Tomboy (2011 - Sciamma)
  'tt11813216', // The Banshees of Inisherin (2022 - Martin McDonagh)
  'tt14444726', // Tár (2022 - Todd Field)
  'tt0285331',  // In the Bedroom (2001 - Todd Field)
  'tt0404203',  // Little Children (2006 - Todd Field)
  'tt6710474',  // Everything Everywhere All at Once (2022)
  'tt10272386', // The Father (2020 - Florian Zeller)
  'tt10633456', // Minari (2020 - Lee Isaac Chung)
  'tt9770150',  // Nomadland (2020 - Chloé Zhao)
  'tt6266538',  // The Rider (2017 - Chloé Zhao)
  'tt6155172',  // Roma (2018 - Alfonso Cuarón)
  'tt6565702',  // Cold War (2018 - Paweł Pawlikowski)
  'tt2718492',  // Ida (2013 - Paweł Pawlikowski)
  'tt0270480',  // My Summer of Love (2004 - Pawlikowski)
  'tt1735192',  // A Hero (2021 - Farhadi)
  'tt1360860',  // About Elly (2009 - Farhadi)
  'tt0824317',  // Fireworks Wednesday (2006 - Farhadi)
  'tt0365069',  // Crimson Gold (2003 - Jafar Panahi)
  'tt0112450',  // The White Balloon (1995 - Panahi)
  'tt0118677',  // The Mirror (1997 - Panahi)
  'tt0245071',  // The Circle (2000 - Panahi)
  'tt0499537',  // Offside (2006 - Panahi)
  'tt1844887',  // This Is Not a Film (2011 - Panahi)
  'tt8345422',  // 3 Faces (2018 - Panahi)
  'tt20245014', // No Bears (2022 - Panahi)
  'tt14902782', // Holy Spider (2022 - Ali Abbasi)
  'tt5503686',  // Border (Gräns 2018 - Ali Abbasi)
  'tt13406094', // Triangle of Sadness (2022 - Ruben Östlund)
  'tt1787127',  // Play (2011 - Ruben Östlund)
  'tt2350796',  // Louder Than Bombs (2015 - Joachim Trier)
  'tt6304046',  // Thelma (2017 - Joachim Trier)
  'tt14051066', // Godland (2022 - Hlynur Pálmason)
  'tt9850344',  // A White, White Day (2019 - Pálmason)
  'tt13833688', // The Whale (2022 - Darren Aronofsky)
  'tt0438861',  // The Fountain (2006)
  'tt1125849',  // The Wrestler (2008)
  'tt0947798',  // Black Swan (2010)
  'tt5109784',  // Mother! (2017)
  'tt0138704',  // Pi (1998)
  'tt2084970',  // The Imitation Game (2014)
  'tt15398776', // Oppenheimer (2023)
  'tt1517268',  // Barbie (2023)
  'tt14230458', // Poor Things (2023)
  'tt8772262',  // The Favourite (2018 - Yorgos Lanthimos)
  'tt3464902',  // The Lobster (2015 - Lanthimos)
  'tt5950044',  // The Killing of a Sacred Deer (2017 - Lanthimos)
  'tt1378882',  // Dogtooth (2009 - Lanthimos)
  'tt1488589',  // Alps (2011 - Lanthimos)
  'tt20284574', // Kinds of Kindness (2024 - Lanthimos)
  'tt11358390', // Challengers (2024 - Luca Guadagnino)
  'tt4881806',  // Call Me by Your Name (2017 - Guadagnino)
  'tt7942928',  // Bones and All (2022 - Guadagnino)
  'tt3986820',  // A Bigger Splash (2015 - Guadagnino)
  'tt1030076',  // I Am Love (2009 - Guadagnino)
  'tt1229238',  // A Prophet (Un prophète 2009 - Audiard)
  'tt27503724', // Perfect Days (2023 - Wim Wenders)
  'tt0075572',  // The American Friend (1977 - Wenders)
  'tt0072597',  // Alice in the Cities (1974 - Wenders)
  'tt0073238',  // Kings of the Road (1976 - Wenders)
  'tt0071706',  // The Enigma of Kaspar Hauser (1974 - Herzog)
  'tt0076774',  // Stroszek (1977 - Herzog)
  'tt0427312',  // Grizzly Man (2005 - Herzog)

  // ── Turkish Cinema Masterpieces ──
  'tt1821681',  // Bir Zamanlar Anadolu'da (2011 - Nuri Bilge Ceylan)
  'tt2758880',  // Kış Uykusu (2014 - Nuri Bilge Ceylan)
  'tt6628102',  // Ahlat Ağacı (2018 - Nuri Bilge Ceylan)
  'tt13303640', // Kuru Otlar Üstüne (2023 - Nuri Bilge Ceylan)
  'tt0346094',  // Uzak (2002 - Nuri Bilge Ceylan)
  'tt0844330',  // İklimler (2006 - Nuri Bilge Ceylan)
  'tt1233381',  // Üç Maymun (2008 - Nuri Bilge Ceylan)
  'tt0234224',  // Mayıs Sıkıntısı (1999 - Nuri Bilge Ceylan)
  'tt0138545',  // Kasaba (1997 - Nuri Bilge Ceylan)
  'tt0127655',  // Masumiyet (1997 - Zeki Demirkubuz)
  'tt0825278',  // Kader (2006 - Zeki Demirkubuz)
  'tt0235889',  // Üçüncü Sayfa (1999 - Zeki Demirkubuz)
  'tt0296275',  // Yazgı (2001 - Zeki Demirkubuz)
  'tt0304245',  // İtiraf (2001 - Zeki Demirkubuz)
  'tt2207436',  // Yeraltı (2012 - Zeki Demirkubuz)
  'tt2207438',  // Kor (2016 - Zeki Demirkubuz)
  'tt2207432',  // Hayat (2023 - Zeki Demirkubuz)
  'tt0205973',  // Gemide (1998 - Serdar Akar)
  'tt0117826',  // Tabutta Rövaşata (1996 - Derviş Zaim)
  'tt0116241',  // Eşkıya (1996 - Yavuz Turgul)
  'tt0093577',  // Muhsin Bey (1987 - Yavuz Turgul)
  'tt0088531',  // Züğürt Ağa (1985 - Nesli Çölgeçen)
  'tt0078434',  // Sürü (1978 - Zeki Ökten / Yılmaz Güney)
  'tt0084934',  // Yol (1982 - Şerif Gören / Yılmaz Güney)
  'tt0066511',  // Umut (1970 - Yılmaz Güney)
  'tt0057546',  // Susuz Yaz (1963 - Metin Erksan)
  'tt0063590',  // Sevmek Zamanı (1965 - Metin Erksan)
  'tt0076686',  // Selvi Boylum Al Yazmalım (1977 - Atıf Yılmaz)
  'tt0112411',  // Aaahh Belinda (1986 - Atıf Yılmaz)
  'tt0077390',  // Kibar Feyzo (1978 - Atıf Yılmaz)
  'tt0077389',  // Çöpçüler Kralı (1977 - Zeki Ökten)
  'tt0075344',  // Tosun Paşa (1976 - Kartal Tibet)
  'tt0074744',  // Süt Kardeşler (1976 - Ertem Eğilmez)
  'tt0075204',  // Şaban Oğlu Şaban (1977 - Ertem Eğilmez)
  'tt0073084',  // Hababam Sınıfı (1975 - Ertem Eğilmez)
  'tt0252444',  // Vizontele (2001 - Yılmaz Erdoğan)
  'tt0380808',  // G.O.R.A. (2004 - Ömer Faruk Sorak)
  'tt0858486',  // A.R.O.G (2008 - Cem Yılmaz)
  'tt1541872',  // Vavien (2009 - Taylan Biraderler)
  'tt1341710',  // Sonbahar (2008 - Özcan Alper)
  'tt1664687',  // Çoğunluk (2010 - Seren Yüce)
  'tt2378772',  // Tepenin Ardı (2012 - Emin Alper)
  'tt4947656',  // Abluka (2015 - Emin Alper)
  'tt8436574',  // Kız Kardeşler (2019 - Emin Alper)
  'tt18274430', // Kurak Günler (2022 - Emin Alper)
  'tt4370222',  // Sarmaşık (2015 - Tolga Karaçelik)
  'tt1588889',  // Gişe Memuru (2010 - Tolga Karaçelik)
  'tt6966398',  // Kelebekler (2018 - Tolga Karaçelik)
  'tt4687880',  // Mustang (2015 - Deniz Gamze Ergüven)
  'tt12885444', // Barda (2007 - Serdar Akar)

  // ── Cult Prestige Series & Shows ──
  'tt0903747',  // Breaking Bad
  'tt3032476',  // Better Call Saul
  'tt0944947',  // Game of Thrones
  'tt0773262',  // Dexter
  'tt2356777',  // True Detective
  'tt7660850',  // Succession
  'tt8772296',  // Euphoria
  'tt4574334',  // Stranger Things
  'tt2575988',  // Silicon Valley
  'tt1475582',  // Sherlock
  'tt0141842',  // The Sopranos
  'tt0303461',  // The Wire
  'tt11280740', // Severance
  'tt8788418',  // The Bear
  'tt8594324',  // The Last of Us
  'tt1190634',  // The Boys
  'tt11198330', // House of the Dragon
  'tt5687612',  // Fleabag
  'tt5753856',  // Dark (TV)
  'tt0185906',  // Band of Brothers
  'tt8482286',  // Chernobyl
  'tt2861424',  // Rick and Morty
  'tt5290382',  // Mindhunter
  'tt11138512', // Arcane
  'tt2802850',  // Fargo (TV)
  'tt3502248',  // Narcos
  'tt4052886',  // Mr. Robot
  'tt2442560',  // Peaky Blinders
  'tt10574558', // Shōgun (2024)
];

const uniqueCandidateIds = [...new Set(CANDIDATE_IMDB_IDS)].filter(id => !existingIds.has(id));
console.log(`Unique new candidate IDs to fetch: ${uniqueCandidateIds.length}`);

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

function generateCinemaNotes(title, director, genres, year) {
  if (director && director !== 'N/A') {
    return `${director} imzasını taşıyan bu yapım, ${genres.slice(0, 2).join(' ve ')} türünde sinematik derinliği, kadraj kompozisyonları ve güçlü atmosferiyle öne çıkıyor.`;
  }
  return `${year} yapımı bu klasik, ${genres.slice(0, 2).join(' ve ')} dinamiklerini özgün sinematik anlatımla harmanlayarak sinefiller için vazgeçilmez bir arşiv eseri sunuyor.`;
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
    raw.Title?.toLowerCase().includes('cowboy bebop') ||
    raw.Title?.toLowerCase().includes('frieren')
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

async function run() {
  console.log(`Starting fetching and translation for ${uniqueCandidateIds.length} candidate movies...`);

  let addedCount = 0;
  for (let i = 0; i < uniqueCandidateIds.length; i++) {
    const id = uniqueCandidateIds[i];
    const res = await fetchOMDB(id);

    if (res.Response === 'True') {
      const item = await mapOMDBToMediaItem(res);
      catalog.push(item);
      existingIds.add(item.id);
      addedCount++;
      process.stdout.write(`[${i + 1}/${uniqueCandidateIds.length}] Added (${catalog.length} total): ${item.title} (${item.year})\n`);
    } else {
      console.log(`[${i + 1}/${uniqueCandidateIds.length}] Failed for ${id}: ${res.Error || 'Unknown error'}`);
    }

    if (addedCount > 0 && addedCount % 20 === 0) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      console.log(`💾 Checkpoint saved: ${catalog.length} items in catalog.`);
    }

    await sleep(80);
  }

  // Sweep entire catalog to verify 100% bilingual summaries
  console.log('──────────────────────────────────────────────────────');
  console.log(`🧹 Sweeping entire catalog (${catalog.length} items) for summary consistency...`);
  
  let translatedFixes = 0;
  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    
    // Ensure overviewEn exists
    if (!item.overviewEn && item.overview) {
      item.overviewEn = item.overview;
    }

    // Check if overview is in English or empty or identical to overviewEn when overviewEn is English
    const hasEnglishInOverview = /^[A-Za-z0-9\s.,'"\-!?():;]+$/.test(item.overview) && item.overview.length > 30 && !/[çğıöşüÇĞİÖŞÜ]/.test(item.overview);
    const isMissingOverview = !item.overview || item.overview === 'Açıklama henüz eklenmedi.' || item.overview === 'N/A';

    if (hasEnglishInOverview || (isMissingOverview && item.overviewEn)) {
      const srcText = item.overviewEn || item.overview;
      const tr = await translateToTurkish(srcText);
      if (tr && tr !== item.overview) {
        item.overview = tr;
        translatedFixes++;
        process.stdout.write(`Fixed translation for [${item.id}] ${item.title}\n`);
      }
    }
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 Master Catalog expansion completed successfully!`);
  console.log(`✨ Newly added items: ${addedCount}`);
  console.log(`🛠️ Translation fixes applied: ${translatedFixes}`);
  console.log(`📚 Total catalog count: ${catalog.length}`);
}

run();
