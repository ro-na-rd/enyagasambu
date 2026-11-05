CREATE TABLE IF NOT EXISTS supplier_email_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_supplier_email_otps_active (user_id, verified, expires_at),
  CONSTRAINT fk_supplier_email_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- @DOWN
DROP TABLE IF EXISTS supplier_email_otps;
-- @END_DOWN
