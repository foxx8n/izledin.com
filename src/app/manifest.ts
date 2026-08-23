import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'izledin.com — 35mm Sinefil Kulübü & İzdaş Radarı',
    short_name: 'izledin',
    description: '35mm daktilo günlüğü, kişisel sinema DNA pasaportu ve aynı film zevkine sahip İzdaş eşleşme platformu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#DC2626',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    categories: ['entertainment', 'social', 'movies', 'lifestyle'],
    lang: 'tr',
  };
}
