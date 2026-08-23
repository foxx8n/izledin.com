import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

type FilledProps = IconProps & { filled?: boolean };

const Base = ({ size = 20, className = '', children, ...props }: IconProps & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"
    className={`inline-block shrink-0 ${className}`} {...props}>{children}</svg>
);

/* IZLEDİN — V2 / 35MM MODERNIST ICON SYSTEM
 * Rules: 24×24 grid, 2px monoline, square terminals, no rounded corners,
 * restrained film perforation cues, currentColor first, red/gold only as semantic accents.
 */

export function CinemaLogoMark({ size = 32, className = '', ...props }: IconProps) {
  const n = typeof size === 'number' ? size : parseInt(String(size), 10) || 32;
  return <svg width={Math.round(n * 296 / 206)} height={n} viewBox="0 0 296 206" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block shrink-0 ${className}`} {...props}>
    <path d="M18 22h278v184H18z" fill="#DC2626"/>
    <rect x="0" y="0" width="278" height="184" fill="#0A0A0A"/>
    <g fill="#FAFAFA">
      <path d="M16 16h30v24H16zM16 52h30v24H16zM16 108h30v24H16zM16 144h30v24H16z"/>
      <path d="M232 16h30v24h-30zM232 52h30v24h-30zM232 108h30v24h-30zM232 144h30v24h-30z"/>
      <path d="M61 92C91 50 126 29 139 29s48 21 78 63c-30 42-65 63-78 63S91 134 61 92Z"/>
    </g>
    <circle cx="139" cy="92" r="42" fill="#0A0A0A"/><circle cx="139" cy="92" r="33" fill="#DC2626"/>
    <path d="M130 72l28 20-28 20z" fill="#FAFAFA"/>
  </svg>;
}

export function CinemaFullLogo({ height = 36, className = '', ...props }: React.SVGProps<SVGSVGElement> & { height?: number }) {
  const width = Math.round(height * 1200 / 360);
  return <svg width={width} height={height} viewBox="0 0 1200 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`} {...props}>
    <g transform="translate(38 48)"><path d="M18 22h278v188H18z" fill="#DC2626"/><rect width="278" height="188" fill="#0A0A0A"/>
      <g fill="#FAFAFA"><path d="M16 16h30v24H16zM16 52h30v24H16zM16 112h30v24H16zM16 148h30v24H16zM232 16h30v24h-30zM232 52h30v24h-30zM232 112h30v24h-30zM232 148h30v24h-30z"/><path d="M61 94C91 52 126 31 139 31s48 21 78 63c-30 42-65 63-78 63S91 136 61 94Z"/></g><circle cx="139" cy="94" r="43" fill="#0A0A0A"/><circle cx="139" cy="94" r="34" fill="#DC2626"/><path d="M130 74l29 20-29 20z" fill="#FAFAFA"/></g>
    <text x="355" y="184" fontFamily="var(--font-geist-sans),Arial,sans-serif" fontWeight="900" fontSize="128" letterSpacing="-6" fill="currentColor">izledin</text>
    <rect x="978" y="100" width="184" height="94" fill="#0A0A0A"/><rect x="970" y="92" width="184" height="94" fill="#DC2626"/>
    <text x="986" y="163" fontFamily="var(--font-geist-sans),Arial,sans-serif" fontWeight="900" fontSize="62" letterSpacing="-2" fill="#fff">.com</text>
  </svg>;
}

