-- Admin approval routes a request to a Tax Advisory Client Support Specialist.
ALTER TABLE advisory_requests
  MODIFY COLUMN status ENUM('new','under_review','approved','awaiting_documents','scheduled','in_progress','resolved','closed') NOT NULL DEFAULT 'new';

ALTER TABLE advisory_requests
  ADD COLUMN IF NOT EXISTS approved_by INT NULL AFTER assigned_to;

ALTER TABLE advisory_requests
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL AFTER approved_by;

ALTER TABLE advisory_requests
  ADD INDEX IF NOT EXISTS idx_advisory_requests_assignment (assigned_to, status, created_at);

ALTER TABLE advisory_requests
  ADD CONSTRAINT fk_advisory_requests_approved_by FOREIGN KEY (approved_by) REFERENCES staff(id) ON DELETE SET NULL;