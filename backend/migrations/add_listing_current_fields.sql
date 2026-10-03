-- Align older local listings tables with the current single-table listing model.
-- Category-specific answers remain serialized in listings.attributes.
-- Legacy databases can have an invalid zero-date timestamp default that blocks ALTER TABLE.
ALTER TABLE listings MODIFY COLUMN expires_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'RWF' AFTER price_type;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS attributes TEXT NULL AFTER listing_type;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views INT NOT NULL DEFAULT 0 AFTER is_featured;

-- @DOWN
ALTER TABLE listings DROP COLUMN IF EXISTS views;
ALTER TABLE listings DROP COLUMN IF EXISTS attributes;
ALTER TABLE listings DROP COLUMN IF EXISTS currency;
-- @END_DOWN
