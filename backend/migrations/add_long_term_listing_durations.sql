INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
  ('listing_duration_60_days', '6500'),
  ('listing_duration_90_days', '9000'),
  ('listing_duration_180_days', '17000'),
  ('listing_duration_365_days', '32000');

-- @DOWN
DELETE FROM platform_settings WHERE setting_key IN (
  'listing_duration_60_days',
  'listing_duration_90_days',
  'listing_duration_180_days',
  'listing_duration_365_days'
);
-- @END_DOWN
