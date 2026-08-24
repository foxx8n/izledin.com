const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);

if (!urlMatch || !keyMatch) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const TURKISH_CURATED = [
  {
    id: 'tt1180340',
    type: 'movie',
    title: 'Recep İvedik',
    original_title: 'Recep Ivedik',
    overview: 'Recep İvedik, sokakta bulduğu cüzdanı Antalya\'daki sahibine teslim etmek için yola çıkar ve komik maceralara atılır.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BOGJmZGM5NjUtZDVjOS00MDMwLTk2NmEtNzQ1YjAwMzU1YTIxXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BOGJmZGM5NjUtZDVjOS00MDMwLTk2NmEtNzQ1YjAwMzU1YTIxXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2008,
    vote_average: 5.0,
    genres: ['Komedi', 'Popüler'],
    duration: '104 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Fatma Toptaş, Tulug Çizgen',
  },
  {
    id: 'tt1371151',
    type: 'movie',
    title: 'Recep İvedik 2',
    original_title: 'Recep Ivedik 2',
    overview: 'Recep İvedik, nenesinin vasiyeti üzerine iş bulmaya, evlenmeye ve saygın biri olmaya çalışır.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNTZmZGJjMDktNzk4MC00NzgwLTk1YmYtMWYzNGMzNWEwYmQ1XkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNTZmZGJjMDktNzk4MC00NzgwLTk1YmYtMWYzNGMzNWEwYmQ1XkEyXkFqcGc@._V1_SX300.jpg',
    year: 2009,
    vote_average: 4.5,
    genres: ['Komedi', 'Popüler'],
    duration: '107 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Gülsen Özbakan, Zeynep Çamcı',
  },
  {
    id: 'tt1577061',
    type: 'movie',
    title: 'Recep İvedik 3',
    original_title: 'Recep Ivedik 3',
    overview: 'Nenesinin vefatından sonra depresyona giren Recep, hayatına renk katmak için birbirinden tuhaf aktivitelere katılır.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BMjA4MTc1ODU4Ml5BMl5BanBnXkFtZTcwNTg2Nzg5Mg@@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BMjA4MTc1ODU4Ml5BMl5BanBnXkFtZTcwNTg2Nzg5Mg@@._V1_SX300.jpg',
    year: 2010,
    vote_average: 4.1,
    genres: ['Komedi', 'Popüler'],
    duration: '98 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Zeynep Çamcı, Sevim Yatlılar',
  },
  {
    id: 'tt3501756',
    type: 'movie',
    title: 'Recep İvedik 4',
    original_title: 'Recep Ivedik 4',
    overview: 'Mahalle çocuklarının futbol sahasını kurtarmak için para ödüllü ıssız ada yarışmasına katılan Recep İvedik\'in maceraları.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNmFhMGUxMTAtNWQxNS00YTZiLWJjYjctYzVhMTczYzA5MTQ1XkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNmFhMGUxMTAtNWQxNS00YTZiLWJjYjctYzVhMTczYzA5MTQ1XkEyXkFqcGc@._V1_SX300.jpg',
    year: 2014,
    vote_average: 3.8,
    genres: ['Komedi', 'Popüler'],
    duration: '117 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Ali İhsan Varol, İrfan Kangı',
  },
  {
    id: 'tt6316138',
    type: 'movie',
    title: 'Recep İvedik 5',
    original_title: 'Recep Ivedik 5',
    overview: 'Recep İvedik, vefat eden bir şoför dostunun yerine milli sporcuları Avrasya Gençlik Oyunları\'na götürür.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BOTU3MTY0NzgtYmUyNS00ZDVkLWE0NTMtOWU0Mzk5NDYzM2VmXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BOTU3MTY0NzgtYmUyNS00ZDVkLWE0NTMtOWU0Mzk5NDYzM2VmXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2017,
    vote_average: 3.3,
    genres: ['Komedi', 'Popüler'],
    duration: '114 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Orkan Varan, Deniz Ceylan',
  },
  {
    id: 'tt10756770',
    type: 'movie',
    title: 'Recep İvedik 6',
    original_title: 'Recep Ivedik 6',
    overview: 'Konya yerine yanlışlıkla Kenya\'ya uçan Recep İvedik ve arkadaşı Nurullah\'ın Afrika kabileleri arasındaki komedisi.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNTBmZGE2OTgtNzVhZS00M2VjLWEwNDAtMzBhOTQ1MGIxYTMzXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNTBmZGE2OTgtNzVhZS00M2VjLWEwNDAtMzBhOTQ1MGIxYTMzXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2019,
    vote_average: 2.9,
    genres: ['Komedi', 'Popüler'],
    duration: '110 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Nurullah Çelebi, Somer Karvan',
  },
  {
    id: 'tt23730248',
    type: 'movie',
    title: 'Recep İvedik 7',
    original_title: 'Recep Ivedik 7',
    overview: 'Şehir hayatının pahalılığından kaçıp köyüne yerleşen Recep İvedik, köylülerle birlikte arazilerini ranta karşı korur.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BYzA4ZjEzZjItMDFmMC00YWE0LThmMDgtMjg3ZTc1NGVmZTUyXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BYzA4ZjEzZjItMDFmMC00YWE0LThmMDgtMjg3ZTc1NGVmZTUyXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2022,
    vote_average: 5.1,
    genres: ['Komedi', 'Popüler'],
    duration: '133 dk',
    director: 'Togan Gökbakar',
    actors: 'Şahan Gökbakar, Öznur Serçeler, İrfan Kangı',
  },
  {
    id: 'tt0384116',
    type: 'movie',
    title: 'G.O.R.A.',
    original_title: 'G.O.R.A.',
    overview: 'Kurnaz halı tüccarı Arif, uzaylılar tarafından kaçırılarak G.O.R.A. gezegenine götürülür ve kaçış planı yapar.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNWQzMTM2OTQtNzI0MS00ZTMwLWIwYjQtMjhmMjE2NDFhMTk5XkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNWQzMTM2OTQtNzI0MS00ZTMwLWIwYjQtMjhmMjE2NDFhMTk5XkEyXkFqcGc@._V1_SX300.jpg',
    year: 2004,
    vote_average: 8.0,
    genres: ['Bilim Kurgu', 'Komedi', 'Kült'],
    duration: '127 dk',
    director: 'Ömer Faruk Sorak',
    actors: 'Cem Yılmaz, Rasim Öztekin, Özkan Uğur, Ozan Güven',
  },
  {
    id: 'tt1284575',
    type: 'movie',
    title: 'A.R.O.G',
    original_title: 'A.R.O.G: Bir Yontma Taş Filmi',
    overview: 'Arif, Komutan Logar tarafından zaman makinesiyle bir milyon yıl öncesine gönderilir.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BMTY3MjAwMzA1MF5BMl5BanBnXkFtZTcwODQ0MTk3Mg@@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BMTY3MjAwMzA1MF5BMl5BanBnXkFtZTcwODQ0MTk3Mg@@._V1_SX300.jpg',
    year: 2008,
    vote_average: 7.3,
    genres: ['Bilim Kurgu', 'Komedi', 'Macera'],
    duration: '128 dk',
    director: 'Cem Yılmaz, Ali Taner Baltacı',
    actors: 'Cem Yılmaz, Özge Özberk, Ozan Güven, Zafer Algöz',
  },
  {
    id: 'tt0480302',
    type: 'movie',
    title: 'Babam ve Oğlum',
    original_title: 'Babam ve Oglum',
    overview: '12 Eylül darbesinde annesini kaybeden küçük Deniz ve babasının, yıllar sonra Ege kasabasındaki dedesinin yanına dönüşü.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNjAzMzEwYzctNjc1MC00Nzg5LWFmMGItMTgzNWJmYmFhNWZlXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNjAzMzEwYzctNjc1MC00Nzg5LWFmMGItMTgzNWJmYmFhNWZlXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2005,
    vote_average: 8.2,
    genres: ['Dram', 'Aile', 'Başyapıt'],
    duration: '112 dk',
    director: 'Çağan Irmak',
    actors: 'Çetin Tekindor, Fikret Kuşkan, Hümeyra, Ege Tanman',
  },
  {
    id: 'tt0116231',
    type: 'movie',
    title: 'Eşkıya',
    original_title: 'Eskiya',
    overview: '35 yıl hapis yatan Baran, sevdiği kadını ve kendisine ihanet eden arkadaşını bulmak için İstanbul\'a gelir.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BMjYwOTg1OTgyMl5BMl5BanBnXkFtZTcwNDYxMjE3MQ@@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BMjYwOTg1OTgyMl5BMl5BanBnXkFtZTcwNDYxMjE3MQ@@._V1_SX300.jpg',
    year: 1996,
    vote_average: 8.1,
    genres: ['Suç & Gizem', 'Dram', 'Başyapıt'],
    duration: '128 dk',
    director: 'Yavuz Turgul',
    actors: 'Şener Şen, Uğur Yücel, Şermin Hürmeriç',
  },
  {
    id: 'tt0275806',
    type: 'movie',
    title: 'Vizontele',
    original_title: 'Vizontele',
    overview: '1974 yılında Güneydoğu Anadolu\'nun ücra bir kasabasına televizyonun ilk kez gelişi ve kasaba halkının heyecanı.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BMzY1MzA1ODAtMDZhMy00YjI5LWJjODctOWU1NzgyYmFkMjM3XkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BMzY1MzA1ODAtMDZhMy00YjI5LWJjODctOWU1NzgyYmFkMjM3XkEyXkFqcGc@._V1_SX300.jpg',
    year: 2001,
    vote_average: 8.0,
    genres: ['Komedi', 'Dram', 'Kült'],
    duration: '110 dk',
    director: 'Yılmaz Erdoğan, Ömer Faruk Sorak',
    actors: 'Yılmaz Erdoğan, Demet Akbağ, Altan Erkekli, Cem Yılmaz',
  },
  {
    id: 'tt7458856',
    type: 'movie',
    title: 'Ölümlü Dünya',
    original_title: 'Olumlu Dunya',
    overview: 'Nesillerdir dünya çapında bir kiralık katil organizasyonuna çalışan Mermer ailesinin komik kaçış hikayesi.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BMzMyNjA4MzctNjA4Yy00ZjIzLWFiZjUtY2VjN2ZhMWE3N2UzXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BMzMyNjA4MzctNjA4Yy00ZjIzLWFiZjUtY2VjN2ZhMWE3N2UzXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2018,
    vote_average: 7.6,
    genres: ['Aksiyon', 'Komedi', 'Suç & Gizem'],
    duration: '107 dk',
    director: 'Ali Atay',
    actors: 'Ahmet Mümtaz Taylan, Alper Kul, Sarp Apak, İrem Sak, Feyyaz Yiğit',
  },
  {
    id: 'tt13970894',
    type: 'tv',
    title: 'Gibi',
    original_title: 'Gibi',
    overview: 'Yılmaz, İlkkan ve Ersoy\'un sıradan hayatlarını altüst eden absürt ve felsefi olaylar dizisi.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BMmQ3NWRjOTYtOTRhMy00YTc1LWJjODEtM2IxNjg1OTZlOWFlXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BMmQ3NWRjOTYtOTRhMy00YTc1LWJjODEtM2IxNjg1OTZlOWFlXkEyXkFqcGc@._V1_SX300.jpg',
    year: 2021,
    vote_average: 8.9,
    genres: ['Komedi', 'Absürt', 'Popüler'],
    duration: '30 dk',
    director: 'Ömer Sinir, Onur Uzun',
    actors: 'Feyyaz Yiğit, Kıvanç Kılınç, Ahmet Kürşat Öçalan',
  },
  {
    id: 'tt0252487',
    type: 'movie',
    title: 'Hababam Sınıfı',
    original_title: 'Hababam Sinifi',
    overview: 'Özel Çamlıca Lisesi\'nin afacan öğrencilerinin Mahmut Hoca ile olan unutulmaz anıları.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNjRmMzMyOTItNGM5OS00YTNjLThhODQtMWY0M2Y0MDc5NTBkXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNjRmMzMyOTItNGM5OS00YTNjLThhODQtMWY0M2Y0MDc5NTBkXkEyXkFqcGc@._V1_SX300.jpg',
    year: 1975,
    vote_average: 9.2,
    genres: ['Komedi', 'Klasik Sinema', 'Başyapıt'],
    duration: '87 dk',
    director: 'Ertem Eğilmez',
    actors: 'Kemal Sunal, Münir Özkul, Tarık Akan, Halit Akçatepe, Adile Naşit',
  },
  {
    id: 'tt0252055',
    type: 'movie',
    title: 'Tosun Paşa',
    original_title: 'Tosun Pasa',
    overview: 'Yeşil Vadi\'yi kapmak için mücadele eden Tellioğulları ve Seferoğulları aileleri arasındaki mücadele.',
    poster_path: 'https://m.media-amazon.com/images/M/MV5BNTQyYjdhYWEtMzM2Yy00MTZkLWFkZjQtMGI2ZjlmMzcwNWRjXkEyXkFqcGc@._V1_SX300.jpg',
    backdrop_path: 'https://m.media-amazon.com/images/M/MV5BNTQyYjdhYWEtMzM2Yy00MTZkLWFkZjQtMGI2ZjlmMzcwNWRjXkEyXkFqcGc@._V1_SX300.jpg',
    year: 1976,
    vote_average: 8.9,
    genres: ['Komedi', 'Klasik Sinema', 'Kült'],
    duration: '90 dk',
    director: 'Kartal Tibet',
    actors: 'Kemal Sunal, Müjde Ar, Şener Şen, Adile Naşit',
  },
];

