'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/I18nProvider';
import { getAdminTokens, removeAdminToken } from '@/lib/store';
import {
  getEventAction,
  checkAdminAction,
  fixDateAction,
  unfixDateAction,
  deleteEventAction,
  updateEventAction,
  addDateOptionAction,
  removeDateOptionAction,
  getVotesAction,
} from '@/lib/actions';
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

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDirty, setEditDirty] = useState(false);
  const [editSaved, setEditSaved] = useState(false);

  // Date management state
  const [newDateTime, setNewDateTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [dateVoteCounts, setDateVoteCounts] = useState<Record<string, number>>({});
  const [confirmRemoveDate, setConfirmRemoveDate] = useState<string | null>(null);
  const [dateMessage, setDateMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const ev = await getEventAction(eventId);
      setEvent(ev);
      if (ev) {
        const tokens = getAdminTokens();
        const localToken = tokens[eventId];
        const adminStatus = localToken ? await checkAdminAction(eventId, localToken) : false;
        setIsEventAdmin(adminStatus);

        // Pre-fill edit form
        setEditTitle(ev.title);
        setEditDescription(ev.description || '');
        setEditLocation(ev.location || '');
        setEditDirty(false);

        // Load vote counts per date
        const votes = await getVotesAction(eventId);
        const counts: Record<string, number> = {};
        ev.dates.forEach((d) => {
          counts[d.id] = votes.filter((v) => v.date_id === d.id).length;
        });
        setDateVoteCounts(counts);
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

  function getAdminToken(): string | undefined {
    const tokens = getAdminTokens();
    return tokens[eventId];
  }

  async function handleSaveDetails() {
    if (isProcessing || !editTitle.trim()) return;
    setIsProcessing(true);
    try {
      const token = getAdminToken();
      if (!token) return;
      await updateEventAction(eventId, token, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
      });
      setEditDirty(false);
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 2500);
      await loadData();
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleAddDate() {
    if (isProcessing || !newDateTime) return;
    setIsProcessing(true);
    try {
      const token = getAdminToken();
      if (!token) return;

      const d = new Date(newDateTime);
      if (newTime) {
        const [h, m] = newTime.split(':').map(Number);
        d.setHours(h, m, 0, 0);
      } else {
        d.setHours(0, 0, 0, 0);
      }

      await addDateOptionAction(eventId, token, d.toISOString());
      setNewDateTime('');
      setNewTime('');
      setDateMessage(t('dateAdded'));
      setTimeout(() => setDateMessage(''), 2500);
      await loadData();
    } catch (err) {
      console.error('Failed to add date:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRemoveDate(dateId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const token = getAdminToken();
      if (!token) return;

      const success = await removeDateOptionAction(eventId, dateId, token);
      if (!success) {
        setDateMessage(t('minOneDateRequired'));
      } else {
        setDateMessage(t('dateRemoved'));
      }
      setConfirmRemoveDate(null);
      setTimeout(() => setDateMessage(''), 2500);
      await loadData();
    } catch (err) {
      console.error('Failed to remove date:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFixDate(dateId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const token = getAdminToken();
      if (!token) return;

      if (event?.fixed_date_id === dateId) {
        await unfixDateAction(eventId, token);
      } else {
        await fixDateAction(eventId, dateId, token);
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
      const token = getAdminToken();
      if (!token) return;

      await deleteEventAction(eventId, token);
      removeAdminToken(eventId);
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
          <p className="text-sm text-[var(--color-text-muted)}">{event.title}</p>
        </div>
      </div>

      {/* Edit Event Details */}
      <div className="glass-card-static p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          ✏️ {t('editEventDetails')}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              {t('eventTitle')} *
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => { setEditTitle(e.target.value); setEditDirty(true); }}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-2.5
                         text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                         focus:border-[var(--color-border-focus)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              {t('eventDescription')}
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => { setEditDescription(e.target.value); setEditDirty(true); }}
              rows={2}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-2.5
                         text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                         focus:border-[var(--color-border-focus)] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              {t('eventLocation')}
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => { setEditLocation(e.target.value); setEditDirty(true); }}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-2.5
                         text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                         focus:border-[var(--color-border-focus)] focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleSaveDetails}
            disabled={!editDirty || !editTitle.trim() || isProcessing}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
              editSaved
                ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30'
                : editDirty && editTitle.trim()
                  ? 'gradient-accent text-white hover:opacity-90 active:scale-[0.98]'
                  : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
            )}
          >
            {editSaved ? t('eventUpdated') : t('save')}
          </button>
        </div>
      </div>

      {/* Manage Dates */}
      <div className="glass-card-static p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          📅 {t('manageDates')}
        </h2>

        {/* Existing dates */}
        <div className="space-y-2">
          {event.dates.map((dateOption) => {
            const isFixed = event.fixed_date_id === dateOption.id;
            const voteCount = dateVoteCounts[dateOption.id] || 0;
            const isConfirming = confirmRemoveDate === dateOption.id;

            return (
              <div
                key={dateOption.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl transition-all',
                  isFixed
                    ? 'bg-[var(--color-success-bg)] border border-[var(--color-success)]/30'
                    : 'bg-white/[0.03] border border-[var(--color-border)]'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isFixed && <span>🎯</span>}
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {formatDateTime(dateOption.datetime, locale as Locale)}
                  </span>
                  {voteCount > 0 && (
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-white/5 px-1.5 py-0.5 rounded-md">
                      {voteCount} votes
                    </span>
                  )}
                </div>

                {isConfirming ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRemoveDate(dateOption.id)}
                      disabled={isProcessing}
                      className="text-xs px-2 py-1 rounded-lg bg-[var(--color-danger)] text-white
                                 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {t('delete')}
                    </button>
                    <button
                      onClick={() => setConfirmRemoveDate(null)}
                      className="text-xs px-2 py-1 rounded-lg text-[var(--color-text-muted)]
                                 border border-[var(--color-border)] hover:bg-white/5 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (voteCount > 0) {
                        setConfirmRemoveDate(dateOption.id);
                      } else {
                        handleRemoveDate(dateOption.id);
                      }
                    }}
                    disabled={isProcessing || event.dates.length <= 1}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                               transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={event.dates.length <= 1 ? t('minOneDateRequired') : t('removeDate')}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Status message */}
        {dateMessage && (
          <p className="text-xs text-[var(--color-success)] text-center animate-fade-in">
            {dateMessage}
          </p>
        )}

        {/* Add new date */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              {t('addDate')}
            </label>
            <input
              type="date"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-2
                         text-sm text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)]
                         focus:outline-none transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="w-24">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-2
                         text-sm text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)]
                         focus:outline-none transition-colors [color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleAddDate}
            disabled={!newDateTime || isProcessing}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
              newDateTime && !isProcessing
                ? 'gradient-accent text-white hover:opacity-90 active:scale-[0.97]'
                : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
            )}
          >
            +
          </button>
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
