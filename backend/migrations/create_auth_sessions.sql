CREATE TABLE IF NOT EXISTS auth_sessions (
  id CHAR(36) PRIMARY KEY,
  refresh_token_hash CHAR(64) NOT NULL UNIQUE,
  claims JSON NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,
  INDEX idx_auth_sessions_refresh (refresh_token_hash),
  INDEX idx_auth_sessions_expiry (expires_at)
) ENGINE=InnoDB;

-- @DOWN
DROP TABLE IF EXISTS auth_sessions;
-- @END_DOWN