async function seed() {
  const rawCatalog = JSON.parse(fs.readFileSync('./src/data/catalog.json', 'utf8'));
  console.log(`Loaded ${rawCatalog.length} items from catalog.json`);

  const allItems = [...TURKISH_CURATED];
  const seen = new Set(allItems.map(i => i.id));

  for (const item of rawCatalog) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      allItems.push({
        id: item.id,
        type: item.type || 'movie',
        title: item.title || 'İsimsiz Yapım',
        original_title: item.originalTitle || item.title,
        overview: item.overview || '',
        overview_en: item.overviewEn || '',
        poster_path: item.posterPath || '',
        backdrop_path: item.backdropPath || '',
        release_date: item.releaseDate || '',
        year: item.year || null,
        vote_average: typeof item.voteAverage === 'number' ? item.voteAverage : null,
        genres: item.genres || [],
        duration: item.duration || '',
        director: item.director || '',
        actors: item.actors || '',
        awards: item.awards || '',
        imdb_votes: item.imdbVotes || '',
      });
    }
  }

  console.log(`Total unique items to seed: ${allItems.length}`);

  // Batch insert in chunks of 100
  const CHUNK_SIZE = 100;
  for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
    const chunk = allItems.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('media_catalog').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error in chunk ${i}-${i + CHUNK_SIZE}:`, error.message);
    } else {
      console.log(`Successfully upserted ${i + chunk.length} / ${allItems.length}`);
    }
  }

  console.log('Seeding completed successfully!');
}

seed().catch(err => {
  console.error('Seed fatal error:', err);
  process.exit(1);
});