export function FilmReelIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="6" r="2"/><circle cx="17.2" cy="9" r="2"/><circle cx="17.2" cy="15" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="6.8" cy="15" r="2"/><circle cx="6.8" cy="9" r="2"/></Base>; }
export function ClapperboardIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M3 8h18v13H3z"/><path d="M3 8l2-5h17l-2 5H3z"/><path d="M8 3l3 5M14 3l3 5M20 3l-2 5"/></Base>; }
export function CinemaTicketIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M3 6h18v4a3 3 0 0 0 0 5v3H3v-3a3 3 0 0 0 0-5V6z"/><path d="M12 6v12" strokeDasharray="2 2"/></Base>; }
export function FilmStripIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><rect x="3" y="3" width="18" height="18"/><rect x="7" y="7" width="10" height="10"/><path d="M3 7h4M3 12h4M3 17h4M17 7h4M17 12h4M17 17h4"/></Base>; }
export function CinemaSearchLensIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 7.5h5M8 10.5h3" strokeWidth="1.5"/></Base>; }
export function MasterpieceLaurelIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M5 19c-2-5-1-10 3-14M19 19c2-5 1-10-3-14M7 15c-2 0-3-1-4-2M8 10C6 10 5 9 4 8M17 15c2 0 3-1 4-2M16 10c2 0 3-1 4-2"/><path d="M12 5l1.5 3h3l-2.5 2 1 3-3-1.8L9 13l1-3-2.5-2h3z"/></Base>; }
export function CinemaFlameIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 21c4 0 7-3 7-7 0-3-2-5-4-7 0 2-1 3-2 4-1-4-3-6-3-8-3 3-5 6-5 10 0 5 3 8 7 8z"/><path d="M12 17c1.5 0 2.5-1 2.5-2.5 0-1-.6-1.8-1.5-2.8-.2 1-.7 1.7-1.5 2.2-.6-1.1-1-1.7-1.1-2.3-.7.8-1 1.7-1 2.7 0 1.6 1 2.7 2.6 2.7z"/></Base>; }
export function CinemaPopcornIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M5 9h14l-2 12H7L5 9z"/><path d="M5 9c-1-2 0-4 2-4 1-2 4-2 5 0 1-2 4-2 5 0 2 0 3 2 2 4"/><path d="M9 10l1 10M15 10l-1 10"/></Base>; }
export function CinemaProjectorIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><rect x="3" y="9" width="12" height="11"/><circle cx="6" cy="5" r="3"/><circle cx="12" cy="5" r="3"/><path d="M15 12l6-3v12l-6-3"/></Base>; }
export function CinemaTrophyIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M7 3h10v7a5 5 0 0 1-10 0V3z"/><path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4M12 15v5M8 21h8"/></Base>; }
export function CinemaStarIcon({ size = 18, className = '', filled = true, ...props }: FilledProps) { return <Base size={size} className={className} {...props}><path d="M12 2l3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1L12 2z" fill={filled ? 'currentColor' : 'none'}/></Base>; }
export function SwissSparkleIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/><circle cx="12" cy="12" r="3" fill="currentColor"/></Base>; }
export function CinemaPlusPassIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M3 5h18v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6V5z"/><path d="M12 8v8M8 12h8"/></Base>; }
export const CinemaCrownIcon = CinemaPlusPassIcon;
export function CinemaHeartIcon({ size = 20, className = '', filled = false, ...props }: FilledProps) { return <Base size={size} className={className} {...props}><path d="M20.8 5.7a5.3 5.3 0 0 0-7.5 0L12 7l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-7.8a5.3 5.3 0 0 0 0-7.5z" fill={filled ? 'currentColor' : 'none'}/><path d="M12 9v4" strokeWidth="1.5"/></Base>; }
export function CinemaChatIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M4 4h16v11H9l-5 5V4z"/><path d="M8 8h8M8 11h5" strokeWidth="1.5"/></Base>; }
export function CinemaFrequencyIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M2 13h4l2-7 4 13 3-9 2 3h5"/></Base>; }
export function CinemaCalendarIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><rect x="3" y="5" width="18" height="16"/><path d="M8 3v4M16 3v4M3 10h18"/><rect x="7" y="13" width="2" height="2" fill="currentColor"/><rect x="11" y="13" width="2" height="2" fill="currentColor"/><rect x="15" y="13" width="2" height="2" fill="currentColor"/></Base>; }
export function CinemaUserIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/></Base>; }
export function CinemaQuoteIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M10 8H6v5h4v3a3 3 0 0 1-3 3M18 8h-4v5h4v3a3 3 0 0 1-3 3"/></Base>; }
export function CinemaShieldIcon({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3z"/><path d="M12 8v5M12 16h.01"/></Base>; }
export function CinemaVerifiedSeal({ size = 20, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 2l3 2 3.5-.2 1.3 3.2 2.2 2.8-1.5 3.2.2 3.5-3.2 1.3-2.8 2.2-3.2-1.5-3.5.2-1.3-3.2-2.2-2.8 1.5-3.2-.2-3.5 3.2-1.3L12 2z"/><path d="M8 12l2.5 2.5L16 9"/></Base>; }
export function CinemaCheckIcon({ size = 16, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M4 12l5 5L20 6" strokeWidth="2.5"/></Base>; }
export function IzledinPlusBadge({ className = '', size = 'md' }: { className?: string; size?: 'sm'|'md'|'lg' }) { const px={sm:'px-1.5 py-0.5 text-[10px]',md:'px-2 py-1 text-[11px]',lg:'px-3 py-1.5 text-xs'}[size]; return <span className={`inline-flex items-center gap-1.5 border-2 border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-mono font-black tracking-wider uppercase shadow-[2px_2px_0_#0A0A0A] ${px} ${className}`}><CinemaPlusPassIcon size={12}/><span>IZLEDIN<span>+</span></span></span>; }

export function CinemaRadarScannerIllustration({ size = 72, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/><path d="M12 3v2M21 12h-2M12 21v-2M3 12h2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Base>; }
export function CinemaFriendshipIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/><path d="M8 7v10M16 7v10M10.5 12h3"/></Base>; }
export function CinemaRomanceIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 20l-1.2-1.1C5.8 14.4 3 11.8 3 8.5A5.5 5.5 0 0 1 8.5 3c1.5 0 2.8.6 3.5 1.7C12.7 3.6 14 3 15.5 3A5.5 5.5 0 0 1 21 8.5c0 3.3-2.8 5.9-7.8 10.4L12 20z"/><path d="M12 8v5M9.5 10.5h5" strokeWidth="1.5"/></Base>; }
export function CinemaDuoIntentIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M3 6h14v9H3z"/><path d="M7 15v3h14V9h-4"/><path d="M7 10h6M10 7v7" strokeWidth="1.5"/></Base>; }
export function CinemaTrustShieldIcon({ size = 16, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 3l7 3v5c0 4.5-2.8 7.5-7 9-4.2-1.5-7-4.5-7-9V6l7-3z"/><path d="M8.5 12l2.2 2.2 4.8-4.8"/></Base>; }
export function CinemaDeckStackIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><rect x="5" y="2" width="14" height="15"/><rect x="3" y="6" width="14" height="15"/><path d="M7 10h6v6H7z"/></Base>; }
export function CinemaGridMatrixIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Base>; }
export function CinemaDnaHelixIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M5 3c7 4 7 14 14 18M19 3C12 7 12 17 5 21"/><path d="M7 6h10M8 10h8M8 14h8M7 18h10" strokeWidth="1.5"/></Base>; }
export function CinemaPassTicketIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M3 5h18v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6V5z"/><path d="M12 5v14" strokeDasharray="2 2"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/></Base>; }
export function CinemaRadarSweepIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 12V3a9 9 0 0 1 9 9"/><path d="M12 12l6.4-6.4"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor"/></Base>; }
export function CinemaCelluloidSparkIcon({ size = 18, className = '', ...props }: IconProps) { return <Base size={size} className={className} {...props}><path d="M12 2v20M2 12h20"/><path d="M5 5l14 14M19 5L5 19" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/></Base>; }
