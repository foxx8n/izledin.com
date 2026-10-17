import { Locale, TranslationDictionary } from './types';
import { en } from './dictionaries/en';
import { tr } from './dictionaries/tr';

export const locales: Locale[] = ['en', 'tr'];
export const defaultLocale: Locale = 'en';
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  tr,
};

export function getDictionary(locale: Locale): TranslationDictionary {
  return dictionaries[locale] || dictionaries[defaultLocale];
}
