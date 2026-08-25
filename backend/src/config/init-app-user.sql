-- Create application user with minimal privileges
-- This is automatically run by MariaDB on first container start
-- The MYSQL_USER and MYSQL_PASSWORD env vars create the user automatically
-- This script just grants the correct permissions

GRANT SELECT, INSERT, UPDATE, DELETE ON nmo_db.* TO 'nmo_app'@'%';
FLUSH PRIVILEGES;

-- Note: The app does NOT need CREATE, ALTER, DROP, or INDEX privileges.
-- Schema changes should be done via migration scripts with root access.
