-- Per-category posting details.
-- Each category can define its own extra fields (brand, mileage, bedrooms, ...)
-- and a listing stores the answers for its category in listings.attributes.

CREATE TABLE IF NOT EXISTS category_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  label VARCHAR(150) NOT NULL,
  field_type ENUM('text', 'textarea', 'number', 'select', 'boolean') NOT NULL DEFAULT 'text',
  options TEXT NULL,
  placeholder VARCHAR(200) NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_category_field_key (category_id, field_key),
  INDEX idx_category_fields_order (category_id, sort_order, id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS attributes TEXT NULL;

-- @DOWN
ALTER TABLE listings DROP COLUMN IF EXISTS attributes;
DROP TABLE IF EXISTS category_fields;
-- @END_DOWN