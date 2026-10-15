const TAX_SERVICES = [
  'tax_registration',
  'tax_compliance_review',
  'income_tax',
  'corporate_income_tax',
  'paye',
  'vat',
  'withholding_tax',
  'excise_duty',
  'rental_income_tax',
  'property_tax',
  'trading_licence',
  'capital_gains_property',
  'tax_planning',
  'tax_computation',
  'tax_return_prep',
  'tax_clearance',
  'tax_audit_support',
  'tax_debt_penalty',
  'rra_notice_response',
  'objection_appeal',
  'business_restructuring',
  'import_export_tax',
  'other',
];

const CUSTOMER_TYPES = ['individual', 'business'];
const COMM_METHODS = ['phone_call', 'whatsapp', 'email', 'in_person', 'video'];
const URGENCY_LEVELS = ['general', 'one_week', 'three_days', 'urgent'];
const CONSULT_CHANNELS = ['phone', 'video', 'whatsapp', 'email', 'in_person', 'written_opinion', 'ongoing_monthly', 'one_time'];
const BUSINESS_TYPES = ['individual_enterprise', 'partnership', 'company', 'non_profit', 'other'];
const ISSUE_STAGES = ['new', 'ongoing'];
const PENDING_MATTERS = ['none', 'audit', 'assessment', 'penalty', 'objection', 'appeal'];
const DISPUTE_KINDS = ['none', 'disagreement', 'penalty', 'audit', 'compliance_risk'];
const REQUEST_STATUSES = ['new', 'under_review', 'awaiting_documents', 'scheduled', 'in_progress', 'resolved', 'closed'];
const RECORD_TYPES = [
  'monthly_quarterly_records',
  'sales_purchases',
  'payroll_records',
  'invoices_receipts',
  'bank_statements',
  'prior_tax_returns',
];

const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

const MAX_LENGTHS = {
  fullName: 150,
  preferredName: 100,
  phone: 32,
  email: 150,
  city: 100,
  district: 100,
  businessName: 150,
  tradingName: 150,
  taxpayerId: 50,
  industry: 120,
  businessLocation: 150,
  contactPerson: 150,
  contactPersonRole: 100,
  otherAdvisor: 150,
  currentAdvisor: 150,
  accountingSystem: 100,
  taxPeriod: 40,
  amountInvolved: 40,
  preferredDates: 120,
  preferredTime: 60,
  timezone: 40,
  meetingLocation: 150,
  accessibilityNeeds: 200,
  financialYearEnd: 40,
  bestTimeContact: 100,
  otherService: 200,
};

