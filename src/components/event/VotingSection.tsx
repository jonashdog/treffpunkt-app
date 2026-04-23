'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/components/providers/I18nProvider';
import { type Vote, type VoteStatus, type DateOption } from '@/types';
import { submitVotes, getVotesForEvent, getSavedVoterName } from '@/lib/store';
import { formatDateTime, cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

interface VotingSectionProps {
  eventId: string;
  dates: DateOption[];
  fixedDateId?: string;
  onVotesChanged: () => void;
}

export default function VotingSection({
  eventId,
  dates,
  fixedDateId,
  onVotesChanged,
}: VotingSectionProps) {
  const { t, locale } = useTranslation();

  const savedName = typeof window !== 'undefined' ? getSavedVoterName(eventId) : null;
  const [voterName, setVoterName] = useState(savedName || '');
  const [votes, setVotes] = useState<Record<string, VoteStatus>>(() => {
    if (!savedName) return {};
    const existing = getVotesForEvent(eventId).filter(
      (v) => v.voter_name === savedName
    );
    const map: Record<string, VoteStatus> = {};
    existing.forEach((v) => {
      map[v.date_id] = v.status;
    });
    return map;
  });
  const [comments, setComments] = useState<Record<string, string>>(() => {
    if (!savedName) return {};
    const existing = getVotesForEvent(eventId).filter(
      (v) => v.voter_name === savedName
    );
    const map: Record<string, string> = {};
    existing.forEach((v) => {
      if (v.comment) map[v.date_id] = v.comment;
    });
    return map;
  });
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(!!savedName);

  const isEditing = savedName === voterName && submitted;

  function toggleVote(dateId: string, status: VoteStatus) {
    setVotes((prev) => {
      if (prev[dateId] === status) {
        const next = { ...prev };
        delete next[dateId];
        return next;
      }
      return { ...prev, [dateId]: status };
    });
  }

  function handleSubmit() {
    if (!voterName.trim()) return;

    const voteData = dates.map((d) => ({
      dateId: d.id,
      status: (votes[d.id] || 'no') as VoteStatus,
      comment: comments[d.id],
    }));

    submitVotes(eventId, voterName.trim(), voteData);
    setSubmitted(true);
    onVotesChanged();
  }

  const hasVotes = Object.keys(votes).length > 0;

  return (
    <div className="space-y-4">
      {/* Name input */}
      <div>
        <label
          htmlFor="voter-name"
          className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          {t('yourName')}
        </label>
        <input
          id="voter-name"
          type="text"
          value={voterName}
          onChange={(e) => {
            setVoterName(e.target.value);
            if (submitted && e.target.value !== savedName) {
              setSubmitted(false);
              setVotes({});
              setComments({});
            }
          }}
          placeholder={t('yourNamePlaceholder')}
          className="w-full bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-3
                     text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                     focus:border-[var(--color-border-focus)] focus:outline-none transition-colors"
        />
      </div>

      {/* Date cards with vote buttons */}
      {voterName.trim() && (
        <div className="space-y-3 stagger-children">
          {dates.map((dateOption) => {
            const currentVote = votes[dateOption.id];
            const isFixed = dateOption.id === fixedDateId;

            return (
              <div
                key={dateOption.id}
                className={cn(
                  'glass-card-static p-4 space-y-3 transition-all',
                  isFixed && 'ring-2 ring-[var(--color-success)] bg-[var(--color-success-bg)]'
                )}
              >
                {/* Date display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isFixed && <span className="text-lg">🎯</span>}
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {formatDateTime(dateOption.datetime, locale as Locale)}
                    </span>
                  </div>
                  {isFixed && (
                    <span className="text-xs font-medium text-[var(--color-success)] bg-[var(--color-success-bg)] px-2 py-1 rounded-md">
                      ✓ Fixiert
                    </span>
                  )}
                </div>

                {/* Vote buttons */}
                <div className="flex gap-2">
                  {(['yes', 'no', 'maybe'] as VoteStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleVote(dateOption.id, status)}
                      className={cn(
                        `flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]`,
                        `vote-${status}`,
                        currentVote === status && 'active'
                      )}
                    >
                      {status === 'yes' && `✓ ${t('yes')}`}
                      {status === 'no' && `✕ ${t('no')}`}
                      {status === 'maybe' && `? ${t('maybe')}`}
                    </button>
                  ))}
                </div>

                {/* Comment toggle & field */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedComment(
                        expandedComment === dateOption.id ? null : dateOption.id
                      )
                    }
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    💬 {t('comment')}
                    {comments[dateOption.id] && ' ✓'}
                  </button>

                  {expandedComment === dateOption.id && (
                    <input
                      type="text"
                      value={comments[dateOption.id] || ''}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [dateOption.id]: e.target.value,
                        }))
                      }
                      placeholder={t('commentPlaceholder')}
                      className="mt-2 w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-2
                                 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                                 focus:border-[var(--color-border-focus)] focus:outline-none transition-colors
                                 animate-slide-down"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {voterName.trim() && (
        <button
          onClick={handleSubmit}
          disabled={!hasVotes}
          className={cn(
            'w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200',
            hasVotes
              ? 'gradient-accent text-white hover:opacity-90 glow active:scale-[0.98]'
              : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
          )}
        >
          {isEditing ? t('updateVote') : t('submitVote')}
        </button>
      )}
    </div>
  );
}
