-- Recycle Bin Table Migration
-- Stores deleted items temporarily before permanent deletion

CREATE TABLE IF NOT EXISTS recycle_bin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL COMMENT 'Type of item: listing, user, category, certificate, message, notification',
  item_id INT NOT NULL COMMENT 'ID of the original item',
  original_data JSON NOT NULL COMMENT 'Complete data of the original item for restoration',
  deleted_by INT NOT NULL COMMENT 'User ID who deleted the item',
  deleted_role VARCHAR(20) NOT NULL COMMENT 'Role of user who deleted the item',
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the item was deleted',
  restore_until TIMESTAMP NOT NULL COMMENT 'Auto-delete date (30 days after deletion)',
  restored_at TIMESTAMP NULL COMMENT 'When the item was restored (null if not restored)',
  permanently_deleted_at TIMESTAMP NULL COMMENT 'When the item was permanently deleted',
  INDEX idx_item_type (item_type),
  INDEX idx_item_id (item_id),
  INDEX idx_deleted_by (deleted_by),
  INDEX idx_restore_until (restore_until),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recycle bin for soft-deleted items';

-- Add deleted flags to existing tables
-- Note: Run these manually if columns don't exist, or use a migration tool

-- For users table:
-- ALTER TABLE users ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '0=active, 1=soft deleted, 2=permanently deleted';
-- ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'When the user was deleted';

-- For categories table:
-- ALTER TABLE categories ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '0=active, 1=deleted';
-- ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'When the category was deleted';

-- For broker_messages table:
-- ALTER TABLE broker_messages ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '0=active, 1=deleted';
-- ALTER TABLE broker_messages ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'When the message was deleted';

-- For listings table (if not already present):
-- ALTER TABLE listings ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '0=active, 1=deleted';
