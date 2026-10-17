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

export async function getServerTranslation(): Promise<{
  locale: Locale;
  t: TranslationDictionary;
}> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return { locale, t };
}
