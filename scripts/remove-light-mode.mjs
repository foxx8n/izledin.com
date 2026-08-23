// One-off codemod: bake Tailwind `dark:` variants into their base utilities.
// For every `light-class dark:dark-class` pair targeting the same property and
// variant chain, keeps the dark value (unprefixed) — the site is now
// permanently dark, so this preserves today's dark-mode rendering exactly.
//
// Safeguards:
//  - only collapses unambiguous 1:1 pairs; ambiguous groups are logged untouched
//  - `dark:hidden` (and other "always hidden" results) are logged for manual fix,
//    never auto-rewritten, since they mean the element should be deleted
//  - template literals are parsed brace-aware; class strings inside ${}
//    expressions are transformed too
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/app', 'src/components', 'src/context', 'src/lib'];
const EXTENSIONS = ['.tsx', '.ts'];

const DISPLAY_FAMILIES = new Set([
  'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid',
  'inline-grid', 'table', 'inline-table', 'hidden', 'contents', 'flow-root',
  'list-item',
]);

const manualFixes = [];
let totalCollapsed = 0;
let totalUnprefixed = 0;

const PALETTE_PREFIXES =
  /^(white|black|transparent|inherit|current|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d{2,3})?$/;

// True when the utility's value is a color (so it pairs only with colors,
// never with sizes/widths of the same property like text-xs or border-2).
function isColorValue(lastSeg) {
  const dash = lastSeg.indexOf('-');
  let v = dash === -1 ? '' : lastSeg.slice(dash + 1);
  v = v.split('/')[0]; // strip opacity modifier: amber-500/80 -> amber-500
  if (!v) return false; // bare `border`, `bg` etc. — treat as non-color
  if (v.startsWith('[')) return v.includes('#') || /^(rgb|hsl)a?\(/.test(v.slice(1));
  return PALETTE_PREFIXES.test(v);
}

function familyOf(token) {
  const lastSeg = token.split(':').pop();
  if (DISPLAY_FAMILIES.has(lastSeg)) return 'display';
  const m = lastSeg.match(/^([a-z]+)/);
  const fam = m ? m[1] : lastSeg;
  return `${fam}:${isColorValue(lastSeg) ? 'c' : 'o'}`;
}

function variantsOf(token) {
  const segs = token.split(':');
  return segs.slice(0, -1).sort().join(':');
}

// Returns transformed token, or null to drop it. Pushes logs when unsure.
function resolveToken(token, file) {
  if (!token.includes('dark:')) return token;
  const segs = token.split(':');
  const hasDark = segs.includes('dark');
  const base = segs.filter((s) => s !== 'dark');
  const family = familyOf(token);

  // Single pass state is handled per-group by transformTokenList; here we only
  // need per-token identity info.
  return { token, hasDark, base: base.join(':'), family, variants: variantsOf({ token, hasDark, base }) };
}

function transformTokenList(tokens, file) {
  // Group EVERY token by pairing key; only groups containing at least one
  // dark-prefixed member are acted upon.
  const groups = new Map();
  tokens.forEach((t, i) => {
    if (!t) return;
    const info = {
      raw: t,
      segs: t.split(':'),
      hasDark: t.split(':').includes('dark'),
    };
    info.base = info.segs.filter((s) => s !== 'dark').join(':');
    info.family = familyOf(t);
    info.variants = info.segs.slice(0, -1).filter((s) => s !== 'dark').sort().join(':');
    const key = `${info.variants}|${info.family}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ index: i, ...info });
  });

  const drop = new Set();
  const rewrite = new Map(); // index -> new token

  for (const [, members] of groups) {
    if (!members.some((m) => m.hasDark)) continue; // pure-light group
    const darks = members.filter((m) => m.hasDark);
    const lights = members.filter((m) => !m.hasDark);

    if (darks.length && lights.length) {
      // Pair collapse — only when exactly one of each side.
      if (darks.length === 1 && lights.length === 1) {
        rewrite.set(darks[0].index, darks[0].base);
        drop.add(lights[0].index);
        totalCollapsed++;
        // Collapsing to permanent "hidden" leaves an invisible element behind;
        // flag it so the JSX can be deleted outright.
        if (familyOf(darks[0].raw) === 'display' && darks[0].base.split(':').pop() === 'hidden') {
          manualFixes.push(`${file}: pair collapsed to permanent hidden [${lights[0].raw} ${darks[0].raw}] — consider deleting the element`);
        }
      } else {
        manualFixes.push(`${file}: ambiguous group [${members.map((m) => m.raw).join(' ')}]`);
      }
    } else if (darks.length && !lights.length) {
      // Dark-only tokens: unprefix, except display values that mean "always hidden".
      for (const d of darks) {
        if (d.family === 'display' && d.base.split(':').pop() === 'hidden') {
          manualFixes.push(`${file}: standalone "${d.raw}" means always-hidden — element needs manual removal`);
          continue;
        }
        rewrite.set(d.index, d.base);
        totalUnprefixed++;
      }
    }
    // Light-only groups: nothing to do.
  }

  return tokens.map((t, i) => (drop.has(i) ? null : rewrite.has(i) ? rewrite.get(i) : t));
}

// Transform one class-string's contents.
function transformClassString(contents, file) {
  if (!/\bdark:[a-zA-Z]/.test(contents)) return contents;
  const parts = contents.split(/(\s+)/);
  const classes = parts.filter((_, i) => i % 2 === 0);
  const seps = parts.filter((_, i) => i % 2 === 1);
  const resolved = transformTokenList(classes, file);
  // Rebuild preserving original separators.
  let out = '';
  for (let i = 0; i < resolved.length; i++) {
    out += resolved[i] ?? '';
    if (seps[i]) out += seps[i];
  }
  return out;
}

// Split a template literal into static chunks and ${...} expressions (brace-aware).
function splitTemplate(raw, file) {
  const chunks = [];
  let buf = '';
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '$' && raw[i + 1] === '{') {
      chunks.push({ type: 'static', text: buf });
      buf = '';
      let depth = 1;
      let expr = '${';
      i += 2;
      while (i < raw.length && depth > 0) {
        if (raw[i] === '{') depth++;
        else if (raw[i] === '}') depth--;
        if (depth > 0) expr += raw[i];
        i++;
      }
      chunks.push({ type: 'expr', text: expr + '}' });
    } else {
      buf += raw[i];
      i++;
    }
  }
  chunks.push({ type: 'static', text: buf });
  return chunks;
}

const QUOTED = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g;

function transformSource(src, file) {
  // Find every backtick template literal that mentions dark: and process it as a
  // whole; then plain quoted strings.
  let result = src.replace(/`(?:[^`\\]|\\.)*`/g, (m) => {
    if (!/\bdark:[a-zA-Z]/.test(m)) return m;
    const inner = m.slice(1, -1);
    const rebuilt = splitTemplate(inner, file)
      .map((c) => {
        if (c.type === 'static') return transformClassString(c.text, file);
        // Expression: transform any quoted class strings inside it.
        return c.text.replace(QUOTED, (q) => {
          const quote = q[0];
          return quote + transformClassString(q.slice(1, -1), file) + quote;
        });
      })
      .join('');
    return '`' + rebuilt + '`';
  });

  result = result.replace(QUOTED, (q) => {
    const quote = q[0];
    return quote + transformClassString(q.slice(1, -1), file) + quote;
  });

  return result;
}

import { readdirSync, statSync } from 'node:fs';
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) files.push(full);
  }
  return files;
}

const allFiles = ROOTS.flatMap((root) => walk(root));
for (const file of allFiles) {
  const before = readFileSync(file, 'utf8');
  if (!before.includes('dark:')) continue;
  const after = transformSource(before, join(process.cwd(), file));
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    console.log(`updated ${file}`);
  }
}

console.log(`\ncollapsed pairs: ${totalCollapsed}, unprefixed dark-only: ${totalUnprefixed}`);
if (manualFixes.length) {
  console.log(`\nMANUAL FIXES NEEDED (${manualFixes.length}):`);
  for (const f of manualFixes) console.log('  ' + f);
} else {
  console.log('\nno manual fixes needed');
}
