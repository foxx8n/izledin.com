import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ContactView } from '@/components/contact/ContactView';

export const metadata: Metadata = {
  title: 'İletişim & Sinefil Masası — izledin.com',
  description: 'izledin.com bağımsız sinema kulübü ile iletişime geçin. Destek, öneri, telif ve festival iş birliği talepleri.',
  alternates: {
    canonical: 'https://izledin.com/iletisim',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />
      <ContactView />
      <Footer />
    </div>
  );
}
