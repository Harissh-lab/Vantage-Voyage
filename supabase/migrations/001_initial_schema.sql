-- Create users table (custom table, not using Supabase Auth for this case)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent', 'client')),
  event_code TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  event_code TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_details table
CREATE TABLE IF NOT EXISTS client_details (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  has_vip_guests BOOLEAN DEFAULT FALSE,
  has_friends BOOLEAN DEFAULT FALSE,
  has_family BOOLEAN DEFAULT FALSE
);

-- Create hotel_bookings table
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  check_in_date TIMESTAMPTZ NOT NULL,
  check_out_date TIMESTAMPTZ NOT NULL,
  number_of_rooms INTEGER NOT NULL
);

-- Create travel_options table
CREATE TABLE IF NOT EXISTS travel_options (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  travel_mode TEXT NOT NULL,
  departure_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL
);

-- Create travel_schedules table
CREATE TABLE IF NOT EXISTS travel_schedules (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('departure', 'return')),
  carrier TEXT NOT NULL,
  flight_number TEXT,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  category TEXT,
  dietary_restrictions TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create perks table
CREATE TABLE IF NOT EXISTS perks (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_agent_id ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_event_code ON events(event_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_event_code ON users(event_code);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_client_details_event_id ON client_details(event_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_event_id ON hotel_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_travel_options_event_id ON travel_options(event_id);
CREATE INDEX IF NOT EXISTS idx_travel_schedules_event_id ON travel_schedules(event_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust based on your security requirements)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

-- Events policies
CREATE POLICY "Anyone can read events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Agents can create events" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Agents can update their events" ON events
  FOR UPDATE USING (true);

CREATE POLICY "Agents can delete their events" ON events
  FOR DELETE USING (true);

-- Client details policies
CREATE POLICY "Anyone can read client details" ON client_details
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert client details" ON client_details
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update client details" ON client_details
  FOR UPDATE USING (true);

-- Hotel bookings policies
CREATE POLICY "Anyone can read hotel bookings" ON hotel_bookings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert hotel bookings" ON hotel_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update hotel bookings" ON hotel_bookings
  FOR UPDATE USING (true);

-- Travel options policies
CREATE POLICY "Anyone can read travel options" ON travel_options
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert travel options" ON travel_options
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update travel options" ON travel_options
  FOR UPDATE USING (true);

-- Travel schedules policies
CREATE POLICY "Anyone can read travel schedules" ON travel_schedules
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert travel schedules" ON travel_schedules
  FOR INSERT WITH CHECK (true);

-- Guests policies
CREATE POLICY "Anyone can read guests" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert guests" ON guests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update guests" ON guests
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete guests" ON guests
  FOR DELETE USING (true);

-- Labels policies
CREATE POLICY "Anyone can read labels" ON labels
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert labels" ON labels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete labels" ON labels
  FOR DELETE USING (true);

-- Perks policies
CREATE POLICY "Anyone can read perks" ON perks
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert perks" ON perks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update perks" ON perks
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete perks" ON perks
  FOR DELETE USING (true);

-- Requests policies
CREATE POLICY "Anyone can read requests" ON requests
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert requests" ON requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update requests" ON requests
  FOR UPDATE USING (true);
