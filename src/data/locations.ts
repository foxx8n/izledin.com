export interface ProvinceData {
  il: string;
  ilceler: string[];
}

const RAW_TURKEY_LOCATIONS: ProvinceData[] = [
  {
    il: 'İstanbul',
    ilceler: [
      'Kadıköy', 'Beşiktaş', 'Beyoğlu', 'Şişli', 'Üsküdar', 'Bakırköy', 'Fatih',
      'Maltepe', 'Ataşehir', 'Sarıyer', 'Kartal', 'Pendik', 'Ümraniye', 'Zeytinburnu',
      'Beylikdüzü', 'Tuzla', 'Eyüpsultan', 'Gaziosmanpaşa', 'Kağıthane', 'Küçükçekmece',
      'Bahçelievler', 'Bağcılar', 'Esenyurt', 'Büyükçekmece', 'Çekmeköy', 'Sancaktepe',
      'Sultanbeyli', 'Silivri', 'Şile', 'Adalar'
    ]
  },
  {
    il: 'Ankara',
    ilceler: [
      'Çankaya', 'Yenimahalle', 'Keçiören', 'Mamak', 'Etimesgut', 'Sincan',
      'Altındağ', 'Gölbaşı', 'Pursaklar', 'Polatlı', 'Kahramankazan', 'Beypazarı'
    ]
  },
  {
    il: 'İzmir',
    ilceler: [
      'Konak (Alsancak)', 'Karşıyaka', 'Bornova', 'Bayraklı', 'Buca', 'Balçova',
      'Çeşme', 'Urla', 'Foça', 'Seferihisar', 'Güzelbahçe', 'Çiğli', 'Menemen',
      'Gaziemir', 'Torbalı', 'Aliağa', 'Ödemiş', 'Bergama', 'Tire', 'Karaburun'
    ]
  },
  {
    il: 'Eskişehir',
    ilceler: ['Tepebaşı', 'Odunpazarı', 'Sivrihisar', 'Çifteler', 'Seyitgazi', 'Alpu', 'Mahmudiye']
  },
  {
    il: 'Antalya',
    ilceler: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat', 'Kaş', 'Kemer', 'Kumluca', 'Serik', 'Finike', 'Gazipaşa', 'Döşemealtı']
  },
  {
    il: 'Bursa',
    ilceler: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'Mudanya', 'Gemlik', 'İnegöl', 'Mustafakemalpaşa', 'Gürsu', 'Kestel', 'Orhangazi']
  },
  {
    il: 'Adana',
    ilceler: ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu', 'Karataş', 'Pozantı']
  },
  {
    il: 'Çanakkale',
    ilceler: ['Merkez', 'Bozcaada', 'Gökçeada', 'Gelibolu', 'Biga', 'Ayvacık (Assos)', 'Ezine', 'Lapseki', 'Çan']
  },
  {
    il: 'Muğla',
    ilceler: ['Bodrum', 'Fethiye', 'Marmaris', 'Menteşe (Merkez)', 'Datça', 'Milas', 'Ortaca', 'Köyceğiz', 'Ula (Akyaka)', 'Dalaman', 'Yatağan']
  },
  {
    il: 'Trabzon',
    ilceler: ['Ortahisar', 'Akçaabat', 'Yomra', 'Vakfıkebir', 'Of', 'Sürmene', 'Beşikdüzü', 'Arsin', 'Maçka']
  },
  {
    il: 'Gaziantep',
    ilceler: ['Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye', 'Nurdağı', 'Oğuzeli', 'Araban']
  },
  {
    il: 'Konya',
    ilceler: ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Cihanbeyli', 'Kulu', 'Seydişehir']
  },
  {
    il: 'Mersin',
    ilceler: ['Yenişehir', 'Mezitli', 'Toroslar', 'Akdeniz', 'Erdemli', 'Tarsus', 'Silifke', 'Anamur', 'Bozyazı', 'Mut']
  },
  {
    il: 'Samsun',
    ilceler: ['Atakum', 'İlkadım', 'Canik', 'Bafra', 'Çarşamba', 'Tekkeköy', 'Terme', 'Havza', 'Vezirköprü']
  },
  {
    il: 'Kayseri',
    ilceler: ['Melikgazi', 'Kocasinan', 'Talas', 'Develi', 'Bünyan', 'İncesu', 'Pınarbaşı', 'Yahyalı']
  },
  {
    il: 'Diyarbakır',
    ilceler: ['Kayapınar', 'Bağlar', 'Yenişehir', 'Sur', 'Ergani', 'Bismil', 'Silvan', 'Çermik', 'Dicle']
  },
  {
    il: 'Balıkesir',
    ilceler: ['Altıeylül', 'Karesi', 'Edremit (Akçay)', 'Ayvalık (Cunda)', 'Bandırma', 'Burhaniye', 'Erdek', 'Gönen', 'Susurluk', 'Havran']
  },
  {
    il: 'Denizli',
    ilceler: ['Pamukkale', 'Merkezefendi', 'Acıpayam', 'Tavas', 'Honaz', 'Sarayköy', 'Buldan', 'Çivril']
  },
  {
    il: 'Kocaeli',
    ilceler: ['İzmit', 'Gebze', 'Darıca', 'Gölcük', 'Körfez', 'Başiskele', 'Kartepe', 'Kandıra', 'Derince', 'Çayırova', 'Dilovası']
  },
  {
    il: 'Sakarya',
    ilceler: ['Adapazarı', 'Serdivan', 'Erenler', 'Sapanca', 'Hendek', 'Akyazı', 'Karasu', 'Geyve', 'Arifiye', 'Pamukova']
  },
  {
    il: 'Aydın',
    ilceler: ['Efeler', 'Kuşadası', 'Didim', 'Söke', 'Nazilli', 'İncirliova', 'Germencik', 'Çine', 'Bozdoğan']
  },
  {
    il: 'Tekirdağ',
    ilceler: ['Süleymanpaşa', 'Çorlu', 'Çerkezköy', 'Kapaklı', 'Şarköy', 'Marmaraereğlisi', 'Ergene', 'Muratlı', 'Malkara']
  },
  {
    il: 'Hatay',
    ilceler: ['Antakya', 'İskenderun', 'Defne', 'Dörtyol', 'Samandağ', 'Arsuz', 'Kırıkhan', 'Payas', 'Reyhanlı', 'Erzin']
  },
  {
    il: 'Manisa',
    ilceler: ['Yunusemre', 'Şehzadeler', 'Akhisar', 'Salihli', 'Turgutlu', 'Soma', 'Alaşehir', 'Saruhanlı', 'Demirci', 'Kula']
  },
  {
    il: 'Şanlıurfa',
    ilceler: ['Eyyübiye', 'Haliliye', 'Karaköprü', 'Siverek', 'Viranşehir', 'Suruç', 'Birecik', 'Akçakale', 'Ceylanpınar', 'Harran', 'Bozova']
  },
  {
    il: 'Van',
    ilceler: ['İpekyolu', 'Tuşba', 'Edremit', 'Erciş', 'Özalp', 'Çaldıran', 'Muradiye', 'Gevaş', 'Başkale']
  },
  {
    il: 'Malatya',
    ilceler: ['Battalgazi', 'Yeşilyurt', 'Doğanşehir', 'Akçadağ', 'Darende', 'Hekimhan']
  },
  {
    il: 'Kütahya',
    ilceler: ['Merkez', 'Tavşanlı', 'Simav', 'Gediz', 'Emet', 'Domaniç']
  },
  {
    il: 'Sivas',
    ilceler: ['Merkez', 'Şarkışla', 'Yıldızeli', 'Suşehri', 'Gemerek', 'Zara', 'Divriği', 'Kangal']
  },
  {
    il: 'Kahramanmaraş',
    ilceler: ['Onikişubat', 'Dulkadiroğlu', 'Elbistan', 'Afşin', 'Göksun', 'Pazarcık', 'Türkoğlu', 'Andırın']
  },
  {
    il: 'Zonguldak',
    ilceler: ['Merkez', 'Ereğli', 'Çaycuma', 'Devrek', 'Kozlu', 'Kilimli', 'Alaplı']
  },
  {
    il: 'Afyonkarahisar',
    ilceler: ['Merkez', 'Sandıklı', 'Dinar', 'Bolvadin', 'Emirdağ', 'Çay', 'İhsaniye', 'Şuhut']
  },
  {
    il: 'Ordu',
    ilceler: ['Altınordu', 'Ünye', 'Fatsa', 'Perşembe', 'Kumru', 'Korgan', 'Gölköy', 'Aybastı']
  },
  {
    il: 'Kırklareli',
    ilceler: ['Merkez', 'Lüleburgaz', 'Babaeski', 'Vize', 'Pınarhisar', 'Demirköy (İğneada)']
  },
  {
    il: 'Edirne',
    ilceler: ['Merkez', 'Keşan', 'Uzunköprü', 'İpsala', 'Havsa', 'Enez']
  },
  {
    il: 'Uşak',
    ilceler: ['Merkez', 'Banaz', 'Eşme', 'Sivaslı', 'Ulubey', 'Karahallı']
  },
  {
    il: 'Isparta',
    ilceler: ['Merkez', 'Yalvaç', 'Eğirdir', 'Şarkikaraağaç', 'Gelendost', 'Keçiborlu', 'Senirkent']
  },
  {
    il: 'Burdur',
    ilceler: ['Merkez', 'Bucak', 'Gölhisar', 'Yeşilova (Salda)', 'Ağlasun (Sagalassos)']
  },
  {
    il: 'Bolu',
    ilceler: ['Merkez', 'Gerede', 'Mengen', 'Göynük', 'Mudurnu', 'Yeniçağa', 'Seben']
  },
  {
    il: 'Düzce',
    ilceler: ['Merkez', 'Akçakoca', 'Kaynaşlı', 'Gölyaka', 'Çilimli', 'Yığılca']
  },
  {
    il: 'Yalova',
    ilceler: ['Merkez', 'Çiftlikköy', 'Çınarcık', 'Altınova', 'Armutlu', 'Termal']
  },
  {
    il: 'Kastamonu',
    ilceler: ['Merkez', 'Tosya', 'Taşköprü', 'Cide', 'İnebolu', 'Araç', 'Devrekani']
  },
  {
    il: 'Rize',
    ilceler: ['Merkez', 'Çayeli', 'Ardeşen', 'Pazar', 'Fındıklı', 'Çamlıhemşin (Ayder)', 'İkizdere', 'Güneysu']
  },
  {
    il: 'Giresun',
    ilceler: ['Merkez', 'Bulancak', 'Espiye', 'Görele', 'Tirebolu', 'Eynesil', 'Şebinkarahisar']
  },
  {
    il: 'Artvin',
    ilceler: ['Merkez', 'Hopa', 'Borçka (Karagöl)', 'Arhavi', 'Yusufeli', 'Şavşat', 'Murgul']
  },
  {
    il: 'Nevşehir',
    ilceler: ['Merkez', 'Ürgüp (Kapadokya)', 'Avanos', 'Göreme', 'Uçhisar', 'Derinkuyu', 'Kozaklı', 'Gülşehir']
  },
  {
    il: 'Amasya',
    ilceler: ['Merkez', 'Merzifon', 'Suluova', 'Taşova', 'Gümüşhacıköy']
  },
  {
    il: 'Tokat',
    ilceler: ['Merkez', 'Erbaa', 'Turhal', 'Niksar', 'Zile', 'Reşadiye']
  },
  {
    il: 'Karabük',
    ilceler: ['Merkez', 'Safranbolu', 'Yenice', 'Eskipazar']
  },
  {
    il: 'Bartın',
    ilceler: ['Merkez', 'Amasra', 'Ulus', 'Kurucaşile']
  },
  {
    il: 'Sinop',
    ilceler: ['Merkez', 'Boyabat', 'Gerze', 'Ayancık', 'Türkeli', 'Durağan']
  },
  {
    il: 'Aksaray',
    ilceler: ['Merkez', 'Ortaköy', 'Eskil', 'Gülağaç', 'Güzelyurt (Ihlara)']
  },
  {
    il: 'Kırşehir',
    ilceler: ['Merkez', 'Kaman', 'Mucur', 'Çiçekdağı']
  },
  {
    il: 'Niğde',
    ilceler: ['Merkez', 'Bor', 'Çiftlik', 'Ulukışla', 'Altunhisar']
  },
  {
    il: 'Yozgat',
    ilceler: ['Merkez', 'Sorgun', 'Akdağmadeni', 'Boğazlıyan', 'Yerköy']
  },
  {
    il: 'Kırıkkale',
    ilceler: ['Merkez', 'Yahşihan', 'Keskin', 'Bahşılı', 'Delice']
  },
  {
    il: 'Karaman',
    ilceler: ['Merkez', 'Ermenek', 'Sarıveliler', 'Ayrancı']
  },
  {
    il: 'Osmaniye',
    ilceler: ['Merkez', 'Kadirli', 'Düziçi', 'Bahçe', 'Toprakkale']
  },
  {
    il: 'Erzurum',
    ilceler: ['Yakutiye', 'Palandöken', 'Aziziye', 'Oltu', 'Horasan', 'Pasinler', 'İspir']
  },
  {
    il: 'Erzincan',
    ilceler: ['Merkez', 'Tercan', 'Üzümlü', 'Çayırlı', 'İliç', 'Kemaliye']
  },
  {
    il: 'Kars',
    ilceler: ['Merkez', 'Sarıkamış', 'Kağızman', 'Digor', 'Selim']
  },
  {
    il: 'Ağrı',
    ilceler: ['Merkez', 'Doğubayazıt', 'Patnos', 'Diyadin', 'Eleşkirt']
  },
  {
    il: 'Iğdır',
    ilceler: ['Merkez', 'Tuzluca', 'Aralık', 'Karakoyunlu']
  },
  {
    il: 'Ardahan',
    ilceler: ['Merkez', 'Göle', 'Çıldır', 'Hanak', 'Posof']
  },
  {
    il: 'Mardin',
    ilceler: ['Artuklu', 'Kızıltepe', 'Midyat', 'Nusaybin', 'Derik', 'Mazıdağı']
  },
  {
    il: 'Batman',
    ilceler: ['Merkez', 'Kozluk', 'Sason', 'Hasankeyf', 'Beşiri', 'Gercüş']
  },
  {
    il: 'Siirt',
    ilceler: ['Merkez', 'Kurtalan', 'Pervari', 'Baykan', 'Şirvan', 'Eruh']
  },
  {
    il: 'Şırnak',
    ilceler: ['Merkez', 'Cizre', 'Silopi', 'İdil', 'Uludere', 'Beytüşşebap']
  },
  {
    il: 'Hakkari',
    ilceler: ['Merkez', 'Yüksekova', 'Şemdinli', 'Çukurca', 'Derecik']
  },
  {
    il: 'Adıyaman',
    ilceler: ['Merkez', 'Kahta (Nemrut)', 'Besni', 'Gölbaşı', 'Gerger', 'Sincik']
  },
  {
    il: 'Elazığ',
    ilceler: ['Merkez', 'Kovancılar', 'Karakoçan', 'Palu', 'Baskil', 'Sivrice (Hazar Gölü)']
  },
  {
    il: 'Tunceli',
    ilceler: ['Merkez', 'Ovacık (Munzur)', 'Pertek', 'Hozat', 'Çemişgezek', 'Nazımiye', 'Mazgirt', 'Pülümür']
  },
  {
    il: 'Bingöl',
    ilceler: ['Merkez', 'Genç', 'Solhan', 'Karlıova', 'Adaklı', 'Kiğı']
  },
  {
    il: 'Muş',
    ilceler: ['Merkez', 'Bulanık', 'Malazgirt', 'Varto', 'Hasköy', 'Korkut']
  },
  {
    il: 'Bitlis',
    ilceler: ['Merkez', 'Tatvan (Van Gölü)', 'Ahlat', 'Güroymak', 'Adilcevaz', 'Hizan', 'Mutki']
  },
  {
    il: 'Bayburt',
    ilceler: ['Merkez', 'Demirözü', 'Aydıntepe']
  },
  {
    il: 'Gümüşhane',
    ilceler: ['Merkez', 'Kelkit', 'Şiran', 'Kürtün', 'Torul']
  },
  {
    il: 'Kilis',
    ilceler: ['Merkez', 'Musabeyli', 'Elbeyli', 'Polateli']
  },
  {
    il: 'Çankırı',
    ilceler: ['Merkez', 'Çerkeş', 'Ilgaz', 'Orta', 'Şabanözü']
  },
  {
    il: 'Bilecik',
    ilceler: ['Merkez', 'Bozüyük', 'Osmaneli', 'Söğüt', 'Pazaryeri', 'Gölpazarı']
  },
  {
    il: 'Yurt Dışı / Global',
    ilceler: [
      'Berlin, Almanya', 'Köln, Almanya', 'Münih, Almanya', 'Frankfurt, Almanya',
      'Londra, Birleşik Krallık', 'Manchester, Birleşik Krallık',
      'Amsterdam, Hollanda', 'Rotterdam, Hollanda',
      'Paris, Fransa', 'Lyon, Fransa',
      'Brüksel, Belçika', 'Viyana, Avusturya', 'Zürih, İsviçre', 'Cenevre, İsviçre',
      'Stockholm, İsveç', 'Kopenhag, Danimarka', 'Oslo, Norveç', 'Helsinki, Finlandiya',
      'New York, ABD', 'Los Angeles, ABD', 'San Francisco, ABD', 'Chicago, ABD',
      'Toronto, Kanada', 'Vancouver, Kanada', 'Montreal, Kanada',
      'Melbourne, Avustralya', 'Sidney, Avustralya', 'Tokyo, Japonya', 'Seul, Güney Kore',
      'Diğer Yurt Dışı'
    ]
  }
];

