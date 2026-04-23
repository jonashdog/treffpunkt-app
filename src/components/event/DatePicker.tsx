'use client';

import { useState } from 'react';
import { useCalendarLocale } from '@/components/providers/I18nProvider';
import { getDaysInMonth, getFirstDayOfMonth, isSameDay, cn } from '@/lib/utils';

interface SelectedDate {
  date: Date;
  time: string; // "HH:MM" or ""
}

interface DatePickerProps {
  selectedDates: SelectedDate[];
  onDatesChange: (dates: SelectedDate[]) => void;
  addTimeLabel: string;
  removeDateLabel: string;
}

export default function DatePicker({
  selectedDates,
  onDatesChange,
  addTimeLabel,
  removeDateLabel,
}: DatePickerProps) {
  const { months, weekdays } = useCalendarLocale();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function isSelected(day: number): boolean {
    const check = new Date(viewYear, viewMonth, day);
    return selectedDates.some((sd) => isSameDay(sd.date, check));
  }

  function isPast(day: number): boolean {
    const check = new Date(viewYear, viewMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return check < todayStart;
  }

  function isToday(day: number): boolean {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  }

  function toggleDay(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    const existing = selectedDates.findIndex((sd) => isSameDay(sd.date, date));

    if (existing !== -1) {
      onDatesChange(selectedDates.filter((_, i) => i !== existing));
    } else {
      onDatesChange([...selectedDates, { date, time: '' }]);
    }
  }

  function updateTime(index: number, time: string) {
    const updated = [...selectedDates];
    updated[index] = { ...updated[index], time };
    onDatesChange(updated);
  }

  function removeDate(index: number) {
    onDatesChange(selectedDates.filter((_, i) => i !== index));
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  // Sort selected dates chronologically for display
  const sortedDates = [...selectedDates].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="glass-card-static p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors focus-ring"
            aria-label="Previous month"
          >
            ‹
          </button>
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            {months[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors focus-ring"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[var(--color-text-muted)] py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const past = isPast(day);
            const todayCell = isToday(day);

            return (
              <button
                key={day}
                disabled={past}
                onClick={() => toggleDay(day)}
                className={cn(
                  'w-full aspect-square rounded-lg text-sm font-medium transition-all duration-200 focus-ring relative',
                  past && 'text-[var(--color-text-muted)]/40 cursor-not-allowed',
                  !past && !selected && 'hover:bg-white/10 text-[var(--color-text-secondary)]',
                  selected && 'gradient-accent text-white glow scale-105',
                  todayCell && !selected && 'ring-1 ring-[var(--color-accent)]/40'
                )}
              >
                {day}
                {todayCell && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected dates list with time pickers */}
      {sortedDates.length > 0 && (
        <div className="space-y-2 stagger-children">
          {sortedDates.map((sd, idx) => {
            const originalIdx = selectedDates.findIndex((d) =>
              isSameDay(d.date, sd.date)
            );
            const dayStr = sd.date.toLocaleDateString('de-DE', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={sd.date.toISOString()}
                className="glass-card-static p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {dayStr}
                  </span>
                </div>

                <input
                  type="time"
                  value={sd.time}
                  onChange={(e) => updateTime(originalIdx, e.target.value)}
                  placeholder={addTimeLabel}
                  className="bg-white/5 border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm
                             text-[var(--color-text-primary)] focus-ring w-28
                             [color-scheme:dark]"
                />

                <button
                  onClick={() => removeDate(originalIdx)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                             text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                             hover:bg-[var(--color-danger-bg)] transition-colors focus-ring"
                  aria-label={removeDateLabel}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
