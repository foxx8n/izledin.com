import type { Metadata } from 'next';

import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Typewriter Movie Diary & Watch Logs — izledin.com',
      description:
        'Rate movies, series, and anime with 35mm typewriter aesthetics. Keep your personal cinephile journal and archive watch history.',
      alternates: {
        canonical: 'https://www.izledin.com/diary',
        languages: {
          en: 'https://www.izledin.com/diary',
          tr: 'https://www.izledin.com/tr/diary',
          'x-default': 'https://www.izledin.com/diary',
        },
      },
      openGraph: {
        title: 'Typewriter Movie Diary & Watch Logs — izledin.com',
        description:
          'Rate movies and series with 35mm typewriter aesthetics. Build your personal cinema diary.',
        url: 'https://www.izledin.com/diary',
        type: 'website',
      },
    };
  }

  return {
    title: 'Daktilo Film Günlüğüm & İzleme Kayıtları — izledin.com',
    description:
      'İzlediğin filmleri, dizileri ve animeleri 35mm daktilo estetiğiyle puanla, kişisel sinema günlüğünü oluştur ve arşivini tut.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/diary',
      languages: {
        en: 'https://www.izledin.com/diary',
        tr: 'https://www.izledin.com/tr/diary',
        'x-default': 'https://www.izledin.com/diary',
      },
    },
    openGraph: {
      title: 'Daktilo Film Günlüğüm & İzleme Kayıtları — izledin.com',
      description:
        'İzlediğin filmleri ve dizileri daktilo estetiğiyle puanla, kişisel sinema günlüğünü oluştur.',
      url: 'https://www.izledin.com/tr/diary',
      type: 'website',
    },
  };
}

export default function DiaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