// Alphabetical ordering with Turkish collation (Ç, Ğ, İ, Ö, Ş, Ü sort correctly).
// Applied here so every consumer of TURKEY_LOCATIONS gets sorted data.
const trCollator = new Intl.Collator('tr');
export const TURKEY_LOCATIONS: ProvinceData[] = RAW_TURKEY_LOCATIONS.map((province) => ({
  ...province,
  ilceler: [...province.ilceler].sort(trCollator.compare),
})).sort((a, b) => trCollator.compare(a.il, b.il));

export const POPULAR_CITIES = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Eskişehir',
  'Antalya',
  'Bursa',
  'Adana',
  'Çanakkale',
  'Muğla',
  'Kocaeli',
  'Trabzon',
  'Gaziantep',
  'Yurt Dışı / Global',
];

export function getAllProvinces(): string[] {
  return TURKEY_LOCATIONS.map((loc) => loc.il);
}

export function getDistricts(provinceName: string): string[] {
  const found = TURKEY_LOCATIONS.find(
    (loc) => loc.il.toLowerCase() === provinceName.toLowerCase()
  );
  return found ? found.ilceler : [];
}

export function parseLocationString(locationStr?: string): { province: string; district: string } {
  if (!locationStr) return { province: 'İstanbul', district: 'Kadıköy' };
  
  // Possible formats: "Kadıköy, İstanbul" or "İstanbul" or "Berlin, Almanya"
  const parts = locationStr.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    // If second part is a known province
    const secondPartMatch = TURKEY_LOCATIONS.find(l => l.il.toLowerCase() === parts[1].toLowerCase());
    if (secondPartMatch) {
      return { province: secondPartMatch.il, district: parts[0] };
    }
    // If first part is a known province
    const firstPartMatch = TURKEY_LOCATIONS.find(l => l.il.toLowerCase() === parts[0].toLowerCase());
    if (firstPartMatch) {
      return { province: firstPartMatch.il, district: parts[1] };
    }
    return { province: parts[1], district: parts[0] };
  }
  
  const singleMatch = TURKEY_LOCATIONS.find(l => l.il.toLowerCase() === locationStr.toLowerCase());
  if (singleMatch) {
    return { province: singleMatch.il, district: singleMatch.ilceler[0] || 'Merkez' };
  }

  return { province: locationStr, district: '' };
}

export function formatLocationString(district: string, province: string): string {
  if (!district || district === 'Tüm İlçeler' || district === 'Merkez') {
    return province;
  }
  return `${district}, ${province}`;
}
