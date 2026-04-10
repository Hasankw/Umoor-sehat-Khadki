-- ALL MIGRATIONS: 001 → 009
-- ============================================
-- 001_auth_roles.sql
-- ============================================
-- 001: Profiles / auth roles
-- Extends Supabase auth.users with community-specific fields

CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  its_id        text UNIQUE,
  full_name     text NOT NULL DEFAULT '',
  role          text NOT NULL DEFAULT 'member'
                  CHECK (role IN ('super_admin','umoor_admin','madrasa_admin','booking_admin','member')),
  umoor_id      uuid,  -- FK added after umoors table created
  phone         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','umoor_admin','madrasa_admin','booking_admin')
    )
  );

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,
  priority    int  NOT NULL DEFAULT 1,
  active      bool NOT NULL DEFAULT true,
  expires_at  date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active announcements"
  ON announcements FOR SELECT USING (active = true);
CREATE POLICY "Admins manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================
-- 002_umoors.sql
-- ============================================
-- 002: Umoors (12 departments)

CREATE TABLE IF NOT EXISTS umoors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  name_ar        text NOT NULL DEFAULT '',
  name_lisan     text NOT NULL DEFAULT '',
  description    text NOT NULL DEFAULT '',
  contact_name   text NOT NULL DEFAULT '',
  contact_phone  text NOT NULL DEFAULT '',
  contact_email  text NOT NULL DEFAULT '',
  icon           text NOT NULL DEFAULT 'users',
  display_order  int  NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Add FK from profiles to umoors
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_umoor
  FOREIGN KEY (umoor_id) REFERENCES umoors(id) ON DELETE SET NULL;

ALTER TABLE umoors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read umoors" ON umoors FOR SELECT USING (true);
CREATE POLICY "Super admin manages umoors"
  ON umoors FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- ── SEED: 12 Umoors ──────────────────────────────────────────────────────────
INSERT INTO umoors (name, name_ar, name_lisan, description, icon, display_order) VALUES
  ('Talim',         'تعليم',       'Talim',         'Education & learning initiatives for the community',                    'book-open',      1),
  ('Taharat',       'طهارة',       'Taharat',       'Purity, cleanliness and environmental hygiene',                        'sparkles',       2),
  ('Tijarat',       'تجارة',       'Tijarat',       'Trade, commerce and business support for mumeeneen',                   'briefcase',      3),
  ('Sehhat',        'صحة',         'Sehhat',        'Health, wellness and medical assistance',                              'heart-pulse',    4),
  ('Imarat',        'عمارة',       'Imarat',        'Infrastructure, construction and facility management',                 'building-2',     5),
  ('Iftitah',       'افتتاح',      'Iftitah',       'Welfare, social support and community outreach',                      'hand-heart',     6),
  ('Alam',          'علم',         'Alam',          'Higher education and scholarships',                                    'graduation-cap', 7),
  ('Bustan',        'بستان',       'Bustan',        'Youth development, sports and activities',                             'tree-pine',      8),
  ('Khidmat',       'خدمة',        'Khidmat',       'Community service, volunteering and assistance',                      'users',          9),
  ('Nizam',         'نظام',        'Nizam',         'Administration, coordination and jamaat management',                   'settings',      10),
  ('Deeni Talim',   'ديني تعليم',  'Deeni Talim',   'Religious education, madrasa and Quran learning',                     'mosque',        11),
  ('Khawateen',     'خواتين',      'Khawateen',     'Women''s welfare, activities and empowerment',                        'users-round',   12)
ON CONFLICT DO NOTHING;

-- ============================================
-- 003_facilities_bookings.sql
-- ============================================
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

-- ============================================
-- 004_madrasa.sql
-- ============================================
-- 004: Madrasa management

