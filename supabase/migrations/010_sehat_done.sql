-- 010: Sehat — add per-category completion tracking

ALTER TABLE sehat_medical_records
  ADD COLUMN IF NOT EXISTS ortho_done        bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS examination_done  bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS physio_done       bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dental_done       bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS other_done        bool NOT NULL DEFAULT false;
