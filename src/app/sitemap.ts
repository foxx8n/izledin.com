import type { MetadataRoute } from 'next';
import rawCatalog from '@/data/catalog.json';
import rawUpcoming from '@/data/upcoming-master.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.izledin.com';
  const currentDate = new Date();

  const paths: Array<{
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'hourly';
  }> = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/upcoming', priority: 0.9, changeFrequency: 'daily' },
    { path: '/topluluk', priority: 0.9, changeFrequency: 'hourly' },
    { path: '/matches', priority: 0.85, changeFrequency: 'daily' },
    { path: '/kesif', priority: 0.9, changeFrequency: 'daily' },
    { path: '/diary', priority: 0.85, changeFrequency: 'daily' },
    { path: '/premium', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/iletisim', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/gizlilik', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/kullanim', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/acik-riza', priority: 0.4, changeFrequency: 'monthly' },
  ];

  const staticRoutes: MetadataRoute.Sitemap = [];

  for (const item of paths) {
    const enUrl = item.path ? `${baseUrl}${item.path}` : baseUrl;
    const trUrl = item.path ? `${baseUrl}/tr${item.path}` : `${baseUrl}/tr`;

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
        },
      },
    });
  }

  // Dynamic Movie Catalog Pages
  const catalogRoutes: MetadataRoute.Sitemap = [];
  for (const movie of rawCatalog) {
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
        },
      },
    });
  }

  // Upcoming Movies
  const upcomingRoutes: MetadataRoute.Sitemap = [];
  for (const movie of rawUpcoming) {
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
        },
      },
    });
  }

  return [...staticRoutes, ...catalogRoutes, ...upcomingRoutes];
}
