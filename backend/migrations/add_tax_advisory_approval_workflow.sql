-- Admin approval routes a request to a Tax Advisory Client Support Specialist.
ALTER TABLE advisory_requests
  MODIFY COLUMN status ENUM('new','under_review','approved','awaiting_documents','scheduled','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
  ADD COLUMN approved_by INT NULL AFTER assigned_to,
  ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by,
  ADD INDEX idx_advisory_requests_assignment (assigned_to, status, created_at),
  ADD CONSTRAINT fk_advisory_requests_approved_by FOREIGN KEY (approved_by) REFERENCES staff(id) ON DELETE SET NULL;