CREATE TABLE IF NOT EXISTS madrasa_students (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  its_id           text NOT NULL,
  name             text NOT NULL,
  class            text NOT NULL,
  guardian_name    text NOT NULL,
  guardian_phone   text NOT NULL,
  guardian_its_id  text NOT NULL,
  enrollment_date  date NOT NULL DEFAULT CURRENT_DATE,
  active           bool NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE madrasa_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Madrasa admins manage students"
  ON madrasa_students FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','madrasa_admin')
  ));
CREATE POLICY "Guardians see own children"
  ON madrasa_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.its_id = madrasa_students.guardian_its_id
    )
  );

CREATE TABLE IF NOT EXISTS madrasa_attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES madrasa_students(id) ON DELETE CASCADE,
  date        date NOT NULL,
  status      text NOT NULL DEFAULT 'present'
                CHECK (status IN ('present','absent','late','excused')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE madrasa_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Madrasa admins manage attendance"
  ON madrasa_attendance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','madrasa_admin')
  ));
CREATE POLICY "Guardians see own child attendance"
  ON madrasa_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM madrasa_students s
      JOIN profiles p ON p.its_id = s.guardian_its_id
      WHERE s.id = madrasa_attendance.student_id
      AND p.id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS madrasa_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES madrasa_students(id) ON DELETE CASCADE,
  exam_name   text NOT NULL,
  marks       int  NOT NULL,
  total       int  NOT NULL,
  remarks     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE madrasa_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Madrasa admins manage results"
  ON madrasa_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','madrasa_admin')
  ));
CREATE POLICY "Guardians see own child results"
  ON madrasa_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM madrasa_students s
      JOIN profiles p ON p.its_id = s.guardian_its_id
      WHERE s.id = madrasa_results.student_id
      AND p.id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS madrasa_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL,
  date        date NOT NULL,
  image_url   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE madrasa_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read activities" ON madrasa_activities FOR SELECT USING (true);
CREATE POLICY "Madrasa admins manage activities"
  ON madrasa_activities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','madrasa_admin')
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON madrasa_attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_results_student ON madrasa_results(student_id);

-- ============================================
-- 005_fmb.sql
-- ============================================
-- 005: Faza ul Mawaid Buhaniyah (FMB) — daily menu

