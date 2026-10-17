'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale, TranslationDictionary } from './types';
import { defaultLocale, getDictionary, LOCALE_COOKIE_NAME } from './config';

interface LanguageContextType {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (newLocale: Locale) => void;
  href: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Detect locale from URL path (/tr/...) first, then cookie or initialLocale, fallback to defaultLocale ('en')
  const detectedLocale: Locale = useMemo(() => {
    if (pathname?.startsWith('/tr/') || pathname === '/tr') {
      return 'tr';
    }
    if (initialLocale) {
      return initialLocale;
    }
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`));
      if (match && (match[1] === 'tr' || match[1] === 'en')) {
        return match[1] as Locale;
      }
    }
    return defaultLocale;
  }, [pathname, initialLocale]);

  const [locale, setLocaleState] = useState<Locale>(detectedLocale);

  useEffect(() => {
    setLocaleState(detectedLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = detectedLocale;
    }
  }, [detectedLocale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Set client cookie (1 year persistence)
    if (typeof document !== 'undefined') {
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }

    setLocaleState(newLocale);

    // Switch URL path to match locale without losing current route
    if (!pathname) return;

    if (newLocale === 'tr') {
      // Transition from /path to /tr/path
      if (!pathname.startsWith('/tr')) {
        const target = pathname === '/' ? '/tr' : `/tr${pathname}`;
        router.push(target);
      }
    } else {
      // Transition from /tr/path to /path
      if (pathname.startsWith('/tr')) {
        const cleanPath = pathname.replace(/^\/tr(\/|$)/, '/');
        router.push(cleanPath || '/');
      }
    }
  };

  /**
   * Generates a locale-aware link URL.
   * If in Turkish mode: href('/matches') => '/tr/matches'
   * If in English mode: href('/matches') => '/matches'
   */
  const href = (path: string): string => {
    if (!path || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('#') || path.startsWith('mailto:')) {
      return path;
    }

    // Clean any pre-existing /tr prefix
    const stripped = path.replace(/^\/tr(\/|$)/, '/');
    const normalized = stripped.startsWith('/') ? stripped : `/${stripped}`;

    if (locale === 'tr') {
      return normalized === '/' ? '/tr' : `/tr${normalized}`;
    }
    return normalized;
  };

  const t = useMemo(() => getDictionary(locale), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale, href }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for components outside LanguageProvider (e.g. tests or isolated renders)
    return {
      locale: defaultLocale,
      t: getDictionary(defaultLocale),
      setLocale: () => {},
      href: (p: string) => p,
    };
  }
  return context;
}
