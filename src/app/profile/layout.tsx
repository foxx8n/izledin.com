import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profilim & Sinema DNA — izledin.com',
  description: 'Kişisel sinema profilin, favori türlerin, izleme istatistiklerin ve İzdaş rozetlerin.',
  alternates: {
    canonical: 'https://www.izledin.com/profile',
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
