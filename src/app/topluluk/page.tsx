import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CommunityView } from '@/components/community/CommunityView';
import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Community Guidelines & Cinephile Ethics — izledin.com',
      description: 'izledin.com cinema club ethical guidelines, spoiler protection laws, movie mate etiquette, and respectful cinephile discourse.',
      alternates: {
        canonical: 'https://www.izledin.com/community',
        languages: {
          en: 'https://www.izledin.com/community',
          tr: 'https://www.izledin.com/tr/topluluk',
          'x-default': 'https://www.izledin.com/community',
        },
      },
    };
  }

  return {
    title: 'Topluluk Kuralları & Sinefil Adabı — izledin.com',
    description: 'izledin.com sinema kulübü etik ilkeleri, spoiler koruma kuralları, İzdaş adabı ve saygılı tartışma rehberi.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/topluluk',
      languages: {
        en: 'https://www.izledin.com/community',
        tr: 'https://www.izledin.com/tr/topluluk',
        'x-default': 'https://www.izledin.com/community',
      },
    },
  };
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <CommunityView />
      </main>

      <Footer />
    </div>
  );
}
