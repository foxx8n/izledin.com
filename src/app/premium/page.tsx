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

export default function PremiumPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Yalnızca gerçekten kodda var olan ayrıcalıklar sıralanır:
  // - is_premium rozeti profilde/günlüklerde görünür
  // - calculate_cinephile_matches kulüp üyelerini radar sırasında öne alır
  // - calculateCommunityFeedScore akışta üyelere ölçülü görünürlük önceliği verir
  const perks = [
    {
      icon: Award,
      title: 'Altın Kulüp Mührü',
      desc: 'Profilinde ve günlük notlarında görünen İzledin+ VIP rozeti. Kulüp üyesi olduğunu herkes sayfanda görür.',
    },
    {
      icon: Users,
      title: 'Radarda Öncelikli Sıralama',
      desc: 'İzdaş keşif radarında kulüp üyeleri eşleşme sırasında öne alınır — senin profilin de başkalarına ilk sen görünsün.',
    },
    {
      icon: Zap,
      title: 'Akışta Görünürlük Önceliği',
      desc: 'Topluluk akışının algoritmik sıralamasında kulüp üyelerinin günlük notlarına ölçülü bir görünürlük önceliği tanınır.',
    },
    {
      icon: HeartHandshake,
      title: 'Bağımsız Sinemaya Destek',
      desc: 'Kulüp katkıları bağımsız kısa film fonunu ve yerel sinefil gösterimlerini desteklemeyi hedefler.',
    },
    {
      icon: Ticket,
      title: 'Yeni Modüllere Erken Erişim',
      desc: 'Platforma eklenecek yeni modüller kulüp üyelerine herkesten önce açılır.',
    },
    {
      icon: Check,
      title: 'Zaten Herkeste Olanlar',
      desc: 'Reklamsız arayüz, sınırsız günlük, puanlama, İzdaş radarı ve mesajlaşma izledin.com\'da herkese ücretsizdir — kulüplük değildir.',
    },
  ];

  const faqs = [
    {
      q: 'İzledin+ kulüp üyeliğine nasıl katılabilirim?',
      a: 'Üyelik şu anda satışa açık değil; davetiye ve platforma katkı usulüyle yönetim tarafından atanır. iletişim sayfasından bize yazarak kendini tanıtabilirsin.',
    },
    {
      q: 'Çekirdek platform ücretsiz mi kalıyor?',
      a: 'Evet. Daktilo günlüğün, puanlama sistemin, İzdaş keşif radarı ve mesajlaşma dahil çekirdek deneyim herkese ücretsiz ve reklamsızdır. Kulüp üyeliği bunun üstüne statü ve öncelik ekler.',
    },
    {
      q: 'Verilerim nasıl korunuyor?',
      a: 'Doğum tarihin asla diğer üyelere gösterilmez — yalnızca hesaplanan yaşın paylaşılır. Ban gerekçeleri gibi yönetimsel alanlara da normal üyeler erişemez. Mesajların yalnızca eşleştiğin kişilerle arasında kalır.',
    },
    {
      q: 'Kulüp kartı ne zaman geliyor?',
      a: 'Sayfadaki 35mm kimlik kartı konsepti, paylaşılabilir dijital karta dönüşmek üzere geliştirme listemizde. Kart üzerindeki bilgiler gerçek profil verinden üretilir — hiçbir alan uydurma göstermez.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const joinYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;

  return (
    <div className="min-h-screen with-sidebar flex flex-col fanzine-canvas  text-[#FAFAFA] selection:bg-[#DC2626] selection:text-white font-mono">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPremium={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">

        {/* VIP Pass Masthead Ticket */}
        <header className="relative overflow-hidden bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040]  shadow-[8px_8px_0px_#000000] p-8 sm:p-12 text-center space-y-6">

          <div className="relative z-10 flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider font-mono inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
              <MasterpieceLaurelIcon size={14} className="text-white" />
              <span>BAĞIMSIZ SİNEFİL KULÜBÜ</span>
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase font-sans tracking-tight leading-[0.95] text-[#FAFAFA]">
              izledin<span className=" text-[#EF4444]">+</span>
            </h1>
            <p className="text-xs sm:text-base text-[#D4D4D4] leading-relaxed max-w-xl mx-auto font-sans font-medium">
              Kulüp üyeliği: altın mühür, radarda ve akışta öncelik, bağımsız sinemaya destek.
              Çekirdek platform zaten herkese ücretsiz ve reklamsızdır.
            </p>
          </div>

          {/* Membership Status Stamp */}
          <div className="relative z-10 flex justify-center">
            {profile?.isPremium ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0A0A0A] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
                <CinemaVerifiedSeal size={14} />
                <span>Aktif kulüp üyesisin — mührün profilde görünüyor</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#404040] bg-[#171717] text-neutral-300 text-xs font-black uppercase tracking-wider">
                Üyelik davetiye &amp; katkı usulüyle atanır — satış yok
              </span>
            )}
          </div>

          {/* CTA Action */}
          <div className="relative z-10 pt-2">
            <Link
              href="/iletisim"
              className="px-8 py-4 min-h-[52px] inline-flex bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs sm:text-sm uppercase tracking-wider font-mono border-2 border-white shadow-[4px_4px_0px_#ffffff] cursor-pointer items-center gap-2.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <CinemaTicketIcon size={18} className="text-white" />
              <span>KULÜP HAKKINDA BİLGİ AL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-neutral-400 font-mono mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              <CinemaCheckIcon size={14} className=" text-[#EF4444]" />
              <span>Günlük • Puanlama • Radar • Mesajlaşma — herkese ücretsiz</span>
            </p>
          </div>
        </header>

        {/* 35mm Physical Fanzine Member Card Preview */}
        <section aria-labelledby="card-preview-heading" className="bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4  border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#DC2626] space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <CinemaVerifiedSeal size={20} className="text-[#F59E0B]" />
              <h2 id="card-preview-heading" className="text-base sm:text-lg font-black uppercase text-white font-sans">
                35MM SİNEFİL KULÜP KARTIN
                {!profile && (
                  <span className="ml-2 text-[11px] text-neutral-500 font-mono normal-case">
                    (giriş yapınca senin verinle dolar)
                  </span>
                )}
              </h2>
            </div>
            <span className="text-xs text-[#F59E0B] font-black uppercase tracking-wider font-mono">
              EST. &apos;26 • RESMİ KANON
            </span>
          </div>

          {/* Celluloid Physical Member Card Component */}
          <div className="max-w-md mx-auto bg-[#171717] border-2 border-neutral-700 p-5 space-y-4 shadow-[6px_6px_0px_#000000] relative overflow-hidden">
            {/* Film Sprocket Perforations */}
            <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-1 bg-[#DC2626] inline-block" />
                <span className="w-2 h-1 bg-[#DC2626] inline-block" />
                <span>35MM CELLULOID PASSPORT</span>
              </div>
              <span>{joinYear ? `ÜYE ${joinYear}` : 'ÜYE KAYDI BEKLİYOR'}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black border-2 border-[#DC2626] overflow-hidden shrink-0 shadow-[2px_2px_0px_#000000]">
                <img
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.fullName || user?.email || 'Sinefil')}&backgroundColor=0a0a0a&textColor=ef4444&fontWeight=900`}
                  alt="Üye Kartı"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black uppercase text-white font-sans truncate">
                    {profile?.fullName || user?.email?.split('@')[0] || 'SİNEFİL'}
                  </span>
                  {profile?.isPremium && (
                    <CinemaVerifiedSeal size={14} className="text-[#F59E0B] shrink-0" />
                  )}
                </div>
                <p className={`text-xs font-black uppercase font-mono ${profile?.isPremium ? 'text-[#F59E0B]' : 'text-neutral-400'}`}>
                  {profile?.isPremium ? '★ KULÜP (İZLEDİN+) ÜYESİ' : 'STANDART ÜYE'}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono truncate">
                  @{profile?.username || user?.email?.split('@')[0] || 'sinefil'}{profile?.location ? ` • ${profile.location}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 font-mono">
              <span>Ücretsiz Günlük &amp; Radar</span>
              <span className={profile?.isPremium ? 'text-[#F59E0B] font-bold' : 'font-bold'}>
                {profile?.isPremium ? 'Mühür Aktif' : 'Kulüp: Davetiyle Yükselir'}
              </span>
            </div>
          </div>
        </section>

        {/* Perks Grid */}
        <section aria-labelledby="perks-heading" className="space-y-6">
          <div className="flex items-center justify-between border-b-2  border-[#404040] pb-3">
            <h2 id="perks-heading" className="text-xl sm:text-2xl font-black uppercase  text-[#FAFAFA] font-sans">
              KULÜP AYRICALIKLARI
            </h2>
            <span className="text-xs font-mono font-bold  text-[#EF4444] uppercase flex items-center gap-1">
              <MasterpieceLaurelIcon size={14} className=" text-[#EF4444]" />
              <span>SADECE GERÇEK OLANLAR</span>
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
              SIKÇA SORULAN SORULAR & ŞEFFAFLIK
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
