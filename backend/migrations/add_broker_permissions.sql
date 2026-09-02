/**
 * Broker Role Definition - E-Nyagasambu
 * 
 * Maps broker responsibilities to module-level permissions.
 * Follows the same pattern as executive_permissions but for broker role.
 * 
 * Usage: 
 * - Define in database: INSERT INTO broker_permissions (role, module, action) VALUES ...
 * - Check via: SELECT * FROM broker_permissions WHERE role = 'broker' AND module = 'products' AND action = 'view'
 * - Frontend: Use with requireBrokerRole(allowedRoles) middleware or client-side checks
 */

-- Broker Permissions Table Schema
CREATE TABLE IF NOT EXISTS broker_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('broker') DEFAULT 'broker',
  module VARCHAR(50) NOT NULL, -- 'products', 'properties', 'vehicles', 'verification', 'support', 'dashboard', 'certificates', 'clients', 'listings', 'commissions', 'leads', 'messages', 'reports', 'settings'
  action ENUM('view', 'create', 'edit', 'delete', 'approve', 'export') DEFAULT 'view',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_broker_permission (role, module, action)
);

-- Insert default broker permissions for all 5 responsibilities + core modules
INSERT IGNORE INTO broker_permissions (role, module, action) VALUES
-- Core Dashboard access
('broker', 'dashboard', 'view'),
('broker', 'settings', 'view'),

-- 5 Broker Responsibilities (Authorized Services)
('broker', 'products', 'view'),
('broker', 'products', 'create'),
('broker', 'products', 'edit'),
('broker', 'properties', 'view'),
('broker', 'properties', 'create'),
('broker', 'properties', 'edit'),
('broker', 'vehicles', 'view'),
('broker', 'vehicles', 'create'),
('broker', 'vehicles', 'edit'),
('broker', 'verification', 'view'),
('broker', 'verification', 'approve'),
('broker', 'support', 'view'),
('broker', 'support', 'create'),

-- Broker-specific modules
('broker', 'clients', 'view'),
('broker', 'clients', 'create'),
('broker', 'clients', 'edit'),
('broker', 'clients', 'delete'),
('broker', 'listings', 'view'),
('broker', 'listings', 'create'),
('broker', 'listings', 'edit'),
('broker', 'listings', 'delete'),
('broker', 'commissions', 'view'),
('broker', 'leads', 'view'),
('broker', 'messages', 'view'),
('broker', 'messages', 'create'),
('broker', 'messages', 'edit'),
('broker', 'messages', 'delete'),
('broker', 'reports', 'view'),
('broker', 'settings', 'manage');