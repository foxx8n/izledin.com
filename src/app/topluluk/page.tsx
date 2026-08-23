import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CommunityView } from '@/components/community/CommunityView';

export const metadata: Metadata = {
  title: 'Topluluk Kuralları & Sinefil Adabı — izledin.com',
  description: 'izledin.com sinema kulübü etik ilkeleri, spoiler koruma kuralları, İzdaş adabı ve saygılı tartışma rehberi.',
  alternates: {
    canonical: 'https://www.izledin.com/topluluk',
  },
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <CommunityView />
      </main>

      <Footer />
    </div>
  );
}
