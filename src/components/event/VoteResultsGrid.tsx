'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/components/providers/I18nProvider';
import { type Vote, type DateOption } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

interface VoteResultsGridProps {
  dates: DateOption[];
  votes: Vote[];
  fixedDateId?: string;
}

export default function VoteResultsGrid({
  dates,
  votes,
  fixedDateId,
}: VoteResultsGridProps) {
  const { t, locale } = useTranslation();

  // Get unique voter names
  const voterNames = useMemo(() => {
    const names = new Set<string>();
    votes.forEach((v) => names.add(v.voter_name));
    return Array.from(names);
  }, [votes]);

  // Aggregate: count yes/maybe per date
  const dateSummary = useMemo(() => {
    const summary: Record<string, { yes: number; no: number; maybe: number }> = {};
    dates.forEach((d) => {
      summary[d.id] = { yes: 0, no: 0, maybe: 0 };
    });
    votes.forEach((v) => {
      if (summary[v.date_id]) {
        summary[v.date_id][v.status]++;
      }
    });
    return summary;
  }, [dates, votes]);

  // Find best date(s)
  const bestDateId = useMemo(() => {
    let maxYes = 0;
    let bestId = '';
    Object.entries(dateSummary).forEach(([id, s]) => {
      if (s.yes > maxYes) {
        maxYes = s.yes;
        bestId = id;
      }
    });
    return maxYes > 0 ? bestId : null;
  }, [dateSummary]);

  if (voterNames.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
        {t('noVotesYet')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">
          {voterNames.length} {t('participants')}
        </span>
        {bestDateId && !fixedDateId && (
          <span className="text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-lg">
            ⭐ {t('bestDate')}
          </span>
        )}
      </div>

      {/* Date result cards */}
      <div className="space-y-2 stagger-children">
        {dates.map((dateOption) => {
          const summary = dateSummary[dateOption.id];
          const isBest = dateOption.id === bestDateId && !fixedDateId;
          const isFixed = dateOption.id === fixedDateId;
          const total = voterNames.length;
          const yesPercent = total > 0 ? (summary.yes / total) * 100 : 0;

          // Get voters and their status for this date
          const dateVotes = votes.filter((v) => v.date_id === dateOption.id);

          return (
            <div
              key={dateOption.id}
              className={cn(
                'glass-card-static p-4 space-y-3',
                isFixed && 'ring-2 ring-[var(--color-success)]',
                isBest && !isFixed && 'ring-1 ring-[var(--color-accent)]/40'
              )}
            >
              {/* Date + badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isFixed && <span>🎯</span>}
                  {isBest && !isFixed && <span>⭐</span>}
                  <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                    {formatDateTime(dateOption.datetime, locale as Locale)}
                  </span>
                </div>

                {/* Count badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="vote-yes active px-2 py-0.5 rounded-md text-xs font-bold">
                    {summary.yes}
                  </span>
                  <span className="vote-maybe active px-2 py-0.5 rounded-md text-xs font-bold">
                    {summary.maybe}
                  </span>
                  <span className="vote-no active px-2 py-0.5 rounded-md text-xs font-bold">
                    {summary.no}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${yesPercent}%`,
                    background: isFixed
                      ? 'var(--color-success)'
                      : 'linear-gradient(90deg, var(--color-accent), #6366f1)',
                  }}
                />
              </div>

              {/* Voter list */}
              <div className="flex flex-wrap gap-1.5">
                {dateVotes.map((v) => (
                  <div
                    key={v.id}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                      `vote-${v.status}`
                    )}
                    title={v.comment || undefined}
                  >
                    <span>
                      {v.status === 'yes' ? '✓' : v.status === 'no' ? '✕' : '?'}
                    </span>
                    {v.voter_name}
                    {v.comment && <span className="opacity-60">💬</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
