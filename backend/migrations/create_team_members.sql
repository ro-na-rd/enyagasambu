-- Ensure the new-schema columns exist so this migration runs against any prior team_members layout.
-- MySQL 8.4 has no ADD COLUMN IF NOT EXISTS, so add each missing column via dynamic SQL.

SET @db = DATABASE();

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'category');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN category ENUM(''team'',''board'') NOT NULL DEFAULT ''team'' AFTER id', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'photo_position');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN photo_position VARCHAR(50) NOT NULL DEFAULT ''center'' AFTER photo_url', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'photo_zoom');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN photo_zoom DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER photo_position', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'updated_by');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN updated_by INT DEFAULT NULL AFTER active', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'updated_at');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'executive_role');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN executive_role VARCHAR(20) DEFAULT NULL AFTER role', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill category for any rows that predate the column (assume 'team')
UPDATE team_members SET category = 'team' WHERE category IS NULL OR category = '';

-- Dedupe rows from prior one-shot runs (no unique key existed before)
DELETE t1 FROM team_members t1
INNER JOIN team_members t2
  ON t1.category = t2.category AND t1.name = t2.name AND t1.id > t2.id;

INSERT INTO team_members (id, category, name, role, executive_role, photo_url, sort_order) VALUES
  (1, 'team', 'Sinonzon Polemon',     'Chief Executive Officer',   'CEO', '/assets/members/Co-Founder & CEO.jpeg',  1),
  (2, 'team', 'Musinguzi Ronard',     'Chief Technology Officer',  'CIO', '/assets/members/Co-Founder & CTO.png',   2),
  (3, 'team', 'Manishimwe Blaise',    'Chief Operations Officer',  'COO', '/assets/members/Co-Founder & COO.jpg',   3),
  (4, 'team', 'Kobusinge Florence',   'Chief Marketing Officer',   'CMO', '/profiles/florence.jpg', 4),
  (5, 'team', 'Tuyishime Eric',       'Chief Financial Officer',   'CFO', '/profiles/eric.jpg',     5),
  (6, 'board', 'Board Member 1', 'Chairman of the Board',  NULL, '/assets/members/Chairman of the board.jpeg', 1),
  (7, 'board', 'Board Member 2', 'Non-Executive Director', NULL, '/assets/members/Non-Executive Director.jpeg', 2),
  (8, 'board', 'Board Member 3', 'Independent Director',   NULL, '/assets/members/Independent Director1.jpeg', 3),
  (9, 'board', 'Board Member 4', 'Board Secretary',        NULL, '/assets/members/Board Secretary.jpeg', 4)
ON DUPLICATE KEY UPDATE
  category = VALUES(category),
  name = VALUES(name),
  role = VALUES(role),
  executive_role = VALUES(executive_role),
  photo_url = VALUES(photo_url),
  sort_order = VALUES(sort_order);