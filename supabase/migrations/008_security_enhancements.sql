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
