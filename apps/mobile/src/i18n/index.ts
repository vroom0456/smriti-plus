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

import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';

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

// Try to hydrate language from localStorage on web startup
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem('smriti_language');
    if (saved && (translations as any)[saved]) {
      currentLang = saved as SupportedLanguage;
    }
  } catch {}
}

const listeners = new Set<(lang: SupportedLanguage) => void>();

export function subscribeToLanguage(fn: (lang: SupportedLanguage) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setLanguage(lang: SupportedLanguage) {
  currentLang = lang;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('smriti_language', lang);
    } catch {}
  }
  listeners.forEach((fn) => {
    try {
      fn(lang);
    } catch (err) {
      console.warn('[i18n] Listener callback error:', err);
    }
  });
}

export function getLanguage(): SupportedLanguage {
  return currentLang;
}

export function useTranslation() {
  const [lang, setLang] = useState<SupportedLanguage>(currentLang);

  useEffect(() => {
    // Sync immediate if changed before mount
    if (lang !== currentLang) {
      setLang(currentLang);
    }
    const unsubscribe = subscribeToLanguage((newLang) => {
      setLang(newLang);
    });
    return unsubscribe;
  }, []);

  const t = (keyPath: string, params?: Record<string, any>): string => {
    const keys = keyPath.split('.');
    let value: any = (translations as any)[lang] || translations.en;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English
        let fallbackValue: any = translations.en;
        for (const fbKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fbKey in fallbackValue) {
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

  return { t, currentLanguage: lang, setLanguage };
}
