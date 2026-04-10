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
