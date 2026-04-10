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
