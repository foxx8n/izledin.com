'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Users,
  Zap,
  Award,
  HeartHandshake,
  Ticket
} from 'lucide-react';
import {
  CinemaTicketIcon,
  MasterpieceLaurelIcon,
  CinemaVerifiedSeal,
  CinemaCheckIcon
} from '@/components/icons/CinemaIcons';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SearchModal } from '@/components/media/SearchModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';

export default function PremiumPage() {
  const { user, profile } = useAuth();
  const { t, locale, href } = useTranslation();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const perkIcons = [Award, Users, Zap, HeartHandshake, Ticket, Check];
  const perks = t.premiumPage.perks.map((perk, idx) => ({
    ...perk,
    icon: perkIcons[idx] || Award,
  }));

  const faqs = t.premiumPage.faqs;

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const joinYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;

  return (
    <div className="min-h-screen with-sidebar flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white font-mono">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPremium={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">

        {/* VIP Pass Masthead Ticket */}
        <header className="relative overflow-hidden bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-6 sm:p-12 text-center space-y-6">

          <div className="relative z-10 flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider font-mono inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <MasterpieceLaurelIcon size={14} className="text-white" />
              <span>{t.premiumPage.heroBadge}</span>
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase font-sans tracking-tight leading-[0.95] text-[#FAFAFA]">
              izledin<span className=" text-[#EF4444]">+</span>
            </h1>
            <p className="text-xs sm:text-base text-[#D4D4D4] leading-relaxed max-w-xl mx-auto font-sans font-medium">
              {t.premiumPage.subtitle}
            </p>
          </div>

          {/* Membership Status Stamp */}
          <div className="relative z-10 flex justify-center">
            {profile?.isPremium ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0A0A0A] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
                <CinemaVerifiedSeal size={14} />
                <span>{t.premiumPage.activeMemberStamp}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#404040] bg-[#171717] text-neutral-300 text-xs font-black uppercase tracking-wider">
                {t.premiumPage.invitationOnlyStamp}
              </span>
            )}
          </div>

          {/* CTA Action */}
          <div className="relative z-10 pt-2">
            <Link
              href={href(locale === 'en' ? '/contact' : '/iletisim')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] sm:min-h-[52px] inline-flex bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs sm:text-sm uppercase tracking-wider font-mono border-2 border-white shadow-[4px_4px_0px_#ffffff] cursor-pointer items-center gap-2.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <CinemaTicketIcon size={18} className="text-white" />
              <span>{t.premiumPage.contactCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-neutral-400 font-mono mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              <CinemaCheckIcon size={14} className=" text-[#EF4444]" />
              <span>{t.premiumPage.freeFeaturesNotice}</span>
            </p>
          </div>
        </header>

        {/* 35mm Physical Fanzine Member Card Preview */}
        <section aria-labelledby="card-preview-heading" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-5 sm:p-8 shadow-[8px_8px_0px_#DC2626] space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CinemaVerifiedSeal size={20} className="text-[#F59E0B]" />
              <h2 id="card-preview-heading" className="text-base sm:text-lg font-black uppercase text-white font-sans">
                {t.premiumPage.cardHeading}
                {!profile && (
                  <span className="ml-2 text-[11px] text-neutral-500 font-mono normal-case">
                    {t.premiumPage.cardDynamicNotice}
                  </span>
                )}
              </h2>
            </div>
            <span className="text-xs text-[#F59E0B] font-black uppercase tracking-wider font-mono">
              {t.premiumPage.cardOfficialCanon}
            </span>
          </div>

          {/* Celluloid Physical Member Card Component */}
          <div className="max-w-md mx-auto bg-[#171717] border-2 border-neutral-700 p-5 space-y-4 shadow-[6px_6px_0px_#000000] relative overflow-hidden">
            {/* Film Sprocket Perforations */}
            <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-1 bg-[#DC2626] inline-block" />
                <span className="w-2 h-1 bg-[#DC2626] inline-block" />
                <span>{t.premiumPage.cardPassportTitle}</span>
              </div>
              <span>{joinYear ? `${t.premiumPage.cardMemberSince} ${joinYear}` : t.premiumPage.cardAwaitingRegistration}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black border-2 border-[#DC2626] overflow-hidden shrink-0 shadow-[2px_2px_0px_#000000]">
                <img
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.fullName || user?.email || 'Sinefil')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`}
                  alt="Member Passport"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black uppercase text-white font-sans truncate">
                    {profile?.fullName || user?.email?.split('@')[0] || (locale === 'en' ? 'CINEPHILE' : 'SİNEFİL')}
                  </span>
                  {profile?.isPremium && (
                    <CinemaVerifiedSeal size={14} className="text-[#F59E0B] shrink-0" />
                  )}
                </div>
                <p className={`text-xs font-black uppercase font-mono ${profile?.isPremium ? 'text-[#F59E0B]' : 'text-neutral-400'}`}>
                  {profile?.isPremium ? t.premiumPage.cardClubMember : t.premiumPage.cardStandardMember}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono truncate">
                  @{profile?.username || user?.email?.split('@')[0] || 'cinephile'}{profile?.location ? ` • ${profile.location}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 font-mono">
              <span>{t.premiumPage.cardFreeFeatures}</span>
              <span className={profile?.isPremium ? 'text-[#F59E0B] font-bold' : 'font-bold'}>
                {profile?.isPremium ? t.premiumPage.cardSealActive : t.premiumPage.cardUpgradeByInvite}
              </span>
            </div>
          </div>
        </section>

        {/* Perks Grid */}
        <section aria-labelledby="perks-heading" className="space-y-6">
          <div className="flex items-center justify-between border-b-2  border-[#404040] pb-3">
            <h2 id="perks-heading" className="text-xl sm:text-2xl font-black uppercase  text-[#FAFAFA] font-sans">
              {t.premiumPage.perksHeading}
            </h2>
            <span className="text-xs font-mono font-bold  text-[#EF4444] uppercase flex items-center gap-1">
              <MasterpieceLaurelIcon size={14} className=" text-[#EF4444]" />
              <span>{t.premiumPage.perksBadge}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <div
                  key={idx}
                  className=" bg-[#171717] border-2  border-[#404040] p-5 space-y-3  shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#DC2626] transition-all"
                >
                  <div className="w-10 h-10  bg-[#262626]  text-[#EF4444] border  border-[#404040] flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-black uppercase font-sans  text-[#FAFAFA]">
                    {perk.title}
                  </h3>
                  <p className="text-xs  text-neutral-300 leading-relaxed font-sans">
                    {perk.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interactive FAQ Accordion */}
        <section aria-labelledby="faq-heading" className=" bg-[#171717] border-2  border-[#404040]  shadow-[6px_6px_0px_#000000] p-6 sm:p-8 space-y-4 font-mono">
          <div className="flex items-center gap-2 border-b-2  border-[#404040] pb-3">
            <HelpCircle className="w-4 h-4  text-[#EF4444]" />
            <h2 id="faq-heading" className="text-base sm:text-lg font-black uppercase  text-[#FAFAFA] font-sans">
              {t.premiumPage.faqHeading}
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border-2  border-[#333333]  bg-neutral-900 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 min-h-[48px] text-left flex items-center justify-between gap-3 font-black text-xs sm:text-sm uppercase  text-[#FAFAFA] cursor-pointer font-sans"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#DC2626] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs  text-neutral-300 font-sans leading-relaxed border-t  border-neutral-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(item) => {
          setIsSearchOpen(false);
          router.push(`/film/${item.id}`);
        }}
      />
    </div>
  );
}
