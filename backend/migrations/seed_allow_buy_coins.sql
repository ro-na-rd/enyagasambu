INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
  ('allow_buy_coins', 'false');

-- @DOWN
DELETE FROM platform_settings WHERE setting_key = 'allow_buy_coins';
-- @END_DOWN
