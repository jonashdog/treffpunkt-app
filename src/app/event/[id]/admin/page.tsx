'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/I18nProvider';
import { getEvent, isAdmin, fixDate, unfixDate, deleteEvent } from '@/lib/store';
import { type EventWithDates } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { t, locale } = useTranslation();

  const [event, setEvent] = useState<EventWithDates | null>(null);
  const [isEventAdmin, setIsEventAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const ev = await getEvent(eventId);
      setEvent(ev);
      if (ev) {
        const adminStatus = await isAdmin(eventId);
        setIsEventAdmin(adminStatus);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[var(--color-text-muted)] animate-pulse">{t('loading')}</div>
      </div>
    );
  }

  if (!event || !isEventAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-4xl">🔒</span>
        <p className="text-[var(--color-text-muted)]">{t('notAdmin')}</p>
        <a href={`/event/${eventId}`} className="text-[var(--color-accent)] hover:underline text-sm">
          ← {t('back')}
        </a>
      </div>
    );
  }

  async function handleFixDate(dateId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (event?.fixed_date_id === dateId) {
        await unfixDate(eventId);
      } else {
        await fixDate(eventId, dateId);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to fix/unfix date:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete() {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await deleteEvent(eventId);
      router.push('/');
    } catch (err) {
      console.error('Failed to delete event:', err);
      setIsProcessing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <a
            href={`/event/${eventId}`}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← {t('back')}
          </a>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
            ⚙ {t('adminTitle')}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">{event.title}</p>
        </div>
      </div>

      {/* Fix Date Section */}
      <div className="glass-card-static p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          🎯 {t('fixDate')}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {t('fixDateConfirm')}
        </p>

        <div className="space-y-2">
          {event.dates.map((dateOption) => {
            const isFixed = event.fixed_date_id === dateOption.id;

            return (
              <button
                key={dateOption.id}
                onClick={() => handleFixDate(dateOption.id)}
                disabled={isProcessing}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl transition-all disabled:opacity-50',
                  isFixed
                    ? 'bg-[var(--color-success-bg)] border-2 border-[var(--color-success)]'
                    : 'bg-white/[0.03] border border-[var(--color-border)] hover:bg-white/[0.06]'
                )}
              >
                <span
                  className={cn(
                    'font-medium text-sm',
                    isFixed ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)]'
                  )}
                >
                  {formatDateTime(dateOption.datetime, locale as Locale)}
                </span>
                {isFixed ? (
                  <span className="text-xs text-[var(--color-success)] font-medium">
                    ✓ Fixiert · {t('unfixDate')}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-text-muted)]">{t('fixDate')}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card-static p-4 space-y-3 border-[var(--color-danger)]/20">
        <h2 className="font-semibold text-[var(--color-danger)]">
          ⚠ {t('deleteEvent')}
        </h2>

        {confirmDelete ? (
          <div className="space-y-3 animate-scale-in">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('deleteEventConfirm')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                           text-[var(--color-text-secondary)] border border-[var(--color-border)]
                           hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                           bg-[var(--color-danger)] text-white hover:opacity-90
                           active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? '⏳...' : t('delete')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl text-sm font-medium
                       border border-[var(--color-danger)]/30 text-[var(--color-danger)]
                       hover:bg-[var(--color-danger-bg)] transition-colors"
          >
            {t('deleteEvent')}
          </button>
        )}
      </div>
    </div>
  );
}
