CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('team','board') NOT NULL DEFAULT 'team',
  name VARCHAR(200) NOT NULL,
  role VARCHAR(200) NOT NULL DEFAULT '',
  photo_url VARCHAR(500) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_team_category (category),
  INDEX idx_team_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO team_members (category, name, role, photo_url, sort_order) VALUES
  ('team', 'Sinonzon Polemon',     'Chief Executive Officer',   '/polemon.jpg',  1),
  ('team', 'Musinguzi Ronard',      'Chief Information Officer', '/ronard.jpg',   2),
  ('team', 'Manishimwe Blaise',     'Chief Operations Officer',  '/blaise.jpg',   3),
  ('team', 'Kobusinge Florence',    'Chief Marketing Officer',   '/florence.jpg', 4),
  ('team', 'Tuyishime Eric',        'Chief Financial Officer',   '/eric.jpg',     5),
  ('board', 'Board Member 1', 'Chairman of the Board',  NULL, 1),
  ('board', 'Board Member 2', 'Non-Executive Director', NULL, 2),
  ('board', 'Board Member 3', 'Independent Director',   NULL, 3),
  ('board', 'Board Member 4', 'Board Secretary',        NULL, 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);