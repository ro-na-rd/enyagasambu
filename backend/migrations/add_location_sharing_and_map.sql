-- Migration for location sharing and Rwanda map coordinates on listings
CREATE TABLE IF NOT EXISTS location_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sharing_id VARCHAR(50) NOT NULL UNIQUE,
  recipient_phone VARCHAR(20) NOT NULL,
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(10, 8) NOT NULL,
  dest_lat DECIMAL(10, 8) NOT NULL,
  dest_lng DECIMAL(10, 8) NOT NULL,
  travel_modes TEXT NOT NULL, -- JSON array of travel modes (DRIVE, TWO_WHEELER, BICYCLE, WALK)
  channel VARCHAR(20) DEFAULT 'WHATSAPP',
  status VARCHAR(50) DEFAULT 'QUEUED_FOR_WHATSAPP_DELIVERY',
  routes_json TEXT NULL, -- cached route calculation results
  opened_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add latitude, longitude and map address fields to listings if not present
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 8) NULL,
  ADD COLUMN IF NOT EXISTS map_address VARCHAR(255) NULL;
