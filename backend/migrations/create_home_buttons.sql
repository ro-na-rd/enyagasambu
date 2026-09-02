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

-- Dedupe rows from prior one-shot runs (no unique key existed before)
DELETE h1 FROM home_buttons h1
INNER JOIN home_buttons h2
  ON h1.label = h2.label AND h1.id > h2.id;

INSERT INTO home_buttons (id, label, href, sort_order) VALUES
  (1, 'Buyer Registration', '/register', 1),
  (2, 'Supplier Registration', '/register', 2),
  (3, 'Ambassador Portal', '/ambassador/register', 3),
  (4, 'Broker Portal', '/broker/register', 4),
  (5, 'Donate / Support', '/donate', 5)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  href = VALUES(href),
  sort_order = VALUES(sort_order);