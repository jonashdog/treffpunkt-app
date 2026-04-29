'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/components/providers/I18nProvider';
import {
  createCarpoolAction,
  getCarpoolsAction,
  joinCarpoolAction,
  leaveCarpoolAction,
  deleteCarpoolAction,
} from '@/lib/actions';
import { type CarpoolWithPassengers } from '@/types';
import { cn } from '@/lib/utils';

interface CarpoolModuleProps {
  eventId: string;
}

export default function CarpoolModule({ eventId }: CarpoolModuleProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [carpools, setCarpools] = useState<CarpoolWithPassengers[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [driverName, setDriverName] = useState('');
  const [seats, setSeats] = useState(3);
  const [departure, setDeparture] = useState('');
  const [joinName, setJoinName] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await getCarpoolsAction(eventId);
      setCarpools(data);
    } catch (err) {
      console.error('Failed to refresh carpools:', err);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen && carpools.length === 0) {
      refresh();
    }
  }, [isOpen, refresh, carpools.length]);

  async function handleCreateRide() {
    if (!driverName.trim() || seats < 1 || isLoading) return;
    setIsLoading(true);
    try {
      await createCarpoolAction(eventId, driverName.trim(), seats, departure.trim());
      setDriverName('');
      setSeats(3);
      setDeparture('');
      setShowForm(false);
      await refresh();
    } catch (err) {
      console.error('Failed to create ride:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin(carpoolId: string) {
    if (!joinName.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await joinCarpoolAction(eventId, carpoolId, joinName.trim());
      setJoinName('');
      await refresh();
    } catch (err) {
      console.error('Failed to join ride:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLeave(carpoolId: string, name: string) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await leaveCarpoolAction(eventId, carpoolId, name);
      await refresh();
    } catch (err) {
      console.error('Failed to leave ride:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(carpoolId: string) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await deleteCarpoolAction(eventId, carpoolId);
      await refresh();
    } catch (err) {
      console.error('Failed to delete ride:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass-card-static overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-semibold text-[var(--color-text-primary)]">
          {t('carpoolTitle')}
        </span>
        <span
          className={cn(
            'text-[var(--color-text-muted)] transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 animate-slide-down">
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('carpoolDescription')}
          </p>

          {/* Existing rides */}
          {carpools.length === 0 && !showForm ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              {t('noRidesYet')}
            </p>
          ) : (
            <div className="space-y-3 stagger-children">
              {carpools.map((carpool) => {
                const available = carpool.total_seats - carpool.passengers.length;
                const isFull = available <= 0;

                return (
                  <div
                    key={carpool.id}
                    className="bg-white/[0.03] border border-[var(--color-border)] rounded-xl p-4 space-y-3"
                  >
                    {/* Driver info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          🚗 {carpool.driver_name}
                        </span>
                        {carpool.departure_location && (
                          <span className="text-sm text-[var(--color-text-muted)] ml-2">
                            📍 {carpool.departure_location}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(carpool.id)}
                        disabled={isLoading}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50"
                        title={t('deleteRide')}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Seats visualization */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({ length: carpool.total_seats }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all',
                              i < carpool.passengers.length
                                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                                : 'bg-white/5 text-[var(--color-text-muted)] border border-[var(--color-border)]'
                            )}
                          >
                            {i < carpool.passengers.length ? '●' : '○'}
                          </span>
                        ))}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isFull ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'
                        )}
                      >
                        {isFull
                          ? t('seatsFull')
                          : t('seatsAvailable')
                              .replace('{available}', String(available))
                              .replace('{total}', String(carpool.total_seats))}
                      </span>
                    </div>

                    {/* Passenger list */}
                    {carpool.passengers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {carpool.passengers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                                       bg-[var(--color-accent)]/10 text-[var(--color-accent)]
                                       text-xs font-medium border border-[var(--color-accent)]/20"
                          >
                            {p.passenger_name}
                            <button
                              onClick={() => handleLeave(carpool.id, p.passenger_name)}
                              disabled={isLoading}
                              className="hover:text-[var(--color-danger)] transition-colors ml-0.5 disabled:opacity-50"
                              title={t('leaveRide')}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Join ride */}
                    {!isFull && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                          placeholder={t('passengerName')}
                          className="flex-1 bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-2
                                     text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                                     focus:border-[var(--color-border-focus)] focus:outline-none transition-colors"
                        />
                        <button
                          onClick={() => handleJoin(carpool.id)}
                          disabled={!joinName.trim() || isLoading}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            joinName.trim() && !isLoading
                              ? 'gradient-accent text-white hover:opacity-90 active:scale-[0.97]'
                              : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
                          )}
                        >
                          {isLoading ? '⏳...' : t('joinRide')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Create ride form */}
          {showForm ? (
             <div className="bg-white/[0.03] border border-[var(--color-border)] rounded-xl p-4 space-y-3 animate-scale-in">
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder={t('driverName')}
                className="w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-2.5
                           text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                           focus:border-[var(--color-border-focus)] focus:outline-none transition-colors"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                    {t('seats')}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSeats(Math.max(1, seats - 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-[var(--color-border)]
                                 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{seats}</span>
                    <button
                      onClick={() => setSeats(Math.min(8, seats + 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-[var(--color-border)]
                                 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-[2]">
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                    {t('departureLocation')}
                  </label>
                  <input
                    type="text"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    placeholder={t('departureLocationPlaceholder')}
                    className="w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-1.5
                               text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                               focus:border-[var(--color-border-focus)] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium
                             text-[var(--color-text-secondary)] border border-[var(--color-border)]
                             hover:bg-white/5 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCreateRide}
                  disabled={!driverName.trim() || isLoading}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                    driverName.trim() && !isLoading
                      ? 'gradient-accent text-white hover:opacity-90 active:scale-[0.97]'
                      : 'bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed'
                  )}
                >
                  {isLoading ? '⏳...' : t('save')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl text-sm font-medium
                         border border-dashed border-[var(--color-border)]
                         text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]
                         hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5
                         transition-all"
            >
              + {t('offerRide')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
