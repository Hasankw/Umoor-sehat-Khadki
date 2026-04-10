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
