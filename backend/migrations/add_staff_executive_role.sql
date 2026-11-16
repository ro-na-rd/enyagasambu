-- staff.executive_role is read by admin login and executive permission checks.
-- MySQL 8.4 has no ADD COLUMN IF NOT EXISTS, so add it via dynamic SQL.

SET @db = DATABASE();

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'executive_role');
SET @s := IF(@col = 0, 'ALTER TABLE staff ADD COLUMN executive_role VARCHAR(50) DEFAULT NULL AFTER role', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
