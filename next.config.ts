import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  turbopack: {
    // Pin Turbopack's inferred workspace root to this directory so it stops
    // walking up to the user home dir and warning about multiple lockfiles.
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/gizlilik",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/kullanim",
        permanent: true,
      },
      {
        source: "/community",
        destination: "/topluluk",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/iletisim",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Phase-1 CSP. Hosts are limited to what src/ actually loads:
    // - image.tmdb.org / m.media-amazon.com : TMDB + OMDB posters (layout.tsx preconnects both)
    // - images.unsplash.com                 : poster fallbacks in services + admin/diary pages
    // - lh3.googleusercontent.com           : Google account avatar URLs stored as user_metadata.picture
    // - api.dicebear.com                    : generated initial-avatar fallbacks
    // - hipavaiaumdkpqqwvlzp.supabase.co    : Supabase storage public URLs + auth/db/realtime
    // 'unsafe-inline' on style/script is the phase-1 concession for Tailwind's
    // runtime styles and Next.js inline bootstrap scripts. 'unsafe-eval' is a
    // DEV-ONLY concession: React's dev-mode debugger uses eval() for callstack
    // reconstruction; production React never does.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
    const contentSecurityPolicy = [
      "default-src 'self'",
      `img-src 'self' https://image.tmdb.org https://m.media-amazon.com https://ia.media-imdb.com https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://cdn.myanimelist.net https://api.dicebear.com https://hipavaiaumdkpqqwvlzp.supabase.co https://*.supabase.co data: blob:`,
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      "connect-src 'self' https://hipavaiaumdkpqqwvlzp.supabase.co wss://hipavaiaumdkpqqwvlzp.supabase.co",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;


