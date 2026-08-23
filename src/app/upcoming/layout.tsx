import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2026 Vizyondaki & Gelecek Filmler Takvimi — izledin.com',
  description:
    '2026 yılında vizyona girecek en yeni filmler, diziler ve animeleri keşfet. Vizyon takvimini takip et, heyecanla beklenen yapımlara hatırlatıcı kur.',
  alternates: {
    canonical: 'https://www.izledin.com/upcoming',
  },
  openGraph: {
    title: '2026 Vizyondaki & Gelecek Filmler Takvimi — izledin.com',
    description:
      '2026 yılında vizyona girecek en yeni filmler, diziler ve animeleri keşfet. Vizyon takvimini takip et.',
    url: 'https://www.izledin.com/upcoming',
    type: 'website',
  },
};

export default function UpcomingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
