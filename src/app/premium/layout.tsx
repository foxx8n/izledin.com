import type { Metadata } from 'next';

import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'izledin+ Club Membership & Cinephile Perks — izledin.com',
      description:
        'Unlimited movie mate matching, exclusive 35mm badges, deep cinema taste profiling, and ad-free independent cinema club.',
      alternates: {
        canonical: 'https://www.izledin.com/premium',
        languages: {
          en: 'https://www.izledin.com/premium',
          tr: 'https://www.izledin.com/tr/premium',
          'x-default': 'https://www.izledin.com/premium',
        },
      },
      openGraph: {
        title: 'izledin+ Club Membership & Cinephile Perks — izledin.com',
        description:
          'Unlimited movie mate matching, exclusive 35mm badges, and deep cinema profiling.',
        url: 'https://www.izledin.com/premium',
        type: 'website',
      },
    };
  }

  return {
    title: 'izledin+ Kulüp Üyeliği & Sinefil Ayrıcalıkları — izledin.com',
    description:
      'Sınırsız İzdaş eşleşmesi, özel 35mm kulüp rozetleri, derin zevk profillemesi ve reklamsız bağımsız sinema deneyimi.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/premium',
      languages: {
        en: 'https://www.izledin.com/premium',
        tr: 'https://www.izledin.com/tr/premium',
        'x-default': 'https://www.izledin.com/premium',
      },
    },
    openGraph: {
      title: 'izledin+ Kulüp Üyeliği & Sinefil Ayrıcalıkları — izledin.com',
      description:
        'Sınırsız İzdaş eşleşmesi, özel 35mm kulüp rozetleri ve derin zevk profillemesi.',
      url: 'https://www.izledin.com/tr/premium',
      type: 'website',
    },
  };
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
