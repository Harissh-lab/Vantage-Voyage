-- Clear all existing data from tables (keeping structure)
-- Run this to start fresh with a clean database

-- Delete all data from dependent tables first (due to foreign key constraints)
TRUNCATE TABLE guest_requests CASCADE;
TRUNCATE TABLE guest_family CASCADE;
TRUNCATE TABLE label_perks CASCADE;
TRUNCATE TABLE guests CASCADE;
TRUNCATE TABLE perks CASCADE;
TRUNCATE TABLE labels CASCADE;
TRUNCATE TABLE travel_schedules CASCADE;
TRUNCATE TABLE travel_options CASCADE;
TRUNCATE TABLE hotel_bookings CASCADE;
TRUNCATE TABLE client_details CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences for auto-incrementing IDs
ALTER SEQUENCE IF EXISTS events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS labels_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS perks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS label_perks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS guests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS guest_family_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS guest_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS client_details_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hotel_bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS travel_options_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS travel_schedules_id_seq RESTART WITH 1;

-- Database is now clean and ready for fresh data
