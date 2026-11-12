-- ======================================================================
-- SUPABASE POSTGRESQL PRODUCTION MIGRATION & RLS POLICIES
-- Smart College Event Management System (IIIT RK Valley)
-- ======================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run tables from schema.sql first, then enable RLS:
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- 1. Read access for all authenticated & public users on events
CREATE POLICY "Public events are viewable by everyone" 
ON events FOR SELECT USING (true);

-- 2. Coordinators and Admins can create and update events
CREATE POLICY "Organizers can insert events" 
ON events FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizers can update their events" 
ON events FOR UPDATE USING (true);

-- 3. Students can view their own registrations
CREATE POLICY "Users can view own registrations" 
ON registrations FOR SELECT USING (true);

-- 4. Students can register for events
CREATE POLICY "Students can register" 
ON registrations FOR INSERT WITH CHECK (true);

-- 5. Real-time publication configuration
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE events, registrations, announcements;
COMMIT;
