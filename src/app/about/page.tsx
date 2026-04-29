'use client';

import { useTranslation } from '@/components/providers/I18nProvider';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="mb-8">
        <a href="/" className="text-sm text-[var(--color-accent)] hover:underline">
          ← {t('back')}
        </a>
      </div>

      <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            {t('aboutProject')}
          </h1>
          <p>{t('aboutP1')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {t('openSourceTitle')}
          </h2>
          <p>{t('openSourceP1')}</p>
          <div className="p-4 rounded-xl bg-white/5 border border-[var(--color-border)] mt-4">
            <h3 className="font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
              <span className="text-xl">💻</span> {t('githubRepo')}
            </h3>
            <p className="text-sm mb-3">
              {t('githubDesc')}
            </p>
            <a 
              href="https://github.com/jonashdog/treffpunkt-app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              {t('viewGithub')}
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {t('aboutDevTitle')}
          </h2>
          <p>{t('aboutDevP1')}</p>
          <div className="inline-flex items-start gap-3 p-4 rounded-xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 text-sm">
            <span className="text-xl shrink-0">✨</span>
            <p className="text-[var(--color-text-secondary)]">
              {t('aboutDevP2')}
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-8">
        {t('appName')} · {new Date().getFullYear()} JH
      </footer>
    </div>
  );
}
