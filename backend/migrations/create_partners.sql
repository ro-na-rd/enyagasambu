CREATE TABLE IF NOT EXISTS partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  logo_url VARCHAR(500) NULL,
  website_url VARCHAR(500) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_partners_public (active, sort_order, id)
);

INSERT INTO partners (name, logo_url, sort_order)
SELECT 'Kigali Business Lab', '/partners/kbl.png', 1
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name = 'Kigali Business Lab');
