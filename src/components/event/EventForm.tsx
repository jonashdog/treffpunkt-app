'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/I18nProvider';
import { saveAdminToken } from '@/lib/store';
import { createEventAction } from '@/lib/actions';
import DatePicker from '@/components/event/DatePicker';
import { cn } from '@/lib/utils';

interface SelectedDate {
  date: Date;
  time: string;
}

export default function EventForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);

  const totalSteps = 3;
  const canAdvance1 = title.trim().length > 0;
  const canAdvance2 = selectedDates.length > 0;

  async function handleCreate() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dateTimes = selectedDates
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((sd) => {
          const d = new Date(sd.date);
          if (sd.time) {
            const [h, m] = sd.time.split(':').map(Number);
            d.setHours(h, m, 0, 0);
          } else {
            d.setHours(0, 0, 0, 0);
          }
          return d.toISOString();
        });

      const { event, adminToken } = await createEventAction(title.trim(), description.trim(), location.trim(), dateTimes);
      saveAdminToken(event.id, adminToken);
      router.push(`/event/${event.id}?created=true`);
    } catch (err) {
      console.error('Failed to create event:', err);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                i + 1 <= step
                  ? 'gradient-accent glow'
                  : 'bg-white/10'
              )}
            />
          </div>
        ))}
        <span className="text-xs text-[var(--color-text-muted)] ml-1 whitespace-nowrap">
          {t('step')} {step} {t('of')} {totalSteps}
        </span>
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in-up">
          <div>
            <label
              htmlFor="event-title"
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              {t('eventTitle')} *
            </label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('eventTitlePlaceholder')}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-3
                         text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                         focus:border-[var(--color-border-focus)] focus:outline-none
                         transition-colors text-base"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="event-description"
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              {t('eventDescription')}
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('eventDescriptionPlaceholder')}
              rows={3}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-3
                         text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                         focus:border-[var(--color-border-focus)] focus:outline-none
                         transition-colors text-base resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="event-location"
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              {t('eventLocation')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                📍
              </span>
              <input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('eventLocationPlaceholder')}
                className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3
                           text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                           focus:border-[var(--color-border-focus)] focus:outline-none
                           transition-colors text-base"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canAdvance1}
            className={cn(
              'w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200',
              canAdvance1
                ? 'gradient-accent text-white hover:opacity-90 glow active:scale-[0.98]'
                : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
            )}
          >
            {t('next')} →
          </button>
        </div>
      )}

      {/* Step 2: Date Selection */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in-up">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
              {t('selectDates')}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('selectDatesHint')}
            </p>
          </div>

          <DatePicker
            selectedDates={selectedDates}
            onDatesChange={setSelectedDates}
            addTimeLabel={t('addTime')}
            removeDateLabel={t('removeDate')}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl font-medium text-[var(--color-text-secondary)]
                         border border-[var(--color-border)] hover:bg-white/5 transition-colors"
            >
              ← {t('back')}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canAdvance2}
              className={cn(
                'flex-1 py-3 rounded-xl font-semibold transition-all duration-200',
                canAdvance2
                  ? 'gradient-accent text-white hover:opacity-90 glow active:scale-[0.98]'
                  : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
              )}
            >
              {t('next')} →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t('reviewAndCreate')}
          </h2>

          <div className="glass-card-static p-4 space-y-3">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('eventTitle')}
              </span>
              <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
            </div>

            {description && (
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                  {t('eventDescription').replace(' (optional)', '')}
                </span>
                <p className="text-[var(--color-text-secondary)] text-sm">{description}</p>
              </div>
            )}

            {location && (
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                  📍 {t('eventLocation').replace(' (optional)', '')}
                </span>
                <p className="text-[var(--color-text-secondary)] text-sm">{location}</p>
              </div>
            )}

            <div>
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                {t('selectDates')} ({selectedDates.length})
              </span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {[...selectedDates]
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((sd) => {
                    const label = sd.date.toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    });
                    return (
                      <span
                        key={sd.date.toISOString()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                   bg-[var(--color-accent)]/10 text-[var(--color-accent)]
                                   text-sm font-medium border border-[var(--color-accent)]/20"
                      >
                        {label}
                        {sd.time && (
                          <span className="text-[var(--color-accent)]/70">{sd.time}</span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl font-medium text-[var(--color-text-secondary)]
                         border border-[var(--color-border)] hover:bg-white/5 transition-colors"
            >
              ← {t('back')}
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className={cn(
                'flex-1 py-3.5 rounded-xl font-semibold text-base transition-all duration-200',
                isSubmitting
                  ? 'bg-white/10 text-[var(--color-text-muted)] cursor-wait'
                  : 'gradient-accent text-white hover:opacity-90 glow active:scale-[0.98]'
              )}
            >
              {isSubmitting ? '⏳ ...' : t('createEventButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
