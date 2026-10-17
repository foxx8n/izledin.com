import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ContactView } from '@/components/contact/ContactView';
import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Contact & Cinephile Desk — izledin.com',
      description: 'Get in touch with izledin.com independent cinema club. Support, suggestions, copyright inquiries and festival collaborations.',
      alternates: {
        canonical: 'https://www.izledin.com/contact',
        languages: {
          en: 'https://www.izledin.com/contact',
          tr: 'https://www.izledin.com/tr/iletisim',
          'x-default': 'https://www.izledin.com/contact',
        },
      },
    };
  }

  return {
    title: 'İletişim & Sinefil Masası — izledin.com',
    description: 'izledin.com bağımsız sinema kulübü ile iletişime geçin. Destek, öneri, telif ve festival iş birliği talepleri.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/iletisim',
      languages: {
        en: 'https://www.izledin.com/contact',
        tr: 'https://www.izledin.com/tr/iletisim',
        'x-default': 'https://www.izledin.com/contact',
      },
    },
  };
}

export default function ContactPage() {
  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />
      <ContactView />
      <Footer />
    </div>
  );
}