CREATE TABLE IF NOT EXISTS fmb_menu (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date NOT NULL,
  meal_type  text NOT NULL
               CHECK (meal_type IN ('breakfast','nashta','lunch','dinner')),
  items      jsonb NOT NULL DEFAULT '[]',
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_fmb_date ON fmb_menu(date DESC);

ALTER TABLE fmb_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read FMB menu" ON fmb_menu FOR SELECT USING (true);
CREATE POLICY "Umoor admins manage FMB"
  ON fmb_menu FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- ============================================
-- 006_events_miqaat.sql
-- ============================================
-- 006: Events & Miqaat dates

-- Miqaat
CREATE TABLE IF NOT EXISTS miqaat_dates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  title_ar         text NOT NULL DEFAULT '',
  hijri_date       text NOT NULL,
  gregorian_date   date NOT NULL,
  description      text,
  category         text NOT NULL DEFAULT 'other'
                     CHECK (category IN ('eid','urus','ayyam','other')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_miqaat_date ON miqaat_dates(gregorian_date);

ALTER TABLE miqaat_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read miqaat" ON miqaat_dates FOR SELECT USING (true);
CREATE POLICY "Admins manage miqaat"
  ON miqaat_dates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- Seed key miqaat for 1447H (current Hijri year, ending ~June 2026)
INSERT INTO miqaat_dates (title, title_ar, hijri_date, gregorian_date, category, description) VALUES
  ('Eid ul Fitr 1447H',       'عيد الفطر',      '1 Shawwal 1447H',   '2026-03-21', 'eid',   'End of Ramadan — Eid ul Fitr'),
  ('Eid ul Adha 1447H',       'عيد الأضحى',     '10 Zil Hijja 1447H','2026-05-27', 'eid',   'Eid ul Adha — Hajj season'),
  ('Ashara Mubaraka 1448H',   'عاشرة مباركة',   '1-10 Muharram 1448H','2026-06-17','ayyam', 'Ten sacred days commemorating Imam Husain SA — Khadki, Pune'),
  ('Milad ul Nabi SAW',       'مولد النبي',     '12 Rabi al-Awwal',  '2026-09-06', 'ayyam', 'Birthday of Prophet Muhammad SAW'),
  ('Urs Syedna Taher Saifuddin RA', 'عرس',      '27 Rajab 1448H',    '2027-01-15', 'urus',  'Annual urs of 52nd Dai al-Mutlaq')
ON CONFLICT DO NOTHING;

-- Events
CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date  date NOT NULL,
  event_time  time,
  location    text,
  umoor_id    uuid REFERENCES umoors(id) ON DELETE SET NULL,
  image_url   text,
  is_public   bool NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_umoor ON events(umoor_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public events"
  ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Members see all events"
  ON events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Umoor admins manage events"
  ON events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- ============================================
-- 007_messages_announcements.sql
-- ============================================
-- 007: Messages, Ashara tables

-- Messages (public can send, no auth required)
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name     text NOT NULL,
  sender_its_id   text NOT NULL,
  sender_phone    text NOT NULL,
  to_umoor_id     uuid NOT NULL REFERENCES umoors(id) ON DELETE RESTRICT,
  subject         text NOT NULL,
  message         text NOT NULL,
  status          text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','read','replied')),
  replied_at      timestamptz,
  reply           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_umoor ON messages(to_umoor_id, status);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Sender can check own message by its_id"
  ON messages FOR SELECT
  USING (sender_its_id = (SELECT its_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Umoor admins read messages for their umoor"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR (p.role = 'umoor_admin' AND p.umoor_id = messages.to_umoor_id))
    )
  );
CREATE POLICY "Umoor admins reply to messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR (p.role = 'umoor_admin' AND p.umoor_id = messages.to_umoor_id))
    )
  );

-- ── ASHARA ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ashara_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year             int  UNIQUE NOT NULL,
  location         text NOT NULL DEFAULT 'Khadki, Pune',
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  venue_name       text NOT NULL DEFAULT '',
  venue_address    text NOT NULL DEFAULT '',
  google_maps_url  text,
  status           text NOT NULL DEFAULT 'upcoming'
                     CHECK (status IN ('upcoming','live','completed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ashara_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads ashara config" ON ashara_config FOR SELECT USING (true);
CREATE POLICY "Admins manage ashara config"
  ON ashara_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- Seed
INSERT INTO ashara_config (year, location, start_date, end_date, venue_name, venue_address, status) VALUES
  (1447, 'Khadki, Pune', '2025-06-27', '2026-07-06', 'Khadki Bohra Masjid Complex', 'Camp, Khadki, Pune - 411003', 'completed'),
  (1448, 'Khadki, Pune', '2026-06-17', '2026-06-26', 'Khadki Bohra Masjid Complex', 'Camp, Khadki, Pune - 411003', 'upcoming')
ON CONFLICT (year) DO NOTHING;

-- Ashara schedule (day-wise)
CREATE TABLE IF NOT EXISTS ashara_schedule (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ashara_config_id  uuid NOT NULL REFERENCES ashara_config(id) ON DELETE CASCADE,
  day_number        int  NOT NULL CHECK (day_number BETWEEN 1 AND 10),
  date              date NOT NULL,
  waaz_time         time,
  namaaz_times      jsonb NOT NULL DEFAULT '{"fajr":"","zohr_asr":"","maghrib_isha":""}',
  special_notes     text,
  UNIQUE(ashara_config_id, day_number)
);

ALTER TABLE ashara_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads ashara schedule" ON ashara_schedule FOR SELECT USING (true);
CREATE POLICY "Admins manage ashara schedule"
  ON ashara_schedule FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- Seed 1448H schedule (June 17–26, 2026)
WITH cfg AS (SELECT id FROM ashara_config WHERE year = 1448)
INSERT INTO ashara_schedule (ashara_config_id, day_number, date, namaaz_times) VALUES
  ((SELECT id FROM cfg), 1,  '2026-06-17', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 2,  '2026-06-18', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 3,  '2026-06-19', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 4,  '2026-06-20', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 5,  '2026-06-21', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 6,  '2026-06-22', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 7,  '2026-06-23', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 8,  '2026-06-24', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 9,  '2026-06-25', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb),
  ((SELECT id FROM cfg), 10, '2026-06-26', '{"fajr":"04:15","zohr_asr":"12:30","maghrib_isha":"20:00"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Ashara live updates
CREATE TABLE IF NOT EXISTS ashara_updates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ashara_config_id  uuid NOT NULL REFERENCES ashara_config(id) ON DELETE CASCADE,
  title             text NOT NULL,
  body              text NOT NULL,
  posted_at         timestamptz NOT NULL DEFAULT now(),
  pinned            bool NOT NULL DEFAULT false
);

ALTER TABLE ashara_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads ashara updates" ON ashara_updates FOR SELECT USING (true);
CREATE POLICY "Admins post ashara updates"
  ON ashara_updates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- Ashara preparations
CREATE TABLE IF NOT EXISTS ashara_preparations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ashara_config_id  uuid NOT NULL REFERENCES ashara_config(id) ON DELETE CASCADE,
  category          text NOT NULL
                      CHECK (category IN ('accommodation','transport','parking','essentials')),
  title             text NOT NULL,
  description       text NOT NULL,
  status            text NOT NULL DEFAULT 'active',
  display_order     int  NOT NULL DEFAULT 0
);

ALTER TABLE ashara_preparations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads preparations" ON ashara_preparations FOR SELECT USING (true);
CREATE POLICY "Admins manage preparations"
  ON ashara_preparations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin','umoor_admin')
  ));