function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function boolOrNull(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

function dateOrNull(value) {
  const v = str(value);
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return v;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^\+?[0-9][0-9\s\-()]{6,24}$/.test(value);
}

function inList(list, value) {
  return list.includes(value);
}

function tooLong(errors, field, value) {
  const max = MAX_LENGTHS[field];
  if (max && str(value).length > max) {
    errors.push(`${field} must be at most ${max} characters`);
  }
}

function isAllowedFile(file) {
  if (!file) return false;
  const ext = ALLOWED_FILE_TYPES[file.mimetype];
  if (!ext) return false;
  const name = (file.originalname || '').toLowerCase();
  if (!ext.some((e) => name.endsWith(e))) return false;
  if (!file.size || file.size > MAX_FILE_SIZE) return false;
  return true;
}

function validateTaxAdvisoryRequest(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body is required'];
  }

  const customerType = str(body.customerType);
  if (!inList(CUSTOMER_TYPES, customerType)) {
    errors.push('Customer type must be individual or business');
  }

  const fullName = str(body.fullName);
  if (!fullName) errors.push('Full name is required');
  const phone = str(body.phone);
  if (!phone) errors.push('Phone number is required');
  else if (!isPhone(phone)) errors.push('Phone number is invalid');
  const email = str(body.email);
  if (!email) errors.push('Email address is required');
  else if (!isEmail(email)) errors.push('Email address is invalid');

  if (customerType === 'business') {
    if (!str(body.businessName)) errors.push('Registered business name is required for business requests');
    if (!str(body.contactPerson)) errors.push('Contact person is required for business requests');
    if (boolOrNull(body.isAuthorized) !== true) {
      errors.push('Authorization declaration is required for business requests');
    }
    if (body.businessType && !inList(BUSINESS_TYPES, str(body.businessType))) {
      errors.push('Invalid business type');
    }
    const employees = str(body.employeeCount);
    if (employees && (!/^\d{1,7}$/.test(employees) || Number(employees) < 0)) {
      errors.push('Employee count must be a whole number');
    }
    if (body.businessStartDate && !dateOrNull(body.businessStartDate)) {
      errors.push('Business start date is invalid');
    }
  }

  if (body.commMethod && !inList(COMM_METHODS, str(body.commMethod))) {
    errors.push('Invalid communication method');
  }

  const services = Array.isArray(body.services)
    ? body.services.map((s) => str(s)).filter(Boolean)
    : [];
  if (services.length === 0) errors.push('Select at least one tax service');
  if (services.length > 15) errors.push('Too many services selected');
  for (const s of services) {
    if (!inList(TAX_SERVICES, s)) {
      errors.push(`Invalid tax service: ${s}`);
      break;
    }
  }
  if (services.includes('other') && !str(body.otherService)) {
    errors.push('Please describe the service you need');
  }

  const description = str(body.description);
  if (!description) errors.push('Please describe the tax issue or question');
  else if (description.length < 20) errors.push('Please provide more detail (at least 20 characters)');

  const taxPeriod = str(body.taxPeriod);
  if (!taxPeriod) errors.push('Tax period or financial year is required');

  if (body.issueStage && !inList(ISSUE_STAGES, str(body.issueStage))) {
    errors.push('Invalid issue stage');
  }
  if (body.disputeKind && !inList(DISPUTE_KINDS, str(body.disputeKind))) {
    errors.push('Invalid dispute type');
  }
  if (body.pendingMatter && !inList(PENDING_MATTERS, str(body.pendingMatter))) {
    errors.push('Invalid pending matter');
  }

  const urgency = str(body.urgency) || 'general';
  if (!inList(URGENCY_LEVELS, urgency)) errors.push('Invalid urgency level');

  if (body.hasFilingDeadline) {
    if (!dateOrNull(body.filingDeadline)) errors.push('Filing deadline date is required and must be valid');
  }
  if (body.hasRraNotice) {
    if (!dateOrNull(body.noticeDeadline)) errors.push('Notice response deadline is required and must be valid');
  }

  if (body.consultationChannel && !inList(CONSULT_CHANNELS, str(body.consultationChannel))) {
    errors.push('Invalid consultation channel');
  }
  if (!str(body.consultationChannel)) errors.push('Preferred consultation channel is required');

  const records = Array.isArray(body.recordsAvailable) ? body.recordsAvailable : [];
  for (const r of records) {
    if (!inList(RECORD_TYPES, str(r))) {
      errors.push(`Invalid record type: ${r}`);
      break;
    }
  }

  if (boolOrNull(body.consentProcess) !== true) {
    errors.push('Consent to process your request is required');
  }
  if (boolOrNull(body.accuracyConfirmed) !== true) {
    errors.push('Please confirm the information is accurate');
  }

  for (const field of Object.keys(MAX_LENGTHS)) {
    tooLong(errors, field, body[field]);
  }

  return errors;
}

module.exports = {
  TAX_SERVICES,
  CUSTOMER_TYPES,
  COMM_METHODS,
  URGENCY_LEVELS,
  CONSULT_CHANNELS,
  BUSINESS_TYPES,
  ISSUE_STAGES,
  PENDING_MATTERS,
  DISPUTE_KINDS,
  REQUEST_STATUSES,
  RECORD_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
  validateTaxAdvisoryRequest,
  isAllowedFile,
  str,
  boolOrNull,
  dateOrNull,
};
