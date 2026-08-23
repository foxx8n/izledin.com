const fs = require('fs');
const path = require('path');
const https = require('https');

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');

let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Error loading catalog.json:', e);
  process.exit(1);
}

console.log(`Loaded catalog with ${catalog.length} items.`);

// Function to translate text via Google Translate API
function translateText(text) {
  if (!text || text === 'N/A' || text === 'Açıklama henüz eklenmedi.') {
    return Promise.resolve(text);
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

    req.on('error', () => {
      resolve(text);
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve(text);
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function processCatalog() {
  let translatedCount = 0;
  let skippedCount = 0;

  console.log(`Starting translation of ${catalog.length} movie synopses to Turkish...`);

  // Process in small parallel chunks
  const CHUNK_SIZE = 8;
  for (let i = 0; i < catalog.length; i += CHUNK_SIZE) {
    const chunk = catalog.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (item, idx) => {
      const globalIndex = i + idx + 1;

      // 1. Preserve English original in overviewEn
      if (!item.overviewEn) {
        item.overviewEn = item.overview;
      }

      // Check if already in Turkish (contains common Turkish letters or already translated)
      const currentOverview = item.overview || '';
      
      // Translate to Turkish
      const translated = await translateText(item.overviewEn || currentOverview);
      
      if (translated && translated !== currentOverview) {
        item.overview = translated;
        translatedCount++;
        process.stdout.write(`[${globalIndex}/${catalog.length}] Translated: ${item.title}\n`);
      } else {
        skippedCount++;
      }
    }));

    // Save checkpoint every 40 items
    if (i % 40 === 0 || i + CHUNK_SIZE >= catalog.length) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      console.log(`💾 Checkpoint saved: ${i + chunk.length}/${catalog.length} items processed.`);
    }

    await sleep(150);
  }

  // Final save
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 Translation completed successfully!`);
  console.log(`✨ Total translated items: ${translatedCount}`);
  console.log(`📚 Total catalog items: ${catalog.length}`);
  console.log(`🔒 English descriptions safely preserved in 'overviewEn'`);
}

processCatalog();
