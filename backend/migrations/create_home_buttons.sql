CREATE TABLE IF NOT EXISTS home_buttons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  href VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_home_buttons_active (active),
  INDEX idx_home_buttons_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO home_buttons (label, href, sort_order) VALUES
  ('Buyer Registration', '/register', 1),
  ('Supplier Registration', '/register', 2),
  ('Ambassador Portal', '/ambassador/register', 3),
  ('Broker Portal', '/broker/register', 4),
  ('Donate / Support', '/donate', 5)
ON DUPLICATE KEY UPDATE label = VALUES(label);