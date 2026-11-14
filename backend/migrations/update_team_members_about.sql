-- Update about page team/board seed data: co-founder images, CIO -> CTO, board images.
-- Idempotent: adds executive_role column if missing and updates existing rows.

SET @db = DATABASE();

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'executive_role');
SET @s := IF(@col = 0, 'ALTER TABLE team_members ADD COLUMN executive_role VARCHAR(20) DEFAULT NULL AFTER role', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO team_members (id, category, name, role, executive_role, photo_url, sort_order, active) VALUES
  (1, 'team', 'Sinonzon Polemon',     'Chief Executive Officer',   'CEO', '/assets/members/Co-Founder & CEO.jpeg',  1, 1),
  (2, 'team', 'Musinguzi Ronard',     'Chief Technology Officer',  'CIO', '/assets/members/Co-Founder & CTO.png',   2, 1),
  (3, 'team', 'Manishimwe Blaise',    'Chief Operations Officer',  'COO', '/assets/members/Co-Founder & COO.jpg',   3, 1),
  (4, 'team', 'Kobusinge Florence',   'Chief Marketing Officer',   'CMO', '/profiles/florence.jpg', 4, 1),
  (5, 'team', 'Tuyishime Eric',       'Chief Financial Officer',   'CFO', '/profiles/eric.jpg',     5, 1),
  (6, 'board', 'Board Member 1', 'Chairman of the Board',  NULL, '/assets/members/Chairman of the board.jpeg', 1, 1),
  (7, 'board', 'Board Member 2', 'Non-Executive Director', NULL, '/assets/members/Non-Executive Director.jpeg', 2, 1),
  (8, 'board', 'Board Member 3', 'Independent Director',   NULL, '/assets/members/Independent Director1.jpeg', 3, 1),
  (9, 'board', 'Board Member 4', 'Board Secretary',        NULL, '/assets/members/Board Secretary.jpeg', 4, 1)
ON DUPLICATE KEY UPDATE
  category = VALUES(category),
  role = VALUES(role),
  executive_role = VALUES(executive_role),
  photo_url = VALUES(photo_url),
  sort_order = VALUES(sort_order),
  active = VALUES(active);