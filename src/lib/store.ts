// ============================================================
// Store – Supabase-based data persistence
// All functions are async and communicate with the cloud DB
// ============================================================

import { supabase } from '@/lib/supabase';
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

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// ---- Events ----

export async function createEvent(
  title: string,
  description: string,
  location: string,
  dateTimes: string[]
): Promise<{ event: Event; adminToken: string }> {
  const adminToken = generateToken();

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title,
      description: description || null,
      location: location || null,
      admin_token: adminToken,
    })
    .select()
    .single();

  if (error || !event) throw new Error(error?.message || 'Failed to create event');

  // Insert date options
  const dateRows = dateTimes.map((dt) => ({
    event_id: event.id,
    datetime: dt,
  }));

  const { error: dateError } = await supabase.from('date_options').insert(dateRows);
  if (dateError) throw new Error(dateError.message);

  // Save admin token locally so the creator can manage the event
  saveAdminToken(event.id, adminToken);

  return { event: event as Event, adminToken };
}

export async function getEvent(id: string): Promise<EventWithDates | null> {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) return null;

  const { data: dates } = await supabase
    .from('date_options')
    .select('*')
    .eq('event_id', id)
    .order('datetime', { ascending: true });

  return {
    ...(event as Event),
    dates: (dates || []) as DateOption[],
  };
}

export async function deleteEvent(id: string): Promise<void> {
  // CASCADE will handle date_options, votes, carpools, carpool_passengers
  await supabase.from('events').delete().eq('id', id);

  // Clean up local admin token
  removeAdminToken(id);
}

export async function fixDate(eventId: string, dateId: string): Promise<void> {
  await supabase
    .from('events')
    .update({ fixed_date_id: dateId })
    .eq('id', eventId);
}

export async function unfixDate(eventId: string): Promise<void> {
  await supabase
    .from('events')
    .update({ fixed_date_id: null })
    .eq('id', eventId);
}

// ---- Admin Tokens (local only – stored in localStorage) ----

function getAdminTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem('treffpunkt-admin-tokens');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveAdminToken(eventId: string, token: string): void {
  if (typeof window === 'undefined') return;
  const tokens = getAdminTokens();
  tokens[eventId] = token;
  localStorage.setItem('treffpunkt-admin-tokens', JSON.stringify(tokens));
}

function removeAdminToken(eventId: string): void {
  if (typeof window === 'undefined') return;
  const tokens = getAdminTokens();
  delete tokens[eventId];
  localStorage.setItem('treffpunkt-admin-tokens', JSON.stringify(tokens));
}

export async function isAdmin(eventId: string): Promise<boolean> {
  const tokens = getAdminTokens();
  const localToken = tokens[eventId];
  if (!localToken) return false;

  const { data: event } = await supabase
    .from('events')
    .select('admin_token')
    .eq('id', eventId)
    .single();

  return !!(event && event.admin_token === localToken);
}

export function getCreatedEventIds(): string[] {
  const tokens = getAdminTokens();
  return Object.keys(tokens);
}

// ---- Votes ----

export async function submitVotes(
  eventId: string,
  voterName: string,
  votes: { dateId: string; status: VoteStatus; comment?: string }[]
): Promise<void> {
  // Delete old votes from this voter for this event
  await supabase
    .from('votes')
    .delete()
    .eq('event_id', eventId)
    .eq('voter_name', voterName);

  // Insert new votes
  const voteRows = votes.map((v) => ({
    event_id: eventId,
    date_id: v.dateId,
    voter_name: voterName,
    status: v.status,
    comment: v.comment || null,
  }));

  const { error } = await supabase.from('votes').insert(voteRows);
  if (error) throw new Error(error.message);

  // Save voter name locally
  if (typeof window !== 'undefined') {
    localStorage.setItem(`treffpunkt-voter-${eventId}`, voterName);
  }
}

export async function getVotesForEvent(eventId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('event_id', eventId);

  if (error) return [];
  return (data || []) as Vote[];
}

export function getSavedVoterName(eventId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`treffpunkt-voter-${eventId}`);
}

// ---- Carpools ----

export async function createCarpool(
  eventId: string,
  driverName: string,
  totalSeats: number,
  departureLocation: string
): Promise<Carpool> {
  const { data, error } = await supabase
    .from('carpools')
    .insert({
      event_id: eventId,
      driver_name: driverName,
      total_seats: totalSeats,
      departure_location: departureLocation,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create carpool');
  return data as Carpool;
}

export async function getCarpoolsForEvent(eventId: string): Promise<CarpoolWithPassengers[]> {
  const { data: carpools } = await supabase
    .from('carpools')
    .select('*')
    .eq('event_id', eventId);

  if (!carpools || carpools.length === 0) return [];

  const carpoolIds = carpools.map((c) => c.id);
  const { data: passengers } = await supabase
    .from('carpool_passengers')
    .select('*')
    .in('carpool_id', carpoolIds);

  return carpools.map((c) => ({
    ...(c as Carpool),
    passengers: ((passengers || []) as CarpoolPassenger[]).filter(
      (p) => p.carpool_id === c.id
    ),
  }));
}

export async function joinCarpool(carpoolId: string, passengerName: string): Promise<boolean> {
  // Check if seat is available
  const { data: carpool } = await supabase
    .from('carpools')
    .select('total_seats')
    .eq('id', carpoolId)
    .single();

  if (!carpool) return false;

  const { data: existing } = await supabase
    .from('carpool_passengers')
    .select('id')
    .eq('carpool_id', carpoolId);

  if ((existing || []).length >= carpool.total_seats) return false;

  const { error } = await supabase
    .from('carpool_passengers')
    .insert({
      carpool_id: carpoolId,
      passenger_name: passengerName,
    });

  return !error;
}

export async function leaveCarpool(carpoolId: string, passengerName: string): Promise<void> {
  await supabase
    .from('carpool_passengers')
    .delete()
    .eq('carpool_id', carpoolId)
    .eq('passenger_name', passengerName);
}

export async function deleteCarpool(carpoolId: string): Promise<void> {
  // CASCADE handles passengers
  await supabase.from('carpools').delete().eq('id', carpoolId);
}
