import type { MetadataRoute } from 'next';
import rawCatalog from '@/data/catalog.json';
import rawUpcoming from '@/data/upcoming-master.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.izledin.com';
  const currentDate = new Date();

  const paths: Array<{
    enPath: string;
    trPath: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'hourly';
  }> = [
    { enPath: '', trPath: '', priority: 1.0, changeFrequency: 'daily' },
    { enPath: '/upcoming', trPath: '/upcoming', priority: 0.9, changeFrequency: 'daily' },
    { enPath: '/community', trPath: '/topluluk', priority: 0.9, changeFrequency: 'daily' },
    { enPath: '/matches', trPath: '/matches', priority: 0.85, changeFrequency: 'daily' },
    { enPath: '/kesif', trPath: '/kesif', priority: 0.9, changeFrequency: 'daily' },
    { enPath: '/diary', trPath: '/diary', priority: 0.85, changeFrequency: 'daily' },
    { enPath: '/premium', trPath: '/premium', priority: 0.8, changeFrequency: 'weekly' },
    { enPath: '/contact', trPath: '/iletisim', priority: 0.6, changeFrequency: 'monthly' },
    { enPath: '/privacy', trPath: '/gizlilik', priority: 0.5, changeFrequency: 'monthly' },
    { enPath: '/terms', trPath: '/kullanim', priority: 0.5, changeFrequency: 'monthly' },
    { enPath: '/acik-riza', trPath: '/acik-riza', priority: 0.4, changeFrequency: 'monthly' },
    { enPath: '/auth', trPath: '/auth', priority: 0.7, changeFrequency: 'monthly' },
  ];

  const staticRoutes: MetadataRoute.Sitemap = [];

  for (const item of paths) {
    const enUrl = item.enPath ? `${baseUrl}${item.enPath}` : baseUrl;
    const trUrl = item.trPath ? `${baseUrl}/tr${item.trPath}` : `${baseUrl}/tr`;

    // English primary entry
    staticRoutes.push({
      url: enUrl,
      lastModified: currentDate,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
      alternates: {
        languages: {
          en: enUrl,
          tr: trUrl,
          'x-default': enUrl,
        },
      },
    });

    // Turkish localized entry
    staticRoutes.push({
      url: trUrl,
      lastModified: currentDate,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
      alternates: {
        languages: {
          en: enUrl,
          tr: trUrl,
          'x-default': enUrl,
        },
      },
    });
  }

  // Dynamic Movie Catalog Pages
  const catalogRoutes: MetadataRoute.Sitemap = [];
  const seenCatalogIds = new Set<string>();

  for (const movie of rawCatalog) {
    if (seenCatalogIds.has(movie.id)) continue;
    seenCatalogIds.add(movie.id);

    const enUrl = `${baseUrl}/film/${movie.id}`;
    const trUrl = `${baseUrl}/tr/film/${movie.id}`;

    catalogRoutes.push({
      url: enUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          en: enUrl,
          tr: trUrl,
          'x-default': enUrl,
        },
      },
    });
    catalogRoutes.push({
      url: trUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          en: enUrl,
          tr: trUrl,
          'x-default': enUrl,
        },
      },
    });
  }

  // Upcoming Movies
  const upcomingRoutes: MetadataRoute.Sitemap = [];
  for (const movie of rawUpcoming) {
    if (seenCatalogIds.has(movie.id)) continue;
    seenCatalogIds.add(movie.id);

    const enUrl = `${baseUrl}/film/${movie.id}`;
    const trUrl = `${baseUrl}/tr/film/${movie.id}`;

    upcomingRoutes.push({
      url: enUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          en: enUrl,
          tr: trUrl,
          'x-default': enUrl,
        },
      },
    });
    upcomingRoutes.push({
      url: trUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          en: enUrl,
          tr: trUrl,
          'x-default': enUrl,
        },
      },
    });
  }

  return [...staticRoutes, ...catalogRoutes, ...upcomingRoutes];
}
