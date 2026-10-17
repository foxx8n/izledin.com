import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Ticket } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthView } from '@/components/auth/AuthView';
import { MasterpieceLaurelIcon, CinemaLogoMark } from '@/components/icons/CinemaIcons';

import { getServerTranslation } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerTranslation();

  if (locale === 'en') {
    return {
      title: 'Sign In & Join the Cinephile Club — izledin.com',
      description: 'Join the independent cinema club. Rate movies in your 35mm typewriter diary, match with movie mates on your radar.',
      alternates: {
        canonical: 'https://www.izledin.com/auth',
        languages: {
          en: 'https://www.izledin.com/auth',
          tr: 'https://www.izledin.com/tr/auth',
          'x-default': 'https://www.izledin.com/auth',
        },
      },
    };
  }

  return {
    title: 'Giriş Yap & Sinefil Kulübüne Katıl — izledin.com',
    description: 'izledin.com bağımsız sinema kulübü üyeliği, 35mm daktilo günlüğü ve İzdaş eşleşme radarı girişi.',
    alternates: {
      canonical: 'https://www.izledin.com/tr/auth',
      languages: {
        en: 'https://www.izledin.com/auth',
        tr: 'https://www.izledin.com/tr/auth',
        'x-default': 'https://www.izledin.com/auth',
      },
    },
  };
}

export default async function AuthPage() {
  const { t, href } = await getServerTranslation();

  return (
    <div className="min-h-screen with-sidebar flex flex-col  bg-[#0A0A0A]  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white transition-colors duration-150 font-mono">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto px-4 py-12 w-full space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs  text-neutral-400">
          <Link 
            href={href("/")} 
            className="min-h-[44px] inline-flex items-center gap-1.5  hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{t.auth.breadcrumbHome}</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className=" text-[#FAFAFA] font-black" aria-current="page">
            {t.auth.breadcrumbAuth}
          </span>
        </nav>

        {/* Main Ticket Box */}
        <div className=" bg-[#0A0A0A] border-2 sm:border-4  border-[#404040] p-6 sm:p-8  shadow-[8px_8px_0px_#000000] space-y-6">
          
          {/* Header Strip */}
          <div className="border-b-2  border-[#404040] pb-4 space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
                <MasterpieceLaurelIcon size={14} className="text-white" />
                <span>{t.auth.pagePassportBadge}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase  text-[#FAFAFA] font-sans tracking-tight">
              {t.auth.pageTitle}
            </h1>

            <p className="text-xs  text-neutral-400 font-sans leading-relaxed">
              {t.auth.pageSubtitle}
            </p>
          </div>

          {/* Auth View */}
          <AuthView />
        </div>
      </main>

      <Footer />
    </div>
  );
}
