-- Reserved for sponsored posts published by an administrator.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_advert TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured;
ALTER TABLE listings ADD INDEX IF NOT EXISTS idx_listings_advert_active (is_advert, status, expires_at);

-- @DOWN
ALTER TABLE listings DROP INDEX IF EXISTS idx_listings_advert_active;
ALTER TABLE listings DROP COLUMN IF EXISTS is_advert;
-- @END_DOWN
