import type { Metadata } from 'next';

import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: '2026 Upcoming Movies & In-Theaters Calendar — izledin.com',
      description:
        'Discover the newest movies, series, and anime releasing in 2026. Track the premiere calendar, set reminders, and anticipate upcoming releases.',
      alternates: {
        canonical: 'https://www.izledin.com/upcoming',
        languages: {
          en: 'https://www.izledin.com/upcoming',
          tr: 'https://www.izledin.com/tr/upcoming',
          'x-default': 'https://www.izledin.com/upcoming',
        },
      },
      openGraph: {
        title: '2026 Upcoming Movies & In-Theaters Calendar — izledin.com',
        description:
          'Discover the newest movies, series, and anime releasing in 2026. Track the premiere calendar.',
        url: 'https://www.izledin.com/upcoming',
        type: 'website',
      },
    };
  }

  return {
    title: '2026 Vizyondaki & Gelecek Filmler Takvimi — izledin.com',
    description:
      '2026 yılında vizyona girecek en yeni filmler, diziler ve animeleri keşfet. Vizyon takvimini takip et, heyecanla beklenen yapımlara hatırlatıcı kur.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/upcoming',
      languages: {
        en: 'https://www.izledin.com/upcoming',
        tr: 'https://www.izledin.com/tr/upcoming',
        'x-default': 'https://www.izledin.com/upcoming',
      },
    },
    openGraph: {
      title: '2026 Vizyondaki & Gelecek Filmler Takvimi — izledin.com',
      description:
        '2026 yılında vizyona girecek en yeni filmler, diziler ve animeleri keşfet. Vizyon takvimini takip et.',
      url: 'https://www.izledin.com/tr/upcoming',
      type: 'website',
    },
  };
}

export default function UpcomingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
