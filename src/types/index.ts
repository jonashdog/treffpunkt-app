// ============================================================
// Terminfindungs-App – Type Definitions
// Mirrors the Supabase DB schema for easy migration later
// ============================================================

export type VoteStatus = 'yes' | 'no' | 'maybe';

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  admin_token: string;
  fixed_date_id?: string; // when organiser locks a date
  created_at: string; // ISO timestamp
}

export interface DateOption {
  id: string;
  event_id: string;
  datetime: string; // ISO timestamp
}

export interface Vote {
  id: string;
  event_id: string;
  date_id: string;
  voter_name: string;
  status: VoteStatus;
  comment?: string;
}

export interface Carpool {
  id: string;
  event_id: string;
  driver_name: string;
  total_seats: number;
  departure_location: string;
}

export interface CarpoolPassenger {
  id: string;
  carpool_id: string;
  passenger_name: string;
}

// Composite types for UI convenience
export interface EventWithDates extends Event {
  dates: DateOption[];
}

export interface CarpoolWithPassengers extends Carpool {
  passengers: CarpoolPassenger[];
}
