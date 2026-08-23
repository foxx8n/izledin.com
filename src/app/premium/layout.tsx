import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'izledin+ Kulüp Üyeliği & Sinefil Ayrıcalıkları — izledin.com',
  description:
    'Sınırsız İzdaş eşleşmesi, özel 35mm kulüp rozetleri, derin zevk profillemesi ve reklamsız bağımsız sinema deneyimi.',
  alternates: {
    canonical: 'https://www.izledin.com/premium',
  },
  openGraph: {
    title: 'izledin+ Kulüp Üyeliği & Sinefil Ayrıcalıkları — izledin.com',
    description:
      'Sınırsız İzdaş eşleşmesi, özel 35mm kulüp rozetleri ve derin zevk profillemesi.',
    url: 'https://www.izledin.com/premium',
    type: 'website',
  },
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
