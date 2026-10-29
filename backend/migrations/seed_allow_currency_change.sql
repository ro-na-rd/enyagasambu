INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
  ('allow_currency_change', 'false');

-- @DOWN
DELETE FROM platform_settings WHERE setting_key = 'allow_currency_change';
-- @END_DOWN
