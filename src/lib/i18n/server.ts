import { headers, cookies } from 'next/headers';
import { Locale, TranslationDictionary } from './types';
import { defaultLocale, getDictionary, LOCALE_COOKIE_NAME } from './config';

export async function getServerLocale(): Promise<Locale> {
  try {
    const reqHeaders = await headers();
    const localeHeader = reqHeaders.get('x-locale') as Locale | null;
    if (localeHeader && (localeHeader === 'en' || localeHeader === 'tr')) {
      return localeHeader;
    }

    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined;
    if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'tr')) {
      return cookieLocale;
    }
  } catch {
    // In contexts where headers/cookies are not accessible
  }

  return defaultLocale;
}

export function getLocalizedHref(path: string, locale: Locale): string {
  if (!path || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('#') || path.startsWith('mailto:')) {
    return path;
  }
  const stripped = path.replace(/^\/tr(\/|$)/, '/');
  const normalized = stripped.startsWith('/') ? stripped : `/${stripped}`;
  if (locale === 'tr') {
    return normalized === '/' ? '/tr' : `/tr${normalized}`;
  }
  return normalized;
}

export async function getServerTranslation(): Promise<{
  locale: Locale;
  t: TranslationDictionary;
  href: (path: string) => string;
}> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const href = (path: string) => getLocalizedHref(path, locale);
  return { locale, t, href };
}
