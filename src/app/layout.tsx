import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["monospace", "Courier New"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.izledin.com"),
  alternates: {
    canonical: "https://www.izledin.com",
    languages: {
      "en": "https://www.izledin.com",
      "tr": "https://www.izledin.com/tr",
      "x-default": "https://www.izledin.com",
    },
  },
  title: "Izledin — Match Your Cinema DNA | Find Movie Mates, Rate Movies & Series",
  description:
    "Discover your cinema DNA and connect with movie mates who cry and get goosebumps at the exact same scenes. Social cinephile club for movies, shows and anime.",
  keywords: [
    "izledin",
    "movie mates",
    "cinephile matching",
    "movie diary",
    "anime tracker",
    "cinema club",
    "find movie mates",
    "tv series tracker",
    "movie recommendations",
    "izdaş",
    "film günlüğü",
    "sinema kulübü",
  ],
  authors: [{ name: "izledin.com" }],
  openGraph: {
    title: "Izledin — Find Movie Mates Who Cry at the Same Scenes",
    description:
      "Discover your cinema DNA, rate movies in a 35mm typewriter diary, and connect with movie mates on your exact wavelength.",
    url: "https://www.izledin.com",
    siteName: "izledin.com",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.izledin.com/signature.png",
        width: 1200,
        height: 630,
        alt: "izledin.com 35mm Cinema Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "izledin.com — 35mm Cinephile Club & Movie Mates Radar",
    description:
      "Find movie mates with matching cinema taste, rate movies in your 35mm typewriter diary.",
    images: [
      "/api/og/movie?title=izledin.com&year=2026&director=35mm+Cinema+Club&rating=9.9",
    ],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
};

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { OfflineSyncIndicator } from "@/components/common/OfflineSyncIndicator";
import { serializeJsonLd } from "@/lib/jsonld";
import { LanguageProvider } from "@/lib/i18n/context";
import { getServerLocale } from "@/lib/i18n/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.izledin.com/#website",
        name: "izledin.com",
        url: "https://www.izledin.com/",
        description:
          locale === "tr"
            ? "Zevkinle Eşleşen Sinema Kulübü — film, dizi ve anime izdaşları"
            : "Social Cinema Club & Movie Mates Radar — movies, series and anime",
        publisher: {
          "@id": "https://www.izledin.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://www.izledin.com/?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://www.izledin.com/#organization",
        name: "izledin.com",
        url: "https://www.izledin.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://www.izledin.com/icon.svg",
          width: 512,
          height: 512,
        },
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://m.media-amazon.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />}
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        {supabaseUrl && <link rel="dns-prefetch" href={supabaseUrl} />}
      </head>
      <body className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] pb-mobile-nav selection:bg-[#DC2626] selection:text-white overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <AuthProvider>
          <LanguageProvider initialLocale={locale}>
            {children}
          </LanguageProvider>
          <OfflineSyncIndicator />
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
