-- Guest auction posting is paid through the same payment pipeline as listings,
-- so the payments.type enum needs an auction value. Detect the current enum
-- definition and only ALTER when auction_token is missing to stay idempotent.

SET @db = DATABASE();

SET @needs := (SELECT COUNT(*) FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'type'
                 AND COLUMN_TYPE NOT LIKE '%auction_token%');
SET @s := IF(@needs > 0,
  "ALTER TABLE payments MODIFY COLUMN type ENUM('listing_token','contact_reveal','listing_renewal','auction_token') NOT NULL",
  'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- @DOWN
UPDATE payments SET type = 'listing_token' WHERE type = 'auction_token';
ALTER TABLE payments MODIFY COLUMN type ENUM('listing_token','contact_reveal','listing_renewal') NOT NULL;
-- @END_DOWN
