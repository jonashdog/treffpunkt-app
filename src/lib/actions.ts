"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type {
  Event,
  DateOption,
  Vote,
  Carpool,
  CarpoolPassenger,
  EventWithDates,
  CarpoolWithPassengers,
  VoteStatus,
} from '@/types';

// Create a server-side client
// We use the service role key if available, otherwise fallback to anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function createEventAction(
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

  const dateRows = dateTimes.map((dt) => ({
    event_id: event.id,
    datetime: dt,
  }));

  const { error: dateError } = await supabase.from('date_options').insert(dateRows);
  if (dateError) throw new Error(dateError.message);

  return { event: event as Event, adminToken };
}

export async function getEventAction(id: string): Promise<EventWithDates | null> {
  // We do NOT select admin_token here to prevent leaking it to the client!
  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, description, location, fixed_date_id, created_at')
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

export async function checkAdminAction(eventId: string, token: string): Promise<boolean> {
  if (!token) return false;
  const { data: event } = await supabase
    .from('events')
    .select('admin_token')
    .eq('id', eventId)
    .single();
  
  return !!(event && event.admin_token === token);
}

export async function deleteEventAction(id: string, adminToken: string): Promise<boolean> {
  const isAdmin = await checkAdminAction(id, adminToken);
  if (!isAdmin) return false;

  await supabase.from('events').delete().eq('id', id);
  return true;
}

export async function fixDateAction(eventId: string, dateId: string, adminToken: string): Promise<boolean> {
  const isAdmin = await checkAdminAction(eventId, adminToken);
  if (!isAdmin) return false;

  await supabase
    .from('events')
    .update({ fixed_date_id: dateId })
    .eq('id', eventId);
    
  revalidatePath(`/event/${eventId}`);
  revalidatePath(`/event/${eventId}/admin`);
  return true;
}

export async function unfixDateAction(eventId: string, adminToken: string): Promise<boolean> {
  const isAdmin = await checkAdminAction(eventId, adminToken);
  if (!isAdmin) return false;

  await supabase
    .from('events')
    .update({ fixed_date_id: null })
    .eq('id', eventId);
    
  revalidatePath(`/event/${eventId}`);
  revalidatePath(`/event/${eventId}/admin`);
  return true;
}

export async function submitVotesAction(
  eventId: string,
  voterName: string,
  votes: { dateId: string; status: VoteStatus; comment?: string }[]
): Promise<void> {
  await supabase
    .from('votes')
    .delete()
    .eq('event_id', eventId)
    .eq('voter_name', voterName);

  const voteRows = votes.map((v) => ({
    event_id: eventId,
    date_id: v.dateId,
    voter_name: voterName,
    status: v.status,
    comment: v.comment || null,
  }));

  const { error } = await supabase.from('votes').insert(voteRows);
  if (error) throw new Error(error.message);

  revalidatePath(`/event/${eventId}`);
}

export async function getVotesAction(eventId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('event_id', eventId);

  if (error) return [];
  return (data || []) as Vote[];
}

export async function createCarpoolAction(
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
  
  revalidatePath(`/event/${eventId}`);
  return data as Carpool;
}

export async function getCarpoolsAction(eventId: string): Promise<CarpoolWithPassengers[]> {
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

export async function joinCarpoolAction(eventId: string, carpoolId: string, passengerName: string): Promise<boolean> {
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

  if (!error) revalidatePath(`/event/${eventId}`);
  return !error;
}

export async function leaveCarpoolAction(eventId: string, carpoolId: string, passengerName: string): Promise<void> {
  await supabase
    .from('carpool_passengers')
    .delete()
    .eq('carpool_id', carpoolId)
    .eq('passenger_name', passengerName);
    
  revalidatePath(`/event/${eventId}`);
}

export async function deleteCarpoolAction(eventId: string, carpoolId: string): Promise<void> {
  await supabase.from('carpools').delete().eq('id', carpoolId);
  revalidatePath(`/event/${eventId}`);
}
