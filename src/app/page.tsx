'use client';

import { useTranslation } from '@/components/providers/I18nProvider';
import EventForm from '@/components/event/EventForm';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full
                        bg-[var(--color-accent)]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center mb-10 animate-fade-in-up">
          <div className="text-5xl mb-4">📅</div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[var(--color-accent)] via-indigo-400 to-purple-300 bg-clip-text text-transparent mb-3">
            {t('appName')}
          </h1>
          <p className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
            {t('appTagline')}
          </p>
          <p className="text-[var(--color-text-muted)] max-w-sm mx-auto text-sm leading-relaxed">
            {t('appDescription')}
          </p>
        </div>

        {/* Event Form */}
        <div className="w-full max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="glass-card-static p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-sm">✨</span>
              {t('createEvent')}
            </h2>
            <EventForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[var(--color-text-muted)]">
        {t('appName')} · {new Date().getFullYear()} JH
      </footer>
    </div>
  );
}
