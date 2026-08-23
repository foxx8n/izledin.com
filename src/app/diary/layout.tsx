import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daktilo Film Günlüğüm & İzleme Kayıtları — izledin.com',
  description:
    'İzlediğin filmleri, dizileri ve animeleri 35mm daktilo estetiğiyle puanla, kişisel sinema günlüğünü oluştur ve arşivini tut.',
  alternates: {
    canonical: 'https://izledin.com/diary',
  },
  openGraph: {
    title: 'Daktilo Film Günlüğüm & İzleme Kayıtları — izledin.com',
    description:
      'İzlediğin filmleri ve dizileri daktilo estetiğiyle puanla, kişisel sinema günlüğünü oluştur.',
    url: 'https://izledin.com/diary',
    type: 'website',
  },
};

export default function DiaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
