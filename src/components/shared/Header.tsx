'use client';

import { useTranslation } from '@/components/providers/I18nProvider';
import type { Locale } from '@/lib/i18n';

export default function Header() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <header className="w-full border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <span className="text-xl">📅</span>
          <span className="font-bold text-lg bg-gradient-to-r from-[var(--color-accent)] to-indigo-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            {t('appName')}
          </span>
        </a>

        {/* Language Toggle */}
        <button
          onClick={() => setLocale(locale === 'de' ? 'en' : 'de' as Locale)}
          className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                     text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                     hover:bg-white/5 transition-all focus-ring border border-[var(--color-border)]"
          aria-label={t('language')}
        >
          <span className={locale === 'de' ? 'text-[var(--color-accent)]' : 'opacity-50'}>DE</span>
          <span className="text-[var(--color-text-muted)] mx-0.5">/</span>
          <span className={locale === 'en' ? 'text-[var(--color-accent)]' : 'opacity-50'}>EN</span>
        </button>
      </div>
    </header>
  );
}
