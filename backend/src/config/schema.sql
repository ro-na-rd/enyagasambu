USE nmo_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  coins INT DEFAULT 0,
  role ENUM('user', 'seller', 'admin', 'broker', 'ambassador') DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  referral_code VARCHAR(20) UNIQUE,
  referred_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('product', 'rental_property', 'rental_vehicle', 'service') NOT NULL,
  icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2),
  price_type ENUM('fixed', 'negotiable', 'per_day', 'per_month') DEFAULT 'fixed',
  location VARCHAR(200),
  status ENUM('active', 'expired', 'sold', 'deleted', 'disabled') DEFAULT 'active',
  listing_type ENUM('sell', 'rent') DEFAULT 'sell',
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS listing_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  type ENUM('purchase', 'listing_fee', 'connect_fee', 'refund', 'referral_bonus', 'boost_fee', 'subscription_fee') NOT NULL,
  reference VARCHAR(100),
  listing_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  listing_id INT NOT NULL,
  buyer_phone VARCHAR(20),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_unlock (buyer_id, listing_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- MTN MoMo pending payments (track before confirmation)
CREATE TABLE IF NOT EXISTS momo_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reference_id VARCHAR(50) NOT NULL UNIQUE,
  package_id INT NOT NULL,
  coins INT NOT NULL,
  amount_rwf INT NOT NULL,
  status ENUM('pending', 'successful', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OTP codes for verifying buyer phone before connecting
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  listing_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Seller subscription plans
CREATE TABLE IF NOT EXISTS seller_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  plan ENUM('free', 'standard', 'premium') DEFAULT 'free',
  listing_duration_days INT DEFAULT 3,
  max_active_listings INT DEFAULT 5,
  can_feature BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT NOT NULL,
  referred_id INT NOT NULL UNIQUE,
  bonus_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Discount / promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  discount_coins INT NOT NULL,
  max_uses INT DEFAULT 100,
  uses INT DEFAULT 0,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO categories (name, slug, type) VALUES
  ('Electronics', 'electronics', 'product'),
  ('Fashion', 'fashion', 'product'),
  ('Furniture', 'furniture', 'product'),
  ('Beauty & Health', 'beauty-health', 'product'),
  ('Books', 'books', 'product'),
  ('Handcraft', 'handcraft', 'product'),
  ('Houses & Apartments', 'houses-apartments', 'rental_property'),
  ('Offices', 'offices', 'rental_property'),
  ('Cars', 'cars', 'rental_vehicle'),
  ('Motorcycles', 'motorcycles', 'rental_vehicle'),
  ('Transport Services', 'transport', 'service'),
  ('Technician Services', 'technicians', 'service'),
  ('Mechanical Services', 'mechanical', 'service'),
  ('Gardening Services', 'gardening', 'service'),
  ('Arts & Tourism', 'arts-tourism', 'service'),
  ('Jobs (Abasare)', 'jobs', 'service');

-- Additional schema tables needed to support the specification
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('admin','moderator') DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS contact_reveals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  payment_ref VARCHAR(100) NOT NULL,
  amount_rwf INT NOT NULL,
  revealed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reveal (listing_id, buyer_phone),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('listing_token','contact_reveal','listing_renewal') NOT NULL,
  phone VARCHAR(20),
  provider ENUM('mtn','airtel','bank') NOT NULL,
  amount_rwf INT NOT NULL,
  status ENUM('pending','confirmed','failed','refunded') DEFAULT 'pending',
  provider_ref VARCHAR(100),
  listing_id INT,
  payload TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS seller_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Ambassador certificate requests
CREATE TABLE IF NOT EXISTS ambassador_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
  status ENUM('pending','paid','generated') DEFAULT 'pending',
  payment_ref VARCHAR(100) DEFAULT NULL,
  amount_rwf INT DEFAULT 2000,
  issued_date DATE DEFAULT NULL,
  valid_until DATE DEFAULT NULL,
  generated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- Broker certificate requests
CREATE TABLE IF NOT EXISTS broker_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
  status ENUM('pending','paid','generated') DEFAULT 'pending',
  payment_ref VARCHAR(100) DEFAULT NULL,
  amount_rwf INT DEFAULT 2000,
  issued_date DATE DEFAULT NULL,
  valid_until DATE DEFAULT NULL,
  generated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
  ('posting_fee', '400'),
  ('posting_free', 'false');

CREATE TABLE IF NOT EXISTS renewal_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  seller_phone VARCHAR(20) NOT NULL,
  token VARCHAR(12) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_token (listing_id, token),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);
