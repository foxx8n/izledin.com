const fs = require('fs');
const path = require('path');
const https = require('https');

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');

let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load catalog.json:', e);
  process.exit(1);
}

console.log(`Loaded catalog with ${catalog.length} items to translate.`);

async function translateWithClients5(text) {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=tr&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json) && json[0]) {
      return json[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function translateWithMyMemory(text) {
  const truncated = text.length > 500 ? text.slice(0, 500) : text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=en|tr`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.responseData?.translatedText) {
      return json.responseData.translatedText;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function translateToTurkish(text) {
  if (!text || text === 'N/A' || text === 'Açıklama henüz eklenmedi.') {
    return 'Açıklama henüz eklenmedi.';
  }

  // Try clients5 first
  let tr = await translateWithClients5(text);
  if (tr && tr !== text) return tr;

  // Fallback to MyMemory
  tr = await translateWithMyMemory(text);
  if (tr && tr !== text) return tr;

  return text;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(`Starting translation sweep for ${catalog.length} items...`);
  const CHUNK_SIZE = 12;
  let translatedCount = 0;

  for (let i = 0; i < catalog.length; i += CHUNK_SIZE) {
    const chunk = catalog.slice(i, i + CHUNK_SIZE);

    await Promise.all(chunk.map(async (item, idx) => {
      const globalIdx = i + idx + 1;
      
      // Ensure English is in overviewEn
      if (!item.overviewEn && item.overview) {
        item.overviewEn = item.overview;
      }

      const sourceEn = item.overviewEn || item.overview || '';
      const currentTr = item.overview || '';

      // Check if overview is already translated to Turkish
      const hasTurkishLetters = /[çğıöşüÇĞİÖŞÜ]/.test(currentTr);
      const isDifferentFromEn = currentTr !== sourceEn && currentTr.length > 20;

      if (hasTurkishLetters && isDifferentFromEn) {
        // Already valid Turkish translation
        return;
      }

      const translated = await translateToTurkish(sourceEn);
      if (translated && translated !== sourceEn) {
        item.overview = translated;
        translatedCount++;
        process.stdout.write(`[${globalIdx}/${catalog.length}] Translated: ${item.title}\n`);
      }
    }));

    if (i % 48 === 0 || i + CHUNK_SIZE >= catalog.length) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      console.log(`💾 Checkpoint saved: ${Math.min(i + CHUNK_SIZE, catalog.length)}/${catalog.length} processed (${translatedCount} translated).`);
    }

    await sleep(60);
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 Translation sweep finished successfully!`);
  console.log(`✨ Total newly translated items: ${translatedCount}`);
  console.log(`📚 Total catalog items: ${catalog.length}`);
}

run();
