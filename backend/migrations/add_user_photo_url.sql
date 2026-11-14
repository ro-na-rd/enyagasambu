-- Add profile photo to users so the account dashboard and navbar can show avatars.
-- Idempotent: MySQL 8.4 has no ADD COLUMN IF NOT EXISTS, so add via dynamic SQL.

SET @db = DATABASE();

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'photo_url');
SET @s := IF(@col = 0, 'ALTER TABLE users ADD COLUMN photo_url VARCHAR(512) DEFAULT NULL AFTER phone', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
