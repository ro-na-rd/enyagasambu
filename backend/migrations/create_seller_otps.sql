-- Seller OTP codes for phone-only My Listings access.
CREATE TABLE IF NOT EXISTS seller_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seller_otps_phone (phone),
  INDEX idx_seller_otps_user_used (user_id, used, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- @DOWN
DROP TABLE IF EXISTS seller_otps;
-- @END_DOWN
