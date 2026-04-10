-- 003: Facilities (Sanitarium, Fakri Hall, Shujai Hall) & Bookings

-- Required for EXCLUDE USING gist on non-geometric types (uuid, date, timestamp)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS facilities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  type         text NOT NULL CHECK (type IN ('sanitarium','hall_fakri','hall_shujai')),
  capacity     int  NOT NULL DEFAULT 0,
  description  text NOT NULL DEFAULT '',
  amenities    jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read facilities" ON facilities FOR SELECT USING (true);
CREATE POLICY "Admins manage facilities"
  ON facilities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','booking_admin')
  ));

-- Seed facilities
INSERT INTO facilities (name, type, capacity, description, amenities) VALUES
  (
    'Khadki Bohra Sanitarium',
    'sanitarium',
    40,
    'A serene rest house for mumeeneen visiting Khadki for Ashara and other occasions. Rooms available for families and individuals.',
    '["Clean rooms","Attached bathrooms","Common dining area","Prayer area","Wudhu khana","Hot water","24/7 access","Parking"]'::jsonb
  ),
  (
    'Fakri Hall',
    'hall_fakri',
    200,
    'Spacious community hall suitable for nikah ceremonies, aqeeqah, gatherings and other community functions.',
    '["AC","Sound system","Stage","Chairs & tables","Kitchen","Parking","Wudhu khana","Prayer room"]'::jsonb
  ),
  (
    'Shujai Hall',
    'hall_shujai',
    120,
    'Mid-size hall ideal for smaller gatherings, meetings, madrasa events and family functions.',
    '["AC","Projector","Microphone","Chairs","Small kitchen","Parking","Prayer space"]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id  uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  user_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_name   text NOT NULL,
  event_type   text NOT NULL DEFAULT 'other'
                 CHECK (event_type IN ('nikah','aqeeqah','gathering','meeting','ashara','other')),
  date         date NOT NULL,
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  attendees    int  NOT NULL DEFAULT 1,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','cancelled')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    facility_id WITH =,
    daterange(date, date, '[]') WITH &&,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) WITH &&
  ) WHERE (status != 'cancelled')
);

-- Index for calendar queries
CREATE INDEX IF NOT EXISTS idx_bookings_facility_date
  ON bookings (facility_id, date)
  WHERE status != 'cancelled';

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read confirmed bookings (dates only)"
  ON bookings FOR SELECT
  USING (status = 'confirmed');
CREATE POLICY "Users see own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own pending bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Booking admins manage all bookings"
  ON bookings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','booking_admin')
  ));
