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
