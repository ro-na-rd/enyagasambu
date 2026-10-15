-- Public tax-advisory intake: triage requests from the /tax-advisory form.
CREATE TABLE IF NOT EXISTS advisory_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(24) NOT NULL UNIQUE,
  customer_type ENUM('individual','business') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  preferred_name VARCHAR(100) NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(150) NOT NULL,
  city VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  comm_method VARCHAR(24) NULL,
  preferred_language VARCHAR(24) NULL,
  best_time_contact VARCHAR(100) NULL,
  business_name VARCHAR(150) NULL,
  trading_name VARCHAR(150) NULL,
  taxpayer_id VARCHAR(50) NULL,
  business_type VARCHAR(32) NULL,
  industry VARCHAR(120) NULL,
  business_location VARCHAR(150) NULL,
  employee_count INT NULL,
  financial_year_end VARCHAR(40) NULL,
  business_start_date DATE NULL,
  contact_person VARCHAR(150) NULL,
  contact_person_role VARCHAR(100) NULL,
  is_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  desired_outcome TEXT NULL,
  background TEXT NULL,
  issue_stage VARCHAR(24) NULL,
  contacted_rra BOOLEAN NULL,
  dispute_kind VARCHAR(32) NULL,
  tax_period VARCHAR(40) NOT NULL,
  amount_involved VARCHAR(40) NULL,
  specific_questions TEXT NULL,
  existing_client BOOLEAN NULL,
  other_advisor VARCHAR(150) NULL,
  consent_contact_third_party BOOLEAN NOT NULL DEFAULT FALSE,
  has_filing_deadline BOOLEAN NOT NULL DEFAULT FALSE,
  filing_deadline DATE NULL,
  has_rra_notice BOOLEAN NOT NULL DEFAULT FALSE,
  notice_received_date DATE NULL,
  notice_deadline DATE NULL,
  pending_matter VARCHAR(32) NULL,
  urgency VARCHAR(32) NOT NULL DEFAULT 'general',
  rra_registered BOOLEAN NULL,
  has_tin BOOLEAN NULL,
  vat_registered BOOLEAN NULL,
  paye_registered BOOLEAN NULL,
  declarations_current BOOLEAN NULL,
  unpaid_taxes BOOLEAN NULL,
  has_assessment BOOLEAN NULL,
  previous_objection BOOLEAN NULL,
  current_advisor VARCHAR(150) NULL,
  books_available BOOLEAN NULL,
  accounting_system VARCHAR(100) NULL,
  records_available TEXT NULL,
  planned_documents TEXT NULL,
  consultation_channel VARCHAR(32) NULL,
  preferred_dates VARCHAR(120) NULL,
  preferred_time VARCHAR(60) NULL,
  timezone VARCHAR(40) NULL,
  meeting_location VARCHAR(150) NULL,
  accessibility_needs VARCHAR(200) NULL,
  consent_process BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  consent_policy_version VARCHAR(20) NULL,
  consent_ip VARCHAR(45) NULL,
  consent_at TIMESTAMP NULL,
  status ENUM('new','under_review','awaiting_documents','scheduled','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
  assigned_to INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_advisory_requests_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Services selected on the request (multi-select).
CREATE TABLE IF NOT EXISTS advisory_request_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  service VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_advisory_request_service (request_id, service),
  FOREIGN KEY (request_id) REFERENCES advisory_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional documents uploaded with the initial enquiry.
CREATE TABLE IF NOT EXISTS advisory_request_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES advisory_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Status workflow audit trail.
CREATE TABLE IF NOT EXISTS advisory_request_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status VARCHAR(32) NOT NULL,
  note VARCHAR(500) NULL,
  changed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES advisory_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- @DOWN
DROP TABLE IF EXISTS advisory_request_status_history;
DROP TABLE IF EXISTS advisory_request_documents;
DROP TABLE IF EXISTS advisory_request_services;
DROP TABLE IF EXISTS advisory_requests;
-- @END_DOWN
