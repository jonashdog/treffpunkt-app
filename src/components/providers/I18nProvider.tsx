'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Locale, type TranslationKey } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('de');

  useEffect(() => {
    const saved = localStorage.getItem('treffpunkt-locale') as Locale | null;
    if (saved && (saved === 'de' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('treffpunkt-locale', newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      const value = translations[locale][key];
      if (Array.isArray(value)) return value.join(', ');
      return value as string;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used within I18nProvider');
  return context;
}

// Helper to get month/weekday arrays
export function useCalendarLocale() {
  const { locale } = useTranslation();
  return {
    months: translations[locale].months as readonly string[],
    weekdays: translations[locale].weekdays as readonly string[],
  };
}
