-- Daily KPI snapshots so trend history does not depend on re-scanning OLTP tables.
-- Populated by: node src/scripts/snapshotReport.js (see "snapshot" npm script).

CREATE TABLE IF NOT EXISTS report_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  period VARCHAR(20) NOT NULL DEFAULT 'day',
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_report_snapshot (snapshot_date, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;