USE nmo_db;

-- Ambassador promotions tracking
CREATE TABLE IF NOT EXISTS ambassador_promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  platform ENUM('whatsapp', 'facebook', 'twitter', 'instagram', 'email', 'sms', 'copy_link', 'other') NOT NULL,
  content TEXT,
  shares INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_promo_user (user_id)
);

-- Promotion shares tracking
CREATE TABLE IF NOT EXISTS promotion_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promotion_id INT NOT NULL,
  user_id INT NOT NULL,
  platform VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES ambassador_promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ambassador recruitments tracking
CREATE TABLE IF NOT EXISTS ambassador_recruitments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(20),
  type ENUM('supplier', 'vendor', 'user') NOT NULL DEFAULT 'supplier',
  status ENUM('pending', 'contacted', 'interested', 'onboarded', 'declined') DEFAULT 'pending',
  notes TEXT,
  recruited_user_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recruited_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_recruit_user (user_id)
);

-- Ambassador campaigns
CREATE TABLE IF NOT EXISTS ambassador_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_audience VARCHAR(100) DEFAULT 'general',
  status ENUM('draft', 'active', 'completed', 'paused') DEFAULT 'draft',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_campaign_user (user_id)
);

-- Campaign actions tracking
CREATE TABLE IF NOT EXISTS campaign_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  user_id INT NOT NULL,
  action_type VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES ambassador_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ambassador onboarding tasks
CREATE TABLE IF NOT EXISTS ambassador_onboarding_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  completed TINYINT(1) DEFAULT 0,
  completed_at TIMESTAMP NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_onboard_user (user_id)
);

-- Ambassador settings
CREATE TABLE IF NOT EXISTS ambassador_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notification_prefs JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ambassador policies
CREATE TABLE IF NOT EXISTS ambassador_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Policy acknowledgments
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ambassador_id INT NOT NULL,
  policy_id INT NOT NULL,
  acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (ambassador_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (policy_id) REFERENCES ambassador_policies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_acknowledgment (ambassador_id, policy_id)
);

-- Insert default policies
INSERT IGNORE INTO ambassador_policies (title, description, content, version) VALUES
('Ambassador Code of Conduct', 'Professional behavior standards for ambassadors', 'Ambassadors must maintain professional conduct at all times. This includes being respectful, honest, and transparent in all interactions.', '1.0'),
('Promotion Guidelines', 'Rules for promoting E-Nyagasambu services', 'All promotional activities must be accurate, non-deceptive, and compliant with local regulations. Ambassadors must not make false claims about the platform.', '1.0'),
('Recruitment Ethics', 'Ethical standards for recruiting suppliers and vendors', 'Recruitment must be conducted ethically. Ambassadors must not pressure or mislead potential recruits about the benefits or requirements of the platform.', '1.0'),
('Data Privacy', 'Handling user and platform data', 'Ambassadors must protect all user data and not share personal information without consent. All data handling must comply with privacy regulations.', '1.0'),
('Termination Policy', 'Conditions for program termination', 'Ambassadors may be terminated for violations of policies, unprofessional conduct, or failure to meet performance standards.', '1.0');
