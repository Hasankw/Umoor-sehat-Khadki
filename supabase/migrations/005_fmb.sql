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
