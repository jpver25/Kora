import { strings as es } from '@/constants/strings.es';
import { stringsEn } from '@/constants/strings.en';

export type AppLocale = 'es-CL' | 'en';

/** Spanish (Chile) is primary. English is a secondary structure for future toggle. */
export const defaultLocale: AppLocale = 'es-CL';

export function getStrings(locale: AppLocale = defaultLocale) {
  return locale === 'en' ? stringsEn : es;
}

export const t = getStrings(defaultLocale);
