/**
 * SMRITI+ — Internationalization (i18n) Setup
 *
 * Implements Phase 10 & Advanced Multilingual Intelligence:
 * - English (en)
 * - Assamese (as)
 * - Bodo (bodo)
 * - Telugu (te)
 * - Hindi (hi)
 * - Tamil (ta)
 * - Bengali (bn)
 * - Reliable fallback to English for other regional languages
 */

import en from './en.json';
import as from './as.json';
import bodo from './bodo.json';
import te from './te.json';
import hi from './hi.json';
import ta from './ta.json';
import bn from './bn.json';

export type SupportedLanguage =
  | 'en'
  | 'te'
  | 'as'
  | 'bodo'
  | 'mni'
  | 'kha'
  | 'grt'
  | 'lus'
  | 'hi'
  | 'ta'
  | 'bn';

export const translations: Record<SupportedLanguage, typeof en> = {
  en,
  te: te as unknown as typeof en,
  as: as as unknown as typeof en,
  bodo: bodo as unknown as typeof en,
  mni: as as unknown as typeof en,
  kha: en as unknown as typeof en,
  grt: en as unknown as typeof en,
  lus: en as unknown as typeof en,
  hi: hi as unknown as typeof en,
  ta: ta as unknown as typeof en,
  bn: bn as unknown as typeof en,
};

let currentLang: SupportedLanguage = 'en';
const listeners: Array<(lang: SupportedLanguage) => void> = [];

export function setLanguage(lang: SupportedLanguage) {
  currentLang = lang;
  listeners.forEach((fn) => fn(lang));
}

export function getLanguage(): SupportedLanguage {
  return currentLang;
}

export function useTranslation() {
  const t = (keyPath: string, params?: Record<string, any>): string => {
    const keys = keyPath.split('.');
    let value: any = (translations as any)[currentLang] || translations.en;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English
        let fallbackValue: any = translations.en;
        for (const fbKey of keys) {
          if (fallbackValue && typeof fbKey === 'object' && fbKey in fallbackValue) {
            fallbackValue = fallbackValue[fbKey];
          } else {
            fallbackValue = keyPath;
            break;
          }
        }
        value = fallbackValue;
        break;
      }
    }

    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v)),
        value
      );
    }

    return typeof value === 'string' ? value : keyPath;
  };

  return { t, currentLanguage: currentLang, setLanguage };
}
