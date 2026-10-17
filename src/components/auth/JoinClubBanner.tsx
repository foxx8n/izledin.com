"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { useTranslation } from "@/lib/i18n";

export function JoinClubBanner() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Don't show the banner if they are already logged in
  if (user) return null;

  return (
    <>
      <div className="mt-8 bg-[#0A0A0A] text-[#FAFAFA] p-5 border-2  border-[#404040] shadow-[6px_6px_0px_#DC2626]">
        <h4 className="font-black uppercase mb-1">
          {locale === 'en' ? 'Meet film mates who love this title!' : 'Bu filmi seven İzdaşlarla tanış!'}
        </h4>
        <p className="text-xs font-sans text-neutral-300 mb-4">
          {locale === 'en'
            ? 'Join izledin.com to find cinema friends matching your taste and join discussions around this movie.'
            : "izledin.com'a katılarak zevkine uygun sinema arkadaşları bulabilir, bu filme özel tartışmalara katılabilirsin."}
        </p>
        <button
          type="button"
          onClick={() => setIsAuthOpen(true)}
          className="inline-block px-4 py-2 bg-white text-black font-black uppercase text-xs border-2 border-transparent hover:border-white hover:bg-transparent hover:text-white transition-colors cursor-pointer"
        >
          {locale === 'en' ? 'JOIN THE CLUB' : 'KULÜBE KATIL'}
        </button>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode="register"
      />
    </>
  );
}
