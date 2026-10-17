import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/tr/admin', '/api/'],
      },
      {
        userAgent: ['Googlebot', 'Bingbot'],
        allow: '/',
        disallow: ['/admin', '/tr/admin', '/api/'],
      },
    ],
    sitemap: 'https://www.izledin.com/sitemap.xml',
    host: 'https://www.izledin.com',
  };
}
