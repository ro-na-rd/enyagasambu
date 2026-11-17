-- Store Rwandan mobile numbers in one national format (07XXXXXXXX) so a seller
-- who typed "+250 788 123 456" or "250788123456" can still open their listings.

UPDATE IGNORE users
SET phone = CONCAT('0', RIGHT(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), 9))
WHERE phone IS NOT NULL
  AND RIGHT(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), 9) REGEXP '^7[2389][0-9]{7}$'
  AND phone NOT REGEXP '^07[2389][0-9]{7}$';
