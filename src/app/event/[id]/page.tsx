'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/I18nProvider';
import { getAdminTokens } from '@/lib/store';
import { getEventAction, getVotesAction, checkAdminAction } from '@/lib/actions';
import { type EventWithDates, type Vote } from '@/types';
import VotingSection from '@/components/event/VotingSection';
import VoteResultsGrid from '@/components/event/VoteResultsGrid';
import ShareButton from '@/components/event/ShareButton';
import CarpoolModule from '@/components/event/CarpoolModule';
import SuccessOverlay from '@/components/event/SuccessOverlay';
import { cn } from '@/lib/utils';

export default function EventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { t } = useTranslation();

  const [event, setEvent] = useState<EventWithDates | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isEventAdmin, setIsEventAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vote' | 'results'>('vote');
  const [showSuccess, setShowSuccess] = useState(searchParams.get('created') === 'true');

  const loadData = useCallback(async () => {
    try {
      const ev = await getEventAction(eventId);
      setEvent(ev);
      if (ev) {
        const tokens = getAdminTokens();
        const localToken = tokens[eventId];

        const [votesData, adminStatus] = await Promise.all([
          getVotesAction(eventId),
          localToken ? checkAdminAction(eventId, localToken) : Promise.resolve(false),
        ]);
        setVotes(votesData);
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

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-4xl">🔍</span>
        <p className="text-[var(--color-text-muted)]">{t('eventNotFound')}</p>
        <a
          href="/"
          className="text-[var(--color-accent)] hover:underline text-sm"
        >
          ← {t('createEvent')}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in-up">
      {/* Success overlay after event creation */}
      {showSuccess && event && (
        <SuccessOverlay
          eventTitle={event.title}
          eventUrl={typeof window !== 'undefined' ? `${window.location.origin}/event/${eventId}` : ''}
          onDismiss={() => {
            setShowSuccess(false);
            router.replace(`/event/${eventId}`, { scroll: false });
          }}
        />
      )}

      {/* Event header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {event.title}
          </h1>
          {isEventAdmin && (
            <a
              href={`/event/${eventId}/admin`}
              className="shrink-0 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/10
                         px-3 py-1.5 rounded-lg border border-[var(--color-accent)]/20
                         hover:bg-[var(--color-accent)]/20 transition-colors"
            >
              ⚙ {t('adminAccess')}
            </a>
          )}
        </div>

        {event.description && (
          <p className="text-[var(--color-text-secondary)] text-sm">{event.description}</p>
        )}

        {event.location && (
          <p className="text-[var(--color-text-muted)] text-sm flex items-center gap-1.5">
            📍 {event.location}
          </p>
        )}

        {/* Fixed date banner */}
        {event.fixed_date_id && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-success-bg)] border border-[var(--color-success)]/20 animate-scale-in">
            <span className="text-lg">🎯</span>
            <div>
              <span className="text-sm font-medium text-[var(--color-success)]">
                {t('dateFixed')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Share */}
      <ShareButton eventId={eventId} />

      {/* Tab navigation */}
      <div className="flex rounded-xl bg-white/[0.03] border border-[var(--color-border)] p-1">
        <button
          onClick={() => setActiveTab('vote')}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'vote'
              ? 'gradient-accent text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          )}
        >
          ✋ {t('votingTitle')}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
            activeTab === 'results'
              ? 'gradient-accent text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          )}
        >
          📊 {t('results')}
          {votes.length > 0 && activeTab !== 'results' && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-accent text-[10px] font-bold flex items-center justify-center text-white">
              {new Set(votes.map((v) => v.voter_name)).size}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'vote' ? (
        <VotingSection
          eventId={eventId}
          dates={event.dates}
          fixedDateId={event.fixed_date_id}
          onVotesChanged={loadData}
        />
      ) : (
        <VoteResultsGrid
          dates={event.dates}
          votes={votes}
          fixedDateId={event.fixed_date_id}
        />
      )}

      {/* Carpool Module */}
      <CarpoolModule eventId={eventId} />

      {/* Footer spacer for mobile */}
      <div className="h-4" />
    </div>
  );
}
