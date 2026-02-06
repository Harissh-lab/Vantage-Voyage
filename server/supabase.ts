import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials not configured. Using in-memory storage.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type User = {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'agent' | 'client';
  event_code?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: number;
  name: string;
  date: string;
  location: string;
  description?: string;
  event_code: string;
  agent_id: string;
  is_published: boolean;
  created_at: string;
};

export type ClientDetails = {
  id: number;
  event_id: number;
  client_name: string;
  address: string;
  phone: string;
  has_vip_guests: boolean;
  has_friends: boolean;
  has_family: boolean;
};

export type HotelBooking = {
  id: number;
  event_id: number;
  hotel_name: string;
  check_in_date: string;
  check_out_date: string;
  number_of_rooms: number;
};

export type TravelOption = {
  id: number;
  event_id: number;
  travel_mode: string;
  departure_date: string;
  return_date: string;
  from_location: string;
  to_location: string;
};

export type TravelSchedule = {
  id: number;
  event_id: number;
  schedule_type: 'departure' | 'return';
  carrier: string;
  flight_number?: string;
  departure_time: string;
  arrival_time: string;
};

export type Guest = {
  id: number;
  event_id: number;
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  dietary_restrictions?: string;
  special_requests?: string;
  created_at: string;
};
