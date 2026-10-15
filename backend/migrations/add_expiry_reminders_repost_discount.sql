ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS reminder_6h_sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS sale_reported_at TIMESTAMP NULL;

INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
  ('repost_discount_percent', '0');

-- @DOWN
ALTER TABLE listings
  DROP COLUMN IF EXISTS reminder_6h_sent_at,
  DROP COLUMN IF EXISTS reminder_2h_sent_at,
  DROP COLUMN IF EXISTS sale_reported_at;
DELETE FROM platform_settings WHERE setting_key = 'repost_discount_percent';
-- @END_DOWN
