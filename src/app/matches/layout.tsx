import type { Metadata } from 'next';

import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Movie Mates Matching & Cinephile Radar — izledin.com',
      description:
        'Find cinema mates who share your exact taste in movies, series, and anime. Discover your match percentage and start cinephile conversations.',
      alternates: {
        canonical: 'https://www.izledin.com/matches',
        languages: {
          en: 'https://www.izledin.com/matches',
          tr: 'https://www.izledin.com/tr/matches',
          'x-default': 'https://www.izledin.com/matches',
        },
      },
      openGraph: {
        title: 'Movie Mates Matching & Cinephile Radar — izledin.com',
        description:
          'Find cinema mates who share your exact taste in movies, series, and anime.',
        url: 'https://www.izledin.com/matches',
        type: 'website',
      },
    };
  }

  return {
    title: 'İzdaş Eşleşmeleri & Sinema Arkadaşı Keşfi — izledin.com',
    description:
      'Film, dizi ve anime zevkine en yakın sinema arkadaşlarını (İzdaşları) bul, ortak zevk yüzdesini gör ve sinema sohbetine başla.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/matches',
      languages: {
        en: 'https://www.izledin.com/matches',
        tr: 'https://www.izledin.com/tr/matches',
        'x-default': 'https://www.izledin.com/matches',
      },
    },
    openGraph: {
      title: 'İzdaş Eşleşmeleri & Sinema Arkadaşı Keşfi — izledin.com',
      description:
        'Film ve dizi zevkine en yakın sinema arkadaşlarını bul, ortak zevk yüzdesini gör ve sinema sohbetine başla.',
      url: 'https://www.izledin.com/tr/matches',
      type: 'website',
    },
  };
}

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
