import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İzdaş Eşleşmeleri & Sinema Arkadaşı Keşfi — izledin.com',
  description:
    'Film, dizi ve anime zevkine en yakın sinema arkadaşlarını (İzdaşları) bul, ortak zevk yüzdesini gör ve sinema sohbetine başla.',
  alternates: {
    canonical: 'https://izledin.com/matches',
  },
  openGraph: {
    title: 'İzdaş Eşleşmeleri & Sinema Arkadaşı Keşfi — izledin.com',
    description:
      'Film ve dizi zevkine en yakın sinema arkadaşlarını bul, ortak zevk yüzdesini gör ve sinema sohbetine başla.',
    url: 'https://izledin.com/matches',
    type: 'website',
  },
};

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
