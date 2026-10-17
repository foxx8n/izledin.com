/**
 * 35MM ARTFUL POSTER PLACEHOLDER GENERATOR
 *
 * Replaces generic initials (DiceBear) with an expressive, authentic 35mm
 * brutalist film negative archive poster whenever an image fails to load,
 * is missing, or is blocked by third-party CDNs.
 */

import type React from 'react';

function escapeXml(unsafe: string = ''): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function wrapTitleLines(text: string = '', maxCharsPerLine = 15, maxLines = 3): string[] {
  const words = (text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : ['CULT TITLE'];
}

export function getArtfulPosterSvg(
  title: string = 'CULT TITLE',
  year?: number | string,
  genre: string = 'CINEMA'
): string {
  const safeTitle = escapeXml(title.toUpperCase());
  const safeYear = escapeXml(String(year || 'ARCHIVE'));
  const safeGenre = escapeXml(String(genre || 'CINEMA').toUpperCase());
  const lines = wrapTitleLines(safeTitle, 14, 3);

  const titleTspans = lines
    .map((line, idx) => {
      const y = 305 + (idx - (lines.length - 1) / 2) * 34;
      return `<text x="200" y="${y}" text-anchor="middle" font-family="'Courier New', monospace" font-size="24" font-weight="900" fill="#FAFAFA" letter-spacing="1.5">${line}</text>`;
    })
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1A1A1A" />
      <stop offset="100%" stop-color="#080808" />
    </radialGradient>
    <pattern id="filmstripes" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="24" stroke="#EF4444" stroke-width="1.5" stroke-opacity="0.08" />
    </pattern>
  </defs>

  <!-- Background Canvas -->
  <rect width="400" height="600" fill="url(#vignette)" />
  <rect width="400" height="600" fill="url(#filmstripes)" />

  <!-- Outer 35mm Frame Border -->
  <rect x="14" y="14" width="372" height="572" fill="none" stroke="#2B2B2B" stroke-width="2" />
  <rect x="20" y="20" width="360" height="560" fill="none" stroke="#1F1F1F" stroke-width="1" stroke-dasharray="4,4" />

  <!-- 35mm Sprocket Holes (Perforations) -->
  <g fill="#000000" stroke="#333333" stroke-width="1">
    <rect x="4" y="30" width="8" height="14" rx="2" />
    <rect x="4" y="80" width="8" height="14" rx="2" />
    <rect x="4" y="130" width="8" height="14" rx="2" />
    <rect x="4" y="180" width="8" height="14" rx="2" />
    <rect x="4" y="230" width="8" height="14" rx="2" />
    <rect x="4" y="280" width="8" height="14" rx="2" />
    <rect x="4" y="330" width="8" height="14" rx="2" />
    <rect x="4" y="380" width="8" height="14" rx="2" />
    <rect x="4" y="430" width="8" height="14" rx="2" />
    <rect x="4" y="480" width="8" height="14" rx="2" />
    <rect x="4" y="530" width="8" height="14" rx="2" />

    <rect x="388" y="30" width="8" height="14" rx="2" />
    <rect x="388" y="80" width="8" height="14" rx="2" />
    <rect x="388" y="130" width="8" height="14" rx="2" />
    <rect x="388" y="180" width="8" height="14" rx="2" />
    <rect x="388" y="230" width="8" height="14" rx="2" />
    <rect x="388" y="280" width="8" height="14" rx="2" />
    <rect x="388" y="330" width="8" height="14" rx="2" />
    <rect x="388" y="380" width="8" height="14" rx="2" />
    <rect x="388" y="430" width="8" height="14" rx="2" />
    <rect x="388" y="480" width="8" height="14" rx="2" />
    <rect x="388" y="530" width="8" height="14" rx="2" />
  </g>

  <!-- Top Cinema Header Strip -->
  <g font-family="'Courier New', monospace" font-size="9" font-weight="900" fill="#737373" letter-spacing="1.5">
    <text x="32" y="42">● 35MM NEGATIVE ARCHIVE</text>
    <text x="368" y="42" text-anchor="end">FRAME #2026</text>
    <line x1="32" y1="50" x2="368" y2="50" stroke="#2B2B2B" stroke-width="1.5" />
  </g>

  <!-- Central Visual: Optical Aperture & Film Reel -->
  <g transform="translate(200, 150)">
    <circle r="56" fill="none" stroke="#222222" stroke-width="2" />
    <circle r="48" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8" />
    <circle r="40" fill="#121212" stroke="#333333" stroke-width="2" />
    <circle r="18" fill="#080808" stroke="#EF4444" stroke-width="2.5" />
    <circle r="7" fill="#EF4444" />

    <!-- Projector Optical Spokes -->
    <line x1="0" y1="-40" x2="0" y2="40" stroke="#333333" stroke-width="1.5" />
    <line x1="-40" y1="0" x2="40" y2="0" stroke="#333333" stroke-width="1.5" />
    <line x1="-28" y1="-28" x2="28" y2="28" stroke="#333333" stroke-width="1.5" />
    <line x1="-28" y1="28" x2="28" y2="-28" stroke="#333333" stroke-width="1.5" />

    <!-- Stamp overlay -->
    <rect x="-65" y="-12" width="130" height="24" fill="#0A0A0A" stroke="#EF4444" stroke-width="1.5" rx="2" transform="rotate(-6)" />
    <text x="0" y="4" text-anchor="middle" font-family="'Courier New', monospace" font-size="10" font-weight="900" fill="#EF4444" letter-spacing="2" transform="rotate(-6)">IZLEDIN.COM</text>
  </g>

  <!-- Film Title Plaque -->
  <g>
    <rect x="36" y="240" width="328" height="135" fill="#121212" stroke="#2B2B2B" stroke-width="1.5" />
    <rect x="40" y="244" width="320" height="127" fill="none" stroke="#EF4444" stroke-width="1" opacity="0.3" />
    ${titleTspans}
  </g>

  <!-- Metadata Plaque -->
  <g font-family="'Courier New', monospace">
    <rect x="36" y="390" width="328" height="50" fill="#0C0C0C" stroke="#222222" stroke-width="1" />
    <text x="50" y="412" font-size="10" font-weight="900" fill="#EF4444" letter-spacing="1">GENRE: <tspan fill="#CCCCCC">${safeGenre}</tspan></text>
    <text x="50" y="428" font-size="10" font-weight="900" fill="#EF4444" letter-spacing="1">YEAR: <tspan fill="#CCCCCC">${safeYear}</tspan></text>
    <text x="350" y="420" text-anchor="end" font-size="11" font-weight="900" fill="#EF4444">24 FPS</text>
  </g>

  <!-- Vintage Classified Stamp -->
  <g transform="translate(200, 480) rotate(-4)">
    <rect x="-105" y="-14" width="210" height="28" fill="#171717" stroke="#EF4444" stroke-width="2" stroke-dasharray="4,2" />
    <text x="0" y="4" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#EF4444" letter-spacing="2">★ 35MM RESTORATION ★</text>
  </g>

  <!-- Bottom Technical Edge Codes -->
  <g font-family="'Courier New', monospace" font-size="8" font-weight="700" fill="#525252" letter-spacing="1">
    <line x1="32" y1="540" x2="368" y2="540" stroke="#1F1F1F" stroke-width="1" />
    <text x="32" y="556">EASTMAN KODAK CO · SAFETY FILM · TRI-X 400</text>
    <text x="32" y="568">EXPOSURE: ANALOG REC · CINEPHILE CLUB ARCHIVE</text>
  </g>
</svg>`;
}

export function getArtfulPosterDataUri(
  title: string = 'CULT TITLE',
  year?: number | string,
  genre: string = 'CINEMA'
): string {
  const svg = getArtfulPosterSvg(title, year, genre);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isMissingOrDicebearPoster(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === 'null' || trimmed === 'undefined') return true;
  return trimmed.includes('dicebear.com');
}

export function resolvePosterUrl(
  url?: string | null,
  title: string = 'CULT TITLE',
  year?: number | string,
  genre: string = 'CINEMA'
): string {
  if (isMissingOrDicebearPoster(url)) {
    return getArtfulPosterDataUri(title, year, genre);
  }
  return url!;
}

export function applyArtfulPosterFallback(
  event: React.SyntheticEvent<HTMLImageElement>,
  title: string = 'CULT TITLE',
  year?: number | string,
  genre: string = 'CINEMA'
): void {
  const img = event.currentTarget;
  if (!img.dataset.fallbackApplied) {
    img.dataset.fallbackApplied = '1';
    img.src = getArtfulPosterDataUri(title, year, genre);
  }
}
