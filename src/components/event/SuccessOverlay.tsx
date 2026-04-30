'use client';

import { useState } from 'react';
import { useTranslation } from '@/components/providers/I18nProvider';

interface SuccessOverlayProps {
  eventTitle: string;
  eventUrl: string;
  onDismiss: () => void;
}

export default function SuccessOverlay({ eventTitle, eventUrl, onDismiss }: SuccessOverlayProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(eventUrl);
    } catch {
      const input = document.createElement('input');
      input.value = eventUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle, text: t('shareEvent'), url: eventUrl });
      } catch {
        // User cancelled
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="confetti-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              backgroundColor: ['#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'][i % 6],
            }}
          />
        ))}
      </div>

      {/* Content card */}
      <div className="relative p-8 max-w-sm w-full text-center space-y-6 animate-scale-in
                       bg-[#14142a] border border-white/10 rounded-2xl shadow-2xl">
        {/* Celebration emoji */}
        <div className="text-6xl animate-bounce-slow">🎉</div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            {t('eventCreatedTitle')}
          </h2>
          <p className="text-[var(--color-accent)] font-semibold text-lg">
            &ldquo;{eventTitle}&rdquo;
          </p>
        </div>

        {/* Share buttons */}
        <div className="space-y-3">
          {/* Copy link */}
          <button
            onClick={handleCopy}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300
                        border ${
                          copied
                            ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-success-bg)]'
                            : 'border-white/20 text-[var(--color-text-primary)] hover:bg-white/10 bg-white/5'
                        }`}
          >
            {copied ? t('linkCopied') : `📋 ${t('copyLink')}`}
          </button>

          {/* Native share (mobile only) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                         gradient-accent text-white hover:opacity-90 active:scale-[0.98]"
            >
              📤 {t('shareVia')}
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          {t('goToEvent')}
        </button>
      </div>
    </div>
  );
}
