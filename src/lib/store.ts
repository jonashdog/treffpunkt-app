// ============================================================
// Mock Store – localStorage-based data persistence
// Ready for 1:1 Supabase migration
// ============================================================

import {
  type Event,
  type DateOption,
  type Vote,
  type Carpool,
  type CarpoolPassenger,
  type EventWithDates,
  type CarpoolWithPassengers,
  type VoteStatus,
} from '@/types';

// ---- Helpers ----

function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

function getStore<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`treffpunkt-${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`treffpunkt-${key}`, JSON.stringify(data));
}

// ---- Events ----

export function createEvent(
  title: string,
  description: string,
  location: string,
  dateTimes: string[] // ISO strings
): { event: Event; adminToken: string } {
  const id = generateId();
  const adminToken = generateToken();

  const event: Event = {
    id,
    title,
    description: description || undefined,
    location: location || undefined,
    admin_token: adminToken,
    created_at: new Date().toISOString(),
  };

  const dates: DateOption[] = dateTimes.map((dt) => ({
    id: generateId(),
    event_id: id,
    datetime: dt,
  }));

  const events = getStore<Event>('events');
  events.push(event);
  setStore('events', events);

  const existingDates = getStore<DateOption>('dates');
  setStore('dates', [...existingDates, ...dates]);

  // Save admin token mapping
  const adminTokens = getAdminTokens();
  adminTokens[id] = adminToken;
  localStorage.setItem('treffpunkt-admin-tokens', JSON.stringify(adminTokens));

  return { event, adminToken };
}

export function getEvent(id: string): EventWithDates | null {
  const events = getStore<Event>('events');
  const event = events.find((e) => e.id === id);
  if (!event) return null;

  const dates = getStore<DateOption>('dates').filter((d) => d.event_id === id);
  dates.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  return { ...event, dates };
}

export function deleteEvent(id: string): void {
  setStore('events', getStore<Event>('events').filter((e) => e.id !== id));
  setStore('dates', getStore<DateOption>('dates').filter((d) => d.event_id !== id));
  setStore('votes', getStore<Vote>('votes').filter((v) => v.event_id !== id));

  // Clean up carpools
  const carpools = getStore<Carpool>('carpools');
  const eventCarpoolIds = carpools.filter((c) => c.event_id === id).map((c) => c.id);
  setStore('carpools', carpools.filter((c) => c.event_id !== id));
  setStore(
    'carpool-passengers',
    getStore<CarpoolPassenger>('carpool-passengers').filter(
      (p) => !eventCarpoolIds.includes(p.carpool_id)
    )
  );

  const adminTokens = getAdminTokens();
  delete adminTokens[id];
  localStorage.setItem('treffpunkt-admin-tokens', JSON.stringify(adminTokens));
}

export function fixDate(eventId: string, dateId: string): void {
  const events = getStore<Event>('events');
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx !== -1) {
    events[idx].fixed_date_id = dateId;
    setStore('events', events);
  }
}

export function unfixDate(eventId: string): void {
  const events = getStore<Event>('events');
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx !== -1) {
    events[idx].fixed_date_id = undefined;
    setStore('events', events);
  }
}

// ---- Admin Tokens ----

function getAdminTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem('treffpunkt-admin-tokens');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function isAdmin(eventId: string): boolean {
  const tokens = getAdminTokens();
  const event = getStore<Event>('events').find((e) => e.id === eventId);
  return !!(event && tokens[eventId] === event.admin_token);
}

export function getCreatedEventIds(): string[] {
  const tokens = getAdminTokens();
  return Object.keys(tokens);
}

// ---- Votes ----

export function submitVotes(
  eventId: string,
  voterName: string,
  votes: { dateId: string; status: VoteStatus; comment?: string }[]
): void {
  const allVotes = getStore<Vote>('votes');

  // Remove old votes from this voter for this event
  const filtered = allVotes.filter(
    (v) => !(v.event_id === eventId && v.voter_name === voterName)
  );

  // Add new votes
  const newVotes: Vote[] = votes.map((v) => ({
    id: generateId(),
    event_id: eventId,
    date_id: v.dateId,
    voter_name: voterName,
    status: v.status,
    comment: v.comment || undefined,
  }));

  setStore('votes', [...filtered, ...newVotes]);

  // Save voter name for this event
  localStorage.setItem(`treffpunkt-voter-${eventId}`, voterName);
}

export function getVotesForEvent(eventId: string): Vote[] {
  return getStore<Vote>('votes').filter((v) => v.event_id === eventId);
}

export function getSavedVoterName(eventId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`treffpunkt-voter-${eventId}`);
}

// ---- Carpools ----

export function createCarpool(
  eventId: string,
  driverName: string,
  totalSeats: number,
  departureLocation: string
): Carpool {
  const carpool: Carpool = {
    id: generateId(),
    event_id: eventId,
    driver_name: driverName,
    total_seats: totalSeats,
    departure_location: departureLocation,
  };

  const carpools = getStore<Carpool>('carpools');
  carpools.push(carpool);
  setStore('carpools', carpools);

  return carpool;
}

export function getCarpoolsForEvent(eventId: string): CarpoolWithPassengers[] {
  const carpools = getStore<Carpool>('carpools').filter((c) => c.event_id === eventId);
  const allPassengers = getStore<CarpoolPassenger>('carpool-passengers');

  return carpools.map((c) => ({
    ...c,
    passengers: allPassengers.filter((p) => p.carpool_id === c.id),
  }));
}

export function joinCarpool(carpoolId: string, passengerName: string): boolean {
  const carpools = getStore<Carpool>('carpools');
  const carpool = carpools.find((c) => c.id === carpoolId);
  if (!carpool) return false;

  const passengers = getStore<CarpoolPassenger>('carpool-passengers');
  const carpoolPassengers = passengers.filter((p) => p.carpool_id === carpoolId);

  if (carpoolPassengers.length >= carpool.total_seats) return false;
  if (carpoolPassengers.some((p) => p.passenger_name === passengerName)) return false;

  passengers.push({
    id: generateId(),
    carpool_id: carpoolId,
    passenger_name: passengerName,
  });
  setStore('carpool-passengers', passengers);
  return true;
}

export function leaveCarpool(carpoolId: string, passengerName: string): void {
  const passengers = getStore<CarpoolPassenger>('carpool-passengers');
  setStore(
    'carpool-passengers',
    passengers.filter(
      (p) => !(p.carpool_id === carpoolId && p.passenger_name === passengerName)
    )
  );
}

export function deleteCarpool(carpoolId: string): void {
  setStore('carpools', getStore<Carpool>('carpools').filter((c) => c.id !== carpoolId));
  setStore(
    'carpool-passengers',
    getStore<CarpoolPassenger>('carpool-passengers').filter((p) => p.carpool_id !== carpoolId)
  );
}