-- Seed 1448H preparations
WITH cfg AS (SELECT id FROM ashara_config WHERE year = 1448)
INSERT INTO ashara_preparations (ashara_config_id, category, title, description, display_order) VALUES
  ((SELECT id FROM cfg), 'accommodation', 'Sanitarium Booking', 'Book your stay at Khadki Bohra Sanitarium. Limited rooms — book early.', 1),
  ((SELECT id FROM cfg), 'accommodation', 'Local Hotels', 'List of nearby hotels and guest houses in Khadki and Camp area.', 2),
  ((SELECT id FROM cfg), 'transport',     'Train to Khadki', 'Khadki Railway Station is on the Pune–Mumbai line. Auto-rickshaws available.', 1),
  ((SELECT id FROM cfg), 'transport',     'By Road', 'From Pune city: 12km via Senapati Bapat Road. Parking near venue.', 2),
  ((SELECT id FROM cfg), 'parking',       'Designated Parking', 'Parking available at [venue]. Follow signage for Bohra Ashara parking zone.', 1),
  ((SELECT id FROM cfg), 'essentials',    'What to Wear', 'Mumeeneen are requested to wear rida / kurta-pyjama for all bayaans.', 1),
  ((SELECT id FROM cfg), 'essentials',    'Contact During Ashara', 'Emergency contact for Ashara coordination: +91-XXXXX-XXXXX', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- 008_security_enhancements.sql
-- ============================================
-- 008: Security enhancements
--   • Add ref + requester columns to bookings
--   • Allow public (unauthenticated) booking inserts
--   • Rate-limit messages to 3 per ITS ID per hour

-- ── BOOKINGS ──────────────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS ref             text UNIQUE,
  ADD COLUMN IF NOT EXISTS requester_name  text,
  ADD COLUMN IF NOT EXISTS requester_its   text,
  ADD COLUMN IF NOT EXISTS requester_phone text,
  ADD COLUMN IF NOT EXISTS checkout_date   date;

-- Auto-generate ref if not supplied
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ref IS NULL OR NEW.ref = '' THEN
    NEW.ref := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_ref ON bookings;
CREATE TRIGGER set_booking_ref
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_ref();

-- Allow unauthenticated (public) booking submissions
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- ── MESSAGES RATE LIMIT ────────────────────────────────────────────────────────
-- Max 3 messages per ITS ID per hour

CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM messages
  WHERE sender_its_id = NEW.sender_its_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit: max 3 messages per hour per ITS ID.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;
CREATE TRIGGER enforce_message_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION check_message_rate_limit();

-- ============================================
-- 009_sehat.sql
-- ============================================
-- 009: Umoor Sehat — Ashara Ohabat Medical Camp

-- Patients registered at camp
CREATE TABLE IF NOT EXISTS sehat_patients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  its_number  text NOT NULL,
  age         int  NOT NULL CHECK (age > 0 AND age < 150),
  contact     text NOT NULL,
  camp_year   text NOT NULL DEFAULT '1448',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Per-category token counters (one row per category per camp year)
CREATE TABLE IF NOT EXISTS sehat_token_counters (
  category    text NOT NULL,
  camp_year   text NOT NULL DEFAULT '1448',
  current_no  int  NOT NULL DEFAULT 0,
  PRIMARY KEY (category, camp_year)
);

INSERT INTO sehat_token_counters (category, camp_year) VALUES
  ('ortho',       '1448'),
  ('examination', '1448'),
  ('physio',      '1448'),
  ('dental',      '1448'),
  ('other',       '1448')
ON CONFLICT DO NOTHING;

-- Medical records (1:1 with patient per camp)
CREATE TABLE IF NOT EXISTS sehat_medical_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES sehat_patients(id) ON DELETE CASCADE,

  -- Token assignments
  token_ortho               bool NOT NULL DEFAULT false,
  token_ortho_number        int,
  token_examination         bool NOT NULL DEFAULT false,
  token_examination_number  int,
  token_physio              bool NOT NULL DEFAULT false,
  token_physio_number       int,
  token_dental              bool NOT NULL DEFAULT false,
  token_dental_number       int,
  token_other               bool NOT NULL DEFAULT false,
  token_other_label         text,
  token_other_number        int,

  -- Vitals (filled by doctors at camp, blank by default)
  ecg           text,  ecg_doctor       text,
  bp            text,  bp_doctor        text,
  pulse         text,  pulse_doctor     text,
  spo2          text,  spo2_doctor      text,
  bsl           text,  bsl_doctor       text,
  height        text,
  weight        text,
  bmi           text,  bmi_doctor       text,

  -- Remarks blocks
  dental_remarks  text,  dental_doctor  text,
  ortho_remarks   text,  ortho_doctor   text,

  -- Extra remarks (page 2)
  extra_remarks   text,

  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sehat_patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sehat_token_counters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sehat_medical_records  ENABLE ROW LEVEL SECURITY;

-- Sehat uses cookie-based auth (service role key from API routes)
CREATE POLICY "sehat_patients_all"        ON sehat_patients        FOR ALL USING (true);
CREATE POLICY "sehat_counters_all"        ON sehat_token_counters  FOR ALL USING (true);
CREATE POLICY "sehat_medical_records_all" ON sehat_medical_records FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sehat_patients_camp    ON sehat_patients(camp_year);
CREATE INDEX IF NOT EXISTS idx_sehat_records_patient  ON sehat_medical_records(patient_id);

-- Atomic token assignment function
CREATE OR REPLACE FUNCTION assign_sehat_token(
  p_category  text,
  p_camp_year text
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_next int;
BEGIN
  UPDATE sehat_token_counters
    SET current_no = current_no + 1
    WHERE category = p_category AND camp_year = p_camp_year
    RETURNING current_no INTO v_next;
  IF v_next IS NULL THEN
    INSERT INTO sehat_token_counters (category, camp_year, current_no)
      VALUES (p_category, p_camp_year, 1)
      ON CONFLICT (category, camp_year)
      DO UPDATE SET current_no = sehat_token_counters.current_no + 1
      RETURNING current_no INTO v_next;
  END IF;
  RETURN v_next;
END;
$$;

