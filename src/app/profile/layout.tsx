import type { Metadata } from 'next';

import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'My Profile & Cinema DNA — izledin.com',
      description: 'Your personal cinema profile, favorite genres, watch stats, and cinephile badges.',
      alternates: {
        canonical: 'https://www.izledin.com/profile',
        languages: {
          en: 'https://www.izledin.com/profile',
          tr: 'https://www.izledin.com/tr/profile',
          'x-default': 'https://www.izledin.com/profile',
        },
      },
      openGraph: {
        title: 'My Profile & Cinema DNA — izledin.com',
        description: 'Your personal cinema profile, favorite genres, watch stats, and cinephile badges.',
        url: 'https://www.izledin.com/profile',
        type: 'website',
      },
    };
  }

  return {
    title: 'Profilim & Sinema DNA — izledin.com',
    description: 'Kişisel sinema profilin, favori türlerin, izleme istatistiklerin ve İzdaş rozetlerin.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/profile',
      languages: {
        en: 'https://www.izledin.com/profile',
        tr: 'https://www.izledin.com/tr/profile',
        'x-default': 'https://www.izledin.com/profile',
      },
    },
    openGraph: {
      title: 'Profilim & Sinema DNA — izledin.com',
      description: 'Kişisel sinema profilin, favori türlerin, izleme istatistiklerin ve İzdaş rozetlerin.',
      url: 'https://www.izledin.com/tr/profile',
      type: 'website',
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
