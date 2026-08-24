const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Custom high-quality poster overrides for iconic Turkish & cult movies
const CURATED_POSTERS = {
  'tt1180340': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 1
  'tt1371151': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 2
  'tt1577061': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 3
  'tt3501756': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 4
  'tt6316138': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 5
  'tt10756770': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 6
  'tt23730248': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop', // Recep Ivedik 7
  'tt0384116': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', // G.O.R.A.
  'tt1284575': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', // A.R.O.G
  'tt0480302': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop', // Babam ve Oğlum
  'tt0116231': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop', // Eşkıya
  'tt0275806': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop', // Vizontele
  'tt7458856': 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop', // Ölümlü Dünya
  'tt13970894': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop', // Gibi
  'tt0252487': 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?q=80&w=800&auto=format&fit=crop', // Hababam Sınıfı
  'tt0252055': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop', // Tosun Paşa
  'tt2758880': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', // Kış Uykusu
  'tt1827487': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop', // Bir Zamanlar Anadolu'da
};

async function fixPosters() {
  console.log(`Starting poster health check for ${catalog.length} items...`);
  let fixedCount = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const chunk = catalog.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (item) => {
      if (CURATED_POSTERS[item.id]) {
        item.posterPath = CURATED_POSTERS[item.id];
        if (!item.backdropPath || item.backdropPath.includes('m.media-amazon.com')) {
          item.backdropPath = CURATED_POSTERS[item.id];
        }
        fixedCount++;
        return;
      }

      if (!item.posterPath || !item.posterPath.startsWith('http')) {
        item.posterPath = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.title || 'Izledin')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`;
        item.backdropPath = item.posterPath;
        fixedCount++;
        return;
      }

      try {
        const res = await fetch(item.posterPath, { method: 'HEAD', signal: AbortSignal.timeout(3500) });
        if (!res.ok) {
          item.posterPath = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.title || 'Izledin')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`;
          item.backdropPath = item.posterPath;
          fixedCount++;
        }
      } catch (err) {
        item.posterPath = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.title || 'Izledin')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`;
        item.backdropPath = item.posterPath;
        fixedCount++;
      }
    }));
    process.stdout.write(`Processed ${Math.min(i + BATCH_SIZE, catalog.length)} / ${catalog.length} (Fixed: ${fixedCount})\r`);
  }

  console.log(`\nWriting updated catalog.json with ${fixedCount} fixed posters...`);
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('Successfully saved clean catalog.json!');
}

fixPosters();
