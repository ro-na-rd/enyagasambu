USE nmo_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  coins INT DEFAULT 0,
  role ENUM('user', 'seller', 'admin', 'broker', 'ambassador', 'supplier') DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  can_post_free BOOLEAN DEFAULT FALSE,
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
  currency VARCHAR(10) DEFAULT 'RWF',
  location VARCHAR(200),
  status ENUM('active', 'expired', 'sold', 'deleted', 'disabled') DEFAULT 'active',
  listing_type ENUM('sell', 'rent', 'auction') DEFAULT 'sell',
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP NULL,
  views INT DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- auction fields
  auction_start TIMESTAMP NULL,
  minimum_increment DECIMAL(12, 2) NOT NULL DEFAULT 500.00,
  reserve_price DECIMAL(12, 2) NULL,
  anti_sniping TINYINT(1) DEFAULT 0,
  sniping_window INT DEFAULT 30,
  highest_bid DECIMAL(12, 2) NULL,
  highest_bidder_id INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (highest_bidder_id) REFERENCES users(id) ON DELETE SET NULL
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
  buyer_id INT NULL,
  listing_id INT NOT NULL,
  buyer_phone VARCHAR(20),
  expires_at TIMESTAMP NULL,
  sale_status ENUM('pending', 'sold', 'rented') DEFAULT 'pending',
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_unlock (buyer_id, listing_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  listing_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT NOT NULL,
  referred_id INT NOT NULL UNIQUE,
  bonus_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
);

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
  ('Jobs (Abasare)', 'jobs', 'service'),
  ('Food & Beverage', 'food-beverage', 'product'),
  ('Clothing', 'clothing', 'product'),
  ('Construction', 'construction', 'service'),
  ('Health', 'health', 'service'),
  ('Education', 'education', 'service'),
  ('Farmer Product', 'farmer-product', 'product'),
  ('Supply Chain', 'supply-chain', 'service');

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  token VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NULL UNIQUE,
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
  status ENUM('pending','verified','confirmed','failed','refunded') DEFAULT 'pending',
  provider_ref VARCHAR(100) UNIQUE,
  listing_id INT,
  payload TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seller_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
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
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificate_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  category ENUM('broker','ambassador','supplier') NOT NULL DEFAULT 'broker',
  price_rwf INT NOT NULL DEFAULT 2000,
  duration_years INT NOT NULL DEFAULT 1,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ambassador_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
  status ENUM('pending','paid','generated') DEFAULT 'pending',
  payment_ref VARCHAR(100) DEFAULT NULL,
  amount_rwf INT DEFAULT 2000,
  certificate_type_id INT DEFAULT NULL,
  issued_date DATE DEFAULT NULL,
  valid_until DATE DEFAULT NULL,
  generated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS broker_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
  status ENUM('pending','paid','generated') DEFAULT 'pending',
  payment_ref VARCHAR(100) DEFAULT NULL,
  amount_rwf INT DEFAULT 2000,
  certificate_type_id INT DEFAULT NULL,
  issued_date DATE DEFAULT NULL,
  valid_until DATE DEFAULT NULL,
  generated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supplier_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  photo_url VARCHAR(500) DEFAULT NULL,
  cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
  status ENUM('pending','paid','generated') DEFAULT 'pending',
  payment_ref VARCHAR(100) DEFAULT NULL,
  amount_rwf INT DEFAULT 2000,
  certificate_type_id INT DEFAULT NULL,
  issued_date DATE DEFAULT NULL,
  valid_until DATE DEFAULT NULL,
  generated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS broker_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  deals INT DEFAULT 0,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  client_id INT DEFAULT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  sender_email VARCHAR(150) DEFAULT NULL,
  sender_phone VARCHAR(30) DEFAULT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES broker_clients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
  ('posting_fee', '400'),
  ('posting_free', 'false'),
  ('auction_anti_sniping', 'false'),
  ('auction_sniping_window', '30'),
  ('auction_default_increment', '500'),
  ('listing_duration_3_days', '500'),
  ('listing_duration_7_days', '1000'),
  ('listing_duration_30_days', '3500');

CREATE TABLE IF NOT EXISTS contact_access_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  buyer_id INT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  reference_id VARCHAR(50) NOT NULL UNIQUE,
  amount_rwf INT NOT NULL DEFAULT 300,
  status ENUM('pending','verified','confirmed','failed') DEFAULT 'pending',
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP NULL,
  otp_verified BOOLEAN DEFAULT FALSE,
  otp_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS listing_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (listing_id, user_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listing_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  stars TINYINT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rating (listing_id, user_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listing_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES listing_comments(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  category ENUM('payment', 'listing', 'access', 'other') DEFAULT 'other',
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  listing_id INT NULL,
  status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS listing_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  reporter_id INT NULL,
  reason ENUM('spam', 'inappropriate', 'scam', 'misleading', 'illegal', 'other') NOT NULL,
  details TEXT,
  status ENUM('open', 'reviewing', 'actioned', 'dismissed') DEFAULT 'open',
  resolved_by INT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supplier_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  business_name VARCHAR(200),
  business_phone VARCHAR(20),
  business_location VARCHAR(200),
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  type ENUM('page', 'guide', 'faq', 'policy') DEFAULT 'page',
  content LONGTEXT,
  status ENUM('draft', 'published') DEFAULT 'draft',
  meta_description VARCHAR(500),
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS site_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_key VARCHAR(120) NOT NULL UNIQUE,
  section VARCHAR(50) NOT NULL DEFAULT 'general',
  label VARCHAR(200) NOT NULL,
  content LONGTEXT,
  status ENUM('published', 'draft') DEFAULT 'published',
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  donor_name VARCHAR(120) NOT NULL,
  donor_email VARCHAR(150),
  donor_phone VARCHAR(20),
  amount_rwf INT NOT NULL,
  method ENUM('momo', 'card') NOT NULL DEFAULT 'momo',
  provider ENUM('mtn', 'airtel', 'bank') NULL,
  status ENUM('pending', 'verified', 'confirmed', 'failed') DEFAULT 'pending',
  reference_id VARCHAR(100) UNIQUE,
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP NULL,
  otp_attempts INT DEFAULT 0,
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  staff_id INT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, is_read),
  INDEX idx_notif_staff (staff_id, is_read)
);

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  audience VARCHAR(20) DEFAULT 'all',
  is_published BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_announce_audience (audience, is_published)
);

CREATE TABLE IF NOT EXISTS auction_bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NULL,
  bidder_name VARCHAR(150) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_auction_bid_listing (listing_id, amount),
  INDEX idx_auction_bid_created (created_at)
);

CREATE TABLE IF NOT EXISTS auction_watches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_watch (listing_id, user_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
