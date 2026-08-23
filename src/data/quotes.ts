export interface CinemaQuote {
  id: number;
  quote: string;
  originalQuote?: string;
  film: string;
  year: number;
  director?: string;
  character?: string;
}

export const CINEMA_QUOTES: CinemaQuote[] = [
  {
    id: 1,
    quote: "Bütün o anlar zamanın içinde kaybolup gidecek; yağmurdaki gözyaşları gibi. Ölme vakti.",
    originalQuote: "All those moments will be lost in time, like tears in rain. Time to die.",
    film: "Blade Runner",
    year: 1982,
    director: "Ridley Scott",
    character: "Roy Batty"
  },
  {
    id: 2,
    quote: "Ona reddedemeyeceği bir teklif yapacağım.",
    originalQuote: "I'm gonna make him an offer he can't refuse.",
    film: "The Godfather",
    year: 1972,
    director: "Francis Ford Coppola",
    character: "Don Vito Corleone"
  },
  {
    id: 3,
    quote: "Gözlerini aç.",
    originalQuote: "Open your eyes.",
    film: "Vanilla Sky / Abre los ojos",
    year: 2001,
    director: "Cameron Crowe",
    character: "Sofia"
  },
  {
    id: 4,
    quote: "Korku aklı öldürür. Korku, toptan yok oluşu getiren küçük ölümdür.",
    originalQuote: "Fear is the mind-killer. Fear is the little-death that brings total obliteration.",
    film: "Dune: Part One",
    year: 2021,
    director: "Denis Villeneuve",
    character: "Paul Atreides"
  },
  {
    id: 5,
    quote: "Bizi biz yapan sahip olduklarımız değildir; vazgeçebildiklerimizdir.",
    originalQuote: "The things you own end up owning you.",
    film: "Fight Club",
    year: 1999,
    director: "David Fincher",
    character: "Tyler Durden"
  },
  {
    id: 6,
    quote: "Geçmiş yalnızca kendimize anlattığımız bir hikayedir.",
    originalQuote: "The past is just a story we tell ourselves.",
    film: "Her",
    year: 2013,
    director: "Spike Jonze",
    character: "Samantha"
  },
  {
    id: 7,
    quote: "Hayat bir kutu çikolata gibidir, içinden ne çıkacağını asla bilemezsin.",
    originalQuote: "Life is like a box of chocolates, you never know what you're gonna get.",
    film: "Forrest Gump",
    year: 1994,
    director: "Robert Zemeckis",
    character: "Forrest Gump"
  },
  {
    id: 8,
    quote: "Sevgi, zamanı ve mekanı aşabilen tek şeydir.",
    originalQuote: "Love is the one thing we're capable of perceiving that transcends dimensions of time and space.",
    film: "Interstellar",
    year: 2014,
    director: "Christopher Nolan",
    character: "Brand"
  },
  {
    id: 9,
    quote: "Neden bu kadar ciddisin?",
    originalQuote: "Why so serious?",
    film: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    character: "Joker"
  },
  {
    id: 10,
    quote: "Umut iyi bir şeydir, belki de en iyisi. Ve iyi şeyler asla ölmez.",
    originalQuote: "Hope is a good thing, maybe the best of things, and no good thing ever dies.",
    film: "The Shawshank Redemption",
    year: 1994,
    director: "Frank Darabont",
    character: "Andy Dufresne"
  },
  {
    id: 11,
    quote: "Bana bir rüya inşa et.",
    originalQuote: "You mustn't be afraid to dream a little bigger, darling.",
    film: "Inception",
    year: 2010,
    director: "Christopher Nolan",
    character: "Eames"
  },
  {
    id: 12,
    quote: "İnsanlar sadece görmek istediklerini görürler.",
    originalQuote: "Human beings are unable to be honest with themselves about themselves.",
    film: "Rashomon",
    year: 1950,
    director: "Akira Kurosawa",
    character: "The Woodcutter"
  },
  {
    id: 13,
    quote: "Dünya bir sahne değil, bir sınav alanı.",
    originalQuote: "The world is not a stage, but a test.",
    film: "Stalker",
    year: 1979,
    director: "Andrei Tarkovsky",
    character: "The Writer"
  },
  {
    id: 14,
    quote: "Bazı insanlar sadece dünyanın yanışını izlemek ister.",
    originalQuote: "Some men just want to watch the world burn.",
    film: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    character: "Alfred Pennyworth"
  },
  {
    id: 15,
    quote: "Burada olmak, başka hiçbir yerde olmamaktır.",
    originalQuote: "To be here is to be nowhere else.",
    film: "Kış Uykusu (Winter Sleep)",
    year: 2014,
    director: "Nuri Bilge Ceylan",
    character: "Aydın"
  },
  {
    id: 16,
    quote: "Gözlerinin içine bakıyorum çocuk.",
    originalQuote: "Here's looking at you, kid.",
    film: "Casablanca",
    year: 1942,
    director: "Michael Curtiz",
    character: "Rick Blaine"
  },
  {
    id: 17,
    quote: "Günün sonunda geriye sadece sessizlik kalır.",
    originalQuote: "At the end of the day, all that remains is silence.",
    film: "Bir Zamanlar Anadolu'da",
    year: 2011,
    director: "Nuri Bilge Ceylan",
    character: "Doktor Cemal"
  },
  {
    id: 18,
    quote: "Karanlık tarafa geçtin mi, sonsuza dek kaderine hükmeder.",
    originalQuote: "Once you start down the dark path, forever will it dominate your destiny.",
    film: "Star Wars: The Empire Strikes Back",
    year: 1980,
    director: "Irvin Kershner",
    character: "Yoda"
  },
  {
    id: 19,
    quote: "Hiçbir plan mükemmel değildir, çünkü insan mükemmel değildir.",
    originalQuote: "No plan is foolproof because humans aren't foolproof.",
    film: "Parasite",
    year: 2019,
    director: "Bong Joon-ho",
    character: "Ki-taek"
  },
  {
    id: 20,
    quote: "Sonsuzluk ve bir gün...",
    originalQuote: "Eternity and a day.",
    film: "Eternity and a Day",
    year: 1998,
    director: "Theo Angelopoulos",
    character: "Alexandre"
  },
  {
    id: 21,
    quote: "Saygısızlık karşısında sabırlı olmak, erdem değil korkaklıktır.",
    originalQuote: "Patience in the face of disrespect is not virtue, but cowardice.",
    film: "Seven Samurai",
    year: 1954,
    director: "Akira Kurosawa",
    character: "Kambei"
  },
  {
    id: 22,
    quote: "İngilizcede 'aferin'den daha zararlı bir söz yoktur.",
    originalQuote: "There are no two words in the English language more harmful than 'good job.'",
    film: "Whiplash",
    year: 2014,
    director: "Damien Chazelle",
    character: "Terence Fletcher"
  },
  {
    id: 23,
    quote: "Kelimeler olmadan da konuşabilirsin; sinema gibi.",
    originalQuote: "You can speak without words; just like cinema.",
    film: "Persona",
    year: 1966,
    director: "Ingmar Bergman",
    character: "Alma"
  },
  {
    id: 24,
    quote: "Göklerde uçmayı unuttuğumuzda kanatlarımız sadece bir yüktür.",
    originalQuote: "When we forget how to fly, our wings are just a burden.",
    film: "The Wind Rises",
    year: 2013,
    director: "Hayao Miyazaki",
    character: "Caproni"
  },
  {
    id: 25,
    quote: "Gelecek yazılmadı. Kaderimiz kendi ellerimizde.",
    originalQuote: "There's no fate but what we make for ourselves.",
    film: "Terminator 2: Judgment Day",
    year: 1991,
    director: "James Cameron",
    character: "John Connor"
  },
  {
    id: 26,
    quote: "Ben tehlikede değilim Skyler. Tehlike benim ta kendisiyim!",
    originalQuote: "I am not in danger, Skyler. I am the danger!",
    film: "Breaking Bad",
    year: 2011,
    director: "Vince Gilligan",
    character: "Walter White"
  },
  {
    id: 27,
    quote: "Burası senin dünyan değil; sadece içinde yürüyorsun.",
    originalQuote: "This world doesn't belong to you; you just walk in it.",
    film: "No Country for Old Men",
    year: 2007,
    director: "Joel & Ethan Coen",
    character: "Anton Chigurh"
  },
  {
    id: 28,
    quote: "Kutuda ne var?!",
    originalQuote: "What's in the box?!",
    film: "Se7en",
    year: 1995,
    director: "David Fincher",
    character: "David Mills"
  },
  {
    id: 29,
    quote: "Sonsuzluk bir anın içinde saklıdır.",
    originalQuote: "Eternity is hidden inside a single moment.",
    film: "The Mirror",
    year: 1975,
    director: "Andrei Tarkovsky",
    character: "Narrator"
  },
  {
    id: 30,
    quote: "Zaman her şeyi aşındırır.",
    originalQuote: "Le temps détruit tout.",
    film: "Irréversible",
    year: 2002,
    director: "Gaspar Noé",
    character: "Marcus"
  },
  {
    id: 31,
    quote: "Hayatının geri kalanını başkalarının beklentilerini karşılayarak mı geçireceksin?",
    originalQuote: "Are you gonna spend the rest of your life trying to please everyone?",
    film: "Dead Poets Society",
    year: 1989,
    director: "Peter Weir",
    character: "John Keating"
  },
  {
    id: 32,
    quote: "Bazen doğru karar yoktur; sadece sonuçlar vardır.",
    originalQuote: "Sometimes there are no right decisions; only consequences.",
    film: "Sicario",
    year: 2015,
    director: "Denis Villeneuve",
    character: "Alejandro Gillick"
  },
  {
    id: 33,
    quote: "Kusursuz cinayet yoktur, sadece yetersiz dedektifler vardır.",
    originalQuote: "There's no such thing as a perfect crime, only careless detectives.",
    film: "Zodiac",
    year: 2007,
    director: "David Fincher",
    character: "Robert Graysmith"
  },
  {
    id: 34,
    quote: "Hepimiz bir gün unutulacağız. Asıl mesele o güne kadar nasıl yaşadığımız.",
    originalQuote: "We will all be forgotten one day. The point is how we lived until then.",
    film: "Synecdoche, New York",
    year: 2008,
    director: "Charlie Kaufman",
    character: "Caden Cotard"
  },
  {
    id: 35,
    quote: "Hatırlamak, kaybetmenin bir başka yoludur.",
    originalQuote: "Remembering is just another way of losing.",
    film: "In the Mood for Love",
    year: 2000,
    director: "Wong Kar-wai",
    character: "Chow Mo-wan"
  },
  {
    id: 36,
    quote: "Bana gerçeği söyleme, bana ne hissettirdiğini söyle.",
    originalQuote: "Don't tell me the truth, tell me how it felt.",
    film: "Mulholland Drive",
    year: 2001,
    director: "David Lynch",
    character: "Betty Elms"
  },
  {
    id: 37,
    quote: "Tanrı dünyayı altı günde yarattı; sinemacı ise iki saatte yeniden yaratır.",
    originalQuote: "God made the world in six days; a filmmaker recreates it in two hours.",
    film: "Cinema Paradiso",
    year: 1988,
    director: "Giuseppe Tornatore",
    character: "Alfredo"
  },
  {
    id: 38,
    quote: "İntikam, soğuk yenen bir yemektir.",
    originalQuote: "Revenge is a dish best served cold.",
    film: "Kill Bill: Vol. 1",
    year: 2003,
    director: "Quentin Tarantino",
    character: "The Bride"
  },
  {
    id: 39,
    quote: "Şimdi ben Ölüm oldum, dünyaların yok edicisi.",
    originalQuote: "Now I am become Death, the destroyer of worlds.",
    film: "Oppenheimer",
    year: 2023,
    director: "Christopher Nolan",
    character: "J. Robert Oppenheimer"
  },
  {
    id: 40,
    quote: "Yalnızlık bir tercih değil; bazen bir kaderdir.",
    originalQuote: "Loneliness is not a choice; sometimes it is destiny.",
    film: "Taxi Driver",
    year: 1976,
    director: "Martin Scorsese",
    character: "Travis Bickle"
  },
  {
    id: 41,
    quote: "Hayatta en önemli şey dürüstlüktür; sahte olmayı başardın mı her şeyi başarırsın.",
    originalQuote: "The secret of life is honesty and fair dealing. If you can fake that, you've got it made.",
    film: "Groucho Marx / Classic Cinema",
    year: 1935,
    director: "Sam Wood",
    character: "Otis B. Driftwood"
  },
  {
    id: 42,
    quote: "Beni hatırladığın sürece asla tamamen kaybolmuş sayılmam.",
    originalQuote: "As long as you remember me, I am never truly lost.",
    film: "Spirited Away",
    year: 2001,
    director: "Hayao Miyazaki",
    character: "Haku"
  },
  {
    id: 43,
    quote: "Kırmızı hapı mı, mavi hapı mı seçeceksin?",
    originalQuote: "You take the blue pill, the story ends. You take the red pill, you stay in Wonderland.",
    film: "The Matrix",
    year: 1999,
    director: "The Wachowskis",
    character: "Morpheus"
  },
  {
    id: 44,
    quote: "Bir fikir virüs gibidir. Dirençlidir, son derece bulaşıcıdır.",
    originalQuote: "An idea is like a virus. Resilient, highly contagious.",
    film: "Inception",
    year: 2010,
    director: "Christopher Nolan",
    character: "Cobb"
  },
  {
    id: 45,
    quote: "Kusursuz olmak zorunda değilsin, sadece gerçek ol.",
    originalQuote: "You don't have to be perfect, just be real.",
    film: "Good Will Hunting",
    year: 1997,
    director: "Gus Van Sant",
    character: "Sean Maguire"
  },
  {
    id: 46,
    quote: "Yıldızlara bakın, ayaklarınıza değil.",
    originalQuote: "Look up at the stars and not down at your feet.",
    film: "The Theory of Everything",
    year: 2014,
    director: "James Marsh",
    character: "Stephen Hawking"
  },
  {
    id: 47,
    quote: "Herkes ölür ama herkes gerçekten yaşamaz.",
    originalQuote: "Every man dies, not every man really lives.",
    film: "Braveheart",
    year: 1995,
    director: "Mel Gibson",
    character: "William Wallace"
  },
  {
    id: 48,
    quote: "Gözlerinin rengini unutabilirsin ama sana nasıl baktığını asla.",
    originalQuote: "You can forget the color of their eyes, but never the way they looked at you.",
    film: "Eternal Sunshine of the Spotless Mind",
    year: 2004,
    director: "Michel Gondry",
    character: "Joel Barish"
  },
  {
    id: 49,
    quote: "Görünmez olmakla yalnız olmak arasındaki fark çok küçüktür.",
    originalQuote: "The difference between being invisible and being lonely is very small.",
    film: "Drive",
    year: 2011,
    director: "Nicolas Winding Refn",
    character: "Driver"
  },
  {
    id: 50,
    quote: "Benim adım Maximus Decimus Meridius; intikamımı bu hayatta ya da ötekinde alacağım.",
    originalQuote: "My name is Maximus Decimus Meridius... and I will have my vengeance, in this life or the next.",
    film: "Gladiator",
    year: 2000,
    director: "Ridley Scott",
    character: "Maximus"
  },
  {
    id: 51,
    quote: "Kelimeler sihirlidir, doğru kullanıldığında insanı baştan yaratır.",
    originalQuote: "Words are magic; when used right, they remake a soul.",
    film: "Il Postino",
    year: 1994,
    director: "Michael Radford",
    character: "Pablo Neruda"
  },
  {
    id: 52,
    quote: "Burada kuralları ben koyarım.",
    originalQuote: "I make the rules around here.",
    film: "Scarface",
    year: 1983,
    director: "Brian De Palma",
    character: "Tony Montana"
  },
  {
    id: 53,
    quote: "Sevmek, savunmasız olmayı kabul etmektir.",
    originalQuote: "To love is to accept being vulnerable.",
    film: "Portrait of a Lady on Fire",
    year: 2019,
    director: "Céline Sciamma",
    character: "Marianne"
  },
  {
    id: 54,
    quote: "Zaman en adil yargıçtır; kimseye ayrıcalık tanımaz.",
    originalQuote: "Time is the fairest judge; it spares no one.",
    film: "The Seventh Seal",
    year: 1957,
    director: "Ingmar Bergman",
    character: "Death"
  },
  {
    id: 55,
    quote: "Bazen kazanmak için kaybetmeyi göze almak gerekir.",
    originalQuote: "Sometimes to win, you have to risk losing it all.",
    film: "Casino Royale",
    year: 2006,
    director: "Martin Campbell",
    character: "James Bond"
  },
  {
    id: 56,
    quote: "Karanlık olmadan ışığın hiçbir anlamı yoktur.",
    originalQuote: "Without darkness, light has no meaning.",
    film: "Solaris",
    year: 1972,
    director: "Andrei Tarkovsky",
    character: "Kris Kelvin"
  },
  {
    id: 57,
    quote: "Gerçek özgürlük, hiçbir şeye mecbur hissetmemektir.",
    originalQuote: "True freedom is having nothing to lose.",
    film: "Into the Wild",
    year: 2007,
    director: "Sean Penn",
    character: "Christopher McCandless"
  },
  {
    id: 58,
    quote: "Bana 'küçük adam' deme; sinemada küçük insan yoktur.",
    originalQuote: "Don't call me little; there are no small people in cinema.",
    film: "Sunset Boulevard",
    year: 1950,
    director: "Billy Wilder",
    character: "Norma Desmond"
  },
  {
    id: 59,
    quote: "Kelimelerin bittiği yerde müzik başlar; müziğin bittiği yerde sinema.",
    originalQuote: "Where words end, music begins; where music ends, cinema.",
    film: "Amadeus",
    year: 1984,
    director: "Miloš Forman",
    character: "Salieri"
  },
  {
    id: 60,
    quote: "Burası Roma. Burada her şey geçer ama hiçbir şey kaybolmaz.",
    originalQuote: "This is Rome. Everything passes, but nothing is lost.",
    film: "La Grande Bellezza",
    year: 2013,
    director: "Paolo Sorrentino",
    character: "Jep Gambardella"
  },
  {
    id: 61,
    quote: "Korkularımızla yüzleşmedikçe asla büyüyemeyiz.",
    originalQuote: "We never grow until we face our deepest fears.",
    film: "Princess Mononoke",
    year: 1997,
    director: "Hayao Miyazaki",
    character: "Ashitaka"
  },
  {
    id: 62,
    quote: "Bazen en büyük kahramanlık sadece hayatta kalmaktır.",
    originalQuote: "Sometimes the greatest heroism is just staying alive.",
    film: "Dunkirk",
    year: 2017,
    director: "Christopher Nolan",
    character: "Tommy"
  },
  {
    id: 63,
    quote: "Benim hikayem mutlu sonla bitmeyecek, ama harika bir yolculuktu.",
    originalQuote: "My story won't end happily, but what a journey it was.",
    film: "La La Land",
    year: 2016,
    director: "Damien Chazelle",
    character: "Sebastian"
  },
  {
    id: 64,
    quote: "Gözlerinin derinliklerinde bir evren saklı.",
    originalQuote: "There's a whole universe hidden in your eyes.",
    film: "Arrival",
    year: 2016,
    director: "Denis Villeneuve",
    character: "Louise Banks"
  },
  {
    id: 65,
    quote: "Hiçbir şey göründüğü kadar basit değildir.",
    originalQuote: "Nothing is as simple as it looks.",
    film: "Chinatown",
    year: 1974,
    director: "Roman Polanski",
    character: "J.J. Gittes"
  },
  {
    id: 66,
    quote: "Gelecek, geçmişin gölgesinde inşa edilir.",
    originalQuote: "The future is built in the shadow of the past.",
    film: "Gattaca",
    year: 1997,
    director: "Andrew Niccol",
    character: "Vincent Freeman"
  },
  {
    id: 67,
    quote: "Bir insanı gerçekten tanımak istiyorsan ona güç ver.",
    originalQuote: "If you want to know a man, give him power.",
    film: "There Will Be Blood",
    year: 2007,
    director: "Paul Thomas Anderson",
    character: "Daniel Plainview"
  },
  {
    id: 68,
    quote: "Hayat beklemekle geçmeyecek kadar kısa.",
    originalQuote: "Life is too short to spend it waiting.",
    film: "Before Sunrise",
    year: 1995,
    director: "Richard Linklater",
    character: "Jesse"
  },
  {
    id: 69,
    quote: "Gözler yalan söyleyebilir ama kamera asla.",
    originalQuote: "Eyes can lie, but the camera never does.",
    film: "Blow-Up",
    year: 1966,
    director: "Michelangelo Antonioni",
    character: "Thomas"
  },
  {
    id: 70,
    quote: "Herkes kendi labirentinin mimarıdır.",
    originalQuote: "Everyone is the architect of their own maze.",
    film: "Prisoners",
    year: 2013,
    director: "Denis Villeneuve",
    character: "Detective Loki"
  },
  {
    id: 71,
    quote: "Sessizlik, söylenmemiş en ağır sözdür.",
    originalQuote: "Silence is the heaviest unspoken word.",
    film: "The Silence",
    year: 1963,
    director: "Ingmar Bergman",
    character: "Ester"
  },
  {
    id: 72,
    quote: "Bazen gerçeği bulmak için kaybolmak gerekir.",
    originalQuote: "Sometimes you must get lost to find the truth.",
    film: "Lost in Translation",
    year: 2003,
    director: "Sofia Coppola",
    character: "Bob Harris"
  },
  {
    id: 73,
    quote: "Bir kez uçmayı öğrendin mi, gözlerin hep göklerde kalır.",
    originalQuote: "Once you have tasted flight, you will walk the earth with your eyes turned skyward.",
    film: "Wings of Desire",
    year: 1987,
    director: "Wim Wenders",
    character: "Damiel"
  },
  {
    id: 74,
    quote: "Sinema, saniyede 24 karelik bir hakikattir.",
    originalQuote: "Le cinéma, c'est 24 fois la vérité par seconde.",
    film: "Le Petit Soldat",
    year: 1963,
    director: "Jean-Luc Godard",
    character: "Bruno Forestier"
  },
  {
    id: 75,
    quote: "Dünyanın en zor şeyi, hissettiklerini anlatacak doğru kelimeleri bulmaktır.",
    originalQuote: "The hardest thing in the world is finding the right words for what you feel.",
    film: "Three Colors: Blue",
    year: 1993,
    director: "Krzysztof Kieślowski",
    character: "Julie"
  },
  {
    id: 76,
    quote: "Bazen kaçmak kurtuluş değil, yeni bir başlangıçtır.",
    originalQuote: "Sometimes running away is not escape, but a new beginning.",
    film: "Thelma & Louise",
    year: 1991,
    director: "Ridley Scott",
    character: "Thelma"
  },
  {
    id: 77,
    quote: "Gözlerinin önündeki perdeyi kaldır; dünya sandığından çok daha geniş.",
    originalQuote: "Lift the veil before your eyes; the world is far vaster than you think.",
    film: "Akira",
    year: 1988,
    director: "Katsuhiro Otomo",
    character: "Kaneda"
  },
  {
    id: 78,
    quote: "Kaderimizi biz seçmeyiz ama ona nasıl cevap vereceğimizi seçeriz.",
    originalQuote: "We do not choose our fate, but we choose how to respond to it.",
    film: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
    director: "Peter Jackson",
    character: "Gandalf"
  },
  {
    id: 79,
    quote: "Gecenin en karanlık anı, şafaktan hemen önceki andır.",
    originalQuote: "The night is darkest just before the dawn.",
    film: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    character: "Harvey Dent"
  },
  {
    id: 80,
    quote: "Beni öldürmeyen şey beni tuhaflaştırır.",
    originalQuote: "Whatever doesn't kill you simply makes you stranger.",
    film: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    character: "Joker"
  },
  {
    id: 81,
    quote: "Sonsuzluğa ve ötesine!",
    originalQuote: "To infinity and beyond!",
    film: "Toy Story",
    year: 1995,
    director: "John Lasseter",
    character: "Buzz Lightyear"
  },
  {
    id: 82,
    quote: "Herkes bir maske takar; asıl mesele maskenin ardındaki ruh.",
    originalQuote: "Everyone wears a mask; what matters is the soul beneath.",
    film: "V for Vendetta",
    year: 2005,
    director: "James McTeigue",
    character: "V"
  },
  {
    id: 83,
    quote: "Güç seninle olsun.",
    originalQuote: "May the Force be with you.",
    film: "Star Wars: A New Hope",
    year: 1977,
    director: "George Lucas",
    character: "Han Solo"
  },
  {
    id: 84,
    quote: "Gözlerini kapat ve beni dinle; burası rüyaların bittiği yer.",
    originalQuote: "Close your eyes and listen; this is where dreams end.",
    film: "Twin Peaks: Fire Walk with Me",
    year: 1992,
    director: "David Lynch",
    character: "Laura Palmer"
  },
  {
    id: 85,
    quote: "Güzellik geçicidir ama sanat ebedidir.",
    originalQuote: "Beauty is fleeting, but art is eternal.",
    film: "The Grand Budapest Hotel",
    year: 2014,
    director: "Wes Anderson",
    character: "M. Gustave"
  },
  {
    id: 86,
    quote: "Bazen bir soru sormak, cevabı bilmekten daha değerlidir.",
    originalQuote: "Sometimes asking the question is worth more than the answer.",
    film: "2001: A Space Odyssey",
    year: 1968,
    director: "Stanley Kubrick",
    character: "HAL 9000"
  },
  {
    id: 87,
    quote: "Bir insanı kaybetmek kolaydır; zor olan onunla yeniden karşılaşmaktır.",
    originalQuote: "Losing someone is easy; the hard part is meeting them again.",
    film: "Past Lives",
    year: 2023,
    director: "Celine Song",
    character: "Nora"
  },
  {
    id: 88,
    quote: "Yalanlar seni bir yere kadar götürür; hakikat ise sonsuza kadar yaşatır.",
    originalQuote: "Lies take you only so far; the truth lives forever.",
    film: "Memories of Murder",
    year: 2003,
    director: "Bong Joon-ho",
    character: "Park Doo-man"
  },
  {
    id: 89,
    quote: "Bütün büyük şeyler küçük başlangıçlarla doğar.",
    originalQuote: "Big things have small beginnings.",
    film: "Lawrence of Arabia",
    year: 1962,
    director: "David Lean",
    character: "T.E. Lawrence"
  },
  {
    id: 90,
    quote: "Korkacak tek şey, korkunun kendisidir.",
    originalQuote: "The only thing we have to fear is fear itself.",
    film: "Darkest Hour",
    year: 2017,
    director: "Joe Wright",
    character: "Winston Churchill"
  },
  {
    id: 91,
    quote: "Gözlerinin rengi değişebilir ama bakışındaki derinlik asla.",
    originalQuote: "Eye color may change, but the depth in your gaze never does.",
    film: "Chungking Express",
    year: 1994,
    director: "Wong Kar-wai",
    character: "Cop 663"
  },
  {
    id: 92,
    quote: "Dünyayı değiştiremezsin belki ama bir insanın dünyasını değiştirebilirsin.",
    originalQuote: "You might not change the world, but you can change someone's world.",
    film: "Schindler's List",
    year: 1993,
    director: "Steven Spielberg",
    character: "Oskar Schindler"
  },
  {
    id: 93,
    quote: "Zaman bir nehirdir; akıntısına karşı yüzemezsin.",
    originalQuote: "Time is a river; you cannot swim against its current.",
    film: "The Curious Case of Benjamin Button",
    year: 2008,
    director: "David Fincher",
    character: "Benjamin Button"
  },
  {
    id: 94,
    quote: "Bir hikaye ancak onu anlatan kadar güçlüdür.",
    originalQuote: "A story is only as powerful as the one who tells it.",
    film: "Big Fish",
    year: 2003,
    director: "Tim Burton",
    character: "Edward Bloom"
  },
  {
    id: 95,
    quote: "Yalnız yürümek korkutucudur ama yanlış biriyle yürümekten iyidir.",
    originalQuote: "Walking alone is scary, but better than walking with the wrong soul.",
    film: "Wild Strawberries",
    year: 1957,
    director: "Ingmar Bergman",
    character: "Isak Borg"
  },
  {
    id: 96,
    quote: "Burası benim dünyam; ışıklar söndüğünde başlar.",
    originalQuote: "This is my world; it begins when the lights go down.",
    film: "The Fabelmans",
    year: 2022,
    director: "Steven Spielberg",
    character: "Sammy Fabelman"
  },
  {
    id: 97,
    quote: "Hiçbir şey tesadüf değildir; her şey bir senaryonun parçasıdır.",
    originalQuote: "Nothing is a coincidence; everything is part of the script.",
    film: "The Truman Show",
    year: 1998,
    director: "Peter Weir",
    character: "Christof"
  },
  {
    id: 98,
    quote: "Yıldızlar sadece karanlıkta parlar.",
    originalQuote: "Stars can only shine in the dark.",
    film: "A Star Is Born",
    year: 2018,
    director: "Bradley Cooper",
    character: "Jackson Maine"
  },
  {
    id: 99,
    quote: "Hayat bir film şeridi gibidir; her karesi özenle yaşanmalıdır.",
    originalQuote: "Life is like a film reel; every frame must be lived with care.",
    film: "Cinema Paradiso",
    year: 1988,
    director: "Giuseppe Tornatore",
    character: "Salvatore"
  },
  {
    id: 100,
    quote: "Ve perde kapanır...",
    originalQuote: "And that's a wrap.",
    film: "8½ (Otto e Mezzo)",
    year: 1963,
    director: "Federico Fellini",
    character: "Guido Anselmi"
  }
];

export function getRandomQuote(): CinemaQuote {
  const randomIndex = Math.floor(Math.random() * CINEMA_QUOTES.length);
  return CINEMA_QUOTES[randomIndex];
}

export function getQuoteOfTheDay(): CinemaQuote {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return CINEMA_QUOTES[dayOfYear % CINEMA_QUOTES.length];
}
