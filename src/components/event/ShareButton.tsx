'use client';

import { useState } from 'react';
import { useTranslation } from '@/components/providers/I18nProvider';

interface ShareButtonProps {
  eventId: string;
}

export default function ShareButton({ eventId }: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${eventId}`
    : '';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('appName'),
          text: t('shareEvent'),
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex gap-2">
      {/* Copy link button */}
      <button
        onClick={handleCopy}
        className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-300
                    border ${
                      copied
                        ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-success-bg)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-white/5'
                    }`}
      >
        {copied ? t('linkCopied') : `📋 ${t('copyLink')}`}
      </button>

      {/* Native share (mobile) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleShare}
          className="py-3 px-5 rounded-xl font-medium text-sm
                     gradient-accent text-white hover:opacity-90
                     active:scale-[0.97] transition-all"
        >
          📤 {t('shareVia')}
        </button>
      )}
    </div>
  );
}
