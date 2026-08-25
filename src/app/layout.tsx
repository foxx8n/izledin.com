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
  },
  title: "İzledin — Zevkinle Eşleşen Sinema Kulübü | Film, Dizi, Anime İzdaş Bul",
  description:
    "Sinema DNA'nı çıkar; aynı filmlerde ağlayıp aynı sahnelerde ürperdiğin izdaşınla eşleş. Film, dizi ve anime için Türkçe sosyal sinema kulübü.",
  keywords: [
    "izledin",
    "izdaş",
    "izdaşlar",
    "sinema eşleşme",
    "film günlüğü",
    "anime takip",
    "sinema kulübü",
    "izdaş bul",
    "dizi izleme geçmişi",
    "film önerisi",
  ],
  authors: [{ name: "izledin.com" }],
  openGraph: {
    title: "İzledin — Aynı Filmlerde Ağlayan İzdaşını Bul",
    description:
      "Sinema DNA'nla eşleşen insanları keşfet. İzlediklerini puanla, günlüğüne yaz, izdaşlarınla sohbete açıl.",
    url: "https://www.izledin.com",
    siteName: "izledin.com",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "https://www.izledin.com/signature.png",
        width: 1200,
        height: 630,
        alt: "izledin.com 35mm Sinema Kulübü",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "izledin.com — 35mm Sinefil Kulübü & İzdaş Keşif",
    description:
      "Film zevkine en yakın İzdaşlarını bul, izlediklerini daktilo ile puanla.",
    images: [
      "/api/og/movie?title=izledin.com&year=2026&director=35mm+Sinefil+Kulubu&rating=9.9",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.izledin.com/#website",
        name: "izledin.com",
        url: "https://www.izledin.com/",
        description: "Zevkinle Eşleşen Sinema Kulübü — film, dizi ve anime izdaşları",
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
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://m.media-amazon.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://hipavaiaumdkpqqwvlzp.supabase.co" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://hipavaiaumdkpqqwvlzp.supabase.co" />
      </head>
      <body className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] pb-mobile-nav selection:bg-[#DC2626] selection:text-white overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <AuthProvider>
          {children}
          <OfflineSyncIndicator />
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
