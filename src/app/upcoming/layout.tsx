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

import { serializeJsonLd } from '@/lib/jsonld';
import rawUpcoming from '@/data/upcoming-master.json';

export default async function UpcomingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getServerTranslation();
  const canonicalUrl = locale === 'tr' ? 'https://www.izledin.com/tr/upcoming' : 'https://www.izledin.com/upcoming';

  const upcomingListItems = (rawUpcoming as any[]).slice(0, 15).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Movie',
      name: item.title,
      image: item.posterPath,
      datePublished: item.releaseDate,
      url: locale === 'tr' ? `https://www.izledin.com/tr/film/${item.id}` : `https://www.izledin.com/film/${item.id}`,
      description: locale === 'en' && item.overviewEn ? item.overviewEn : item.overview,
      ...(item.director ? { director: { '@type': 'Person', name: item.director } } : {}),
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'tr' ? '2026 Vizyondaki & Gelecek Filmler Takvimi' : '2026 Upcoming Movies & In-Theaters Calendar',
    description: locale === 'tr'
      ? '2026 yılında vizyona girecek en yeni filmler ve vizyon takvimi.'
      : 'Newest movies releasing in 2026 with release dates and trailers.',
    url: canonicalUrl,
    numberOfItems: upcomingListItems.length,
    itemListElement: upcomingListItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
