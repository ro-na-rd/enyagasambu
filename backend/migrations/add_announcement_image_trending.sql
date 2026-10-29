-- Adverts (announcements) support an optional image stored in object storage and
-- a "best trending product" flag that promotes the advert on the public page.
-- MySQL has no ADD COLUMN IF NOT EXISTS in all supported versions, so add each
-- missing column via dynamic SQL to keep this idempotent.

SET @db = DATABASE();

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'announcements' AND COLUMN_NAME = 'image_url');
SET @s := IF(@col = 0, 'ALTER TABLE announcements ADD COLUMN image_url VARCHAR(500) NULL AFTER body', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'announcements' AND COLUMN_NAME = 'is_trending');
SET @s := IF(@col = 0, 'ALTER TABLE announcements ADD COLUMN is_trending TINYINT(1) NOT NULL DEFAULT 0 AFTER is_published', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- @DOWN
ALTER TABLE announcements DROP COLUMN IF EXISTS image_url;
ALTER TABLE announcements DROP COLUMN IF EXISTS is_trending;
-- @END_DOWN
