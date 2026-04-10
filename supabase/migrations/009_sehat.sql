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
