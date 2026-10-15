const crypto = require('crypto');
const pool = require('../config/db');
const { logger } = require('../config/logger');
const { notifyAdmins } = require('../services/notificationService');
const { uploadPrivateToS3, getPrivateObject } = require('../services/s3Service');
const V = require('../utils/taxAdvisoryValidation');

const POLICY_VERSION = 'v1.0';

function getPayload(req) {
  if (req.is('multipart/form-data')) {
    try {
      return JSON.parse(req.body.payload || '{}');
    } catch {
      return {};
    }
  }
  return req.body || {};
}

function intOrNull(value) {
  const v = V.str(value);
  if (!/^\d{1,7}$/.test(v)) return null;
  return Number(v);
}

function buildRow(body) {
  return {
    customer_type: V.str(body.customerType),
    full_name: V.str(body.fullName),
    preferred_name: V.str(body.preferredName) || null,
    phone: V.str(body.phone),
    email: V.str(body.email),
    city: V.str(body.city) || null,
    district: V.str(body.district) || null,
    comm_method: V.str(body.commMethod) || null,
    preferred_language: V.str(body.preferredLanguage) || null,
    best_time_contact: V.str(body.bestTimeContact) || null,
    business_name: V.str(body.businessName) || null,
    trading_name: V.str(body.tradingName) || null,
    taxpayer_id: V.str(body.taxpayerId) || null,
    business_type: V.str(body.businessType) || null,
    industry: V.str(body.industry) || null,
    business_location: V.str(body.businessLocation) || null,
    employee_count: intOrNull(body.employeeCount),
    financial_year_end: V.str(body.financialYearEnd) || null,
    business_start_date: V.dateOrNull(body.businessStartDate),
    contact_person: V.str(body.contactPerson) || null,
    contact_person_role: V.str(body.contactPersonRole) || null,
    is_authorized: V.boolOrNull(body.isAuthorized) === true,
    description: V.str(body.description),
    desired_outcome: V.str(body.desiredOutcome) || null,
    background: V.str(body.background) || null,
    issue_stage: V.str(body.issueStage) || null,
    contacted_rra: V.boolOrNull(body.contactedRra),
    dispute_kind: V.str(body.disputeKind) || null,
    tax_period: V.str(body.taxPeriod),
    amount_involved: V.str(body.amountInvolved) || null,
    specific_questions: V.str(body.specificQuestions) || null,
    existing_client: V.boolOrNull(body.existingClient),
    other_advisor: V.str(body.otherAdvisor) || null,
    consent_contact_third_party: V.boolOrNull(body.consentContactThirdParty) === true,
    has_filing_deadline: V.boolOrNull(body.hasFilingDeadline) === true,
    filing_deadline: V.dateOrNull(body.filingDeadline),
    has_rra_notice: V.boolOrNull(body.hasRraNotice) === true,
    notice_received_date: V.dateOrNull(body.noticeReceivedDate),
    notice_deadline: V.dateOrNull(body.noticeDeadline),
    pending_matter: V.str(body.pendingMatter) || null,
    urgency: V.str(body.urgency) || 'general',
    rra_registered: V.boolOrNull(body.rraRegistered),
    has_tin: V.boolOrNull(body.hasTin),
    vat_registered: V.boolOrNull(body.vatRegistered),
    paye_registered: V.boolOrNull(body.payeRegistered),
    declarations_current: V.boolOrNull(body.declarationsCurrent),
    unpaid_taxes: V.boolOrNull(body.unpaidTaxes),
    has_assessment: V.boolOrNull(body.hasAssessment),
    previous_objection: V.boolOrNull(body.previousObjection),
    current_advisor: V.str(body.currentAdvisor) || null,
    books_available: V.boolOrNull(body.booksAvailable),
    accounting_system: V.str(body.accountingSystem) || null,
    records_available: Array.isArray(body.recordsAvailable) && body.recordsAvailable.length
      ? JSON.stringify(body.recordsAvailable.map((r) => V.str(r)).filter(Boolean))
      : null,
    planned_documents: Array.isArray(body.plannedDocuments) && body.plannedDocuments.length
      ? JSON.stringify(body.plannedDocuments.map((d) => V.str(d)).filter(Boolean))
      : null,
    consultation_channel: V.str(body.consultationChannel),
    preferred_dates: V.str(body.preferredDates) || null,
    preferred_time: V.str(body.preferredTime) || null,
    timezone: V.str(body.timezone) || null,
    meeting_location: V.str(body.meetingLocation) || null,
    accessibility_needs: V.str(body.accessibilityNeeds) || null,
    consent_process: V.boolOrNull(body.consentProcess) === true,
    consent_marketing: V.boolOrNull(body.consentMarketing) === true,
    consent_whatsapp: V.boolOrNull(body.consentWhatsapp) === true,
    consent_policy_version: POLICY_VERSION,
    consent_ip: null,
    consent_at: new Date(),
    status: 'new',
    assigned_to: null,
  };
}

function newReference() {
  const year = new Date().getFullYear();
  const n = crypto.randomInt(0, 1000000);
  return `TAX-${year}-${String(n).padStart(6, '0')}`;
}

exports.submit = async (req, res) => {
  const body = getPayload(req);
  const errors = V.validateTaxAdvisoryRequest(body);
  const files = Array.isArray(req.files) ? req.files : [];

  if (files.length > V.MAX_FILES) {
    errors.push(`A maximum of ${V.MAX_FILES} documents may be attached`);
  }
  for (const f of files) {
    if (!V.isAllowedFile(f)) {
      errors.push(`File "${f.originalname}" has an unsupported type or exceeds 5MB`);
    }
  }
  if (errors.length) {
    return res.status(400).json({ message: errors.join('. ') });
  }

  const row = buildRow(body);
  row.consent_ip = req.ip || null;

  try {
    const dataCols = Object.keys(row);
    const insertSql = `INSERT INTO advisory_requests (reference, ${dataCols.join(', ')}) VALUES (?, ${dataCols.map(() => '?').join(', ')})`;

    let requestId = null;
    let reference = null;
    for (let attempt = 0; attempt < 5 && !requestId; attempt++) {
      reference = newReference();
      try {
        const [result] = await pool.query(insertSql, [reference, ...dataCols.map((c) => row[c])]);
        requestId = result.insertId;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') continue;
        throw err;
      }
    }
    if (!requestId) {
      return res.status(500).json({ message: 'Could not allocate a reference number. Please try again.' });
    }

    const services = (Array.isArray(body.services) ? body.services : []).map((s) => V.str(s)).filter(Boolean);
    if (services.length) {
      await pool.query(
        `INSERT INTO advisory_request_services (request_id, service) VALUES ?`,
        [services.map((s) => [requestId, s])]
      );
    }

    await pool.query(
      'INSERT INTO advisory_request_status_history (request_id, from_status, to_status) VALUES (?, NULL, ?)',
      [requestId, 'new']
    );

    let storedDocs = 0;
    for (const f of files) {
      try {
        const { key } = await uploadPrivateToS3(f, `tax-advisory/${requestId}`);
        await pool.query(
          'INSERT INTO advisory_request_documents (request_id, filename, mime_type, size_bytes, storage_key) VALUES (?, ?, ?, ?, ?)',
          [requestId, V.str(f.originalname).slice(0, 255), f.mimetype, f.size, key]
        );
        storedDocs++;
      } catch (err) {
        logger.error('[TaxAdvisory] document upload failed:', err.message, { requestId });
      }
    }

    notifyAdmins(
      'New tax advisory request',
      `${reference}: ${row.full_name} requested ${services.length} service(s).`,
      'tax-advisory'
    );

    logger.info('[TaxAdvisory] request submitted', {
      requestId,
      reference,
      customerType: row.customer_type,
      services: services.length,
      documents: storedDocs,
    });

    res.status(201).json({
      message: 'Your request has been received. Our team will review it and contact you using your preferred communication method.',
      reference,
    });
  } catch (err) {
    logger.error('[TaxAdvisory] submit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*,
              GROUP_CONCAT(s.service ORDER BY s.service) AS services,
              COALESCE(d.doc_count, 0) AS document_count
       FROM advisory_requests r
       LEFT JOIN advisory_request_services s ON s.request_id = r.id
       LEFT JOIN (SELECT request_id, COUNT(*) AS doc_count FROM advisory_request_documents GROUP BY request_id) d
         ON d.request_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );
    res.json(rows.map((r) => ({
      ...r,
      services: r.services ? r.services.split(',') : [],
    })));
  } catch (err) {
    logger.error('[TaxAdvisory] list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM advisory_requests WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Request not found' });
    const [services] = await pool.query('SELECT service FROM advisory_request_services WHERE request_id = ?', [id]);
    const [docs] = await pool.query(
      'SELECT id, filename, mime_type, size_bytes, uploaded_at FROM advisory_request_documents WHERE request_id = ?',
      [id]
    );
    const [history] = await pool.query(
      'SELECT from_status, to_status, note, changed_by, created_at FROM advisory_request_status_history WHERE request_id = ? ORDER BY created_at ASC',
      [id]
    );
    res.json({ ...rows[0], services: services.map((s) => s.service), documents: docs, history });
  } catch (err) {
    logger.error('[TaxAdvisory] getOne error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  const { status, note } = req.body || {};
  if (!V.REQUEST_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT status FROM advisory_requests WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Request not found' });
    const previous = rows[0].status;
    await pool.query('UPDATE advisory_requests SET status = ? WHERE id = ?', [status, id]);
    await pool.query(
      'INSERT INTO advisory_request_status_history (request_id, from_status, to_status, note, changed_by) VALUES (?, ?, ?, ?, ?)',
      [id, previous, status, note ? String(note).slice(0, 500) : null, req.user?.id || null]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    logger.error('[TaxAdvisory] updateStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assign = async (req, res) => {
  const staffId = Number(req.body?.staffId);
  if (!Number.isInteger(staffId) || staffId <= 0) {
    return res.status(400).json({ message: 'staffId is required' });
  }
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT status FROM advisory_requests WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Request not found' });
    const [staff] = await pool.query('SELECT id FROM staff WHERE id = ? AND is_active = 1', [staffId]);
    if (!staff.length) return res.status(400).json({ message: 'Active staff member not found' });
    await pool.query('UPDATE advisory_requests SET assigned_to = ? WHERE id = ?', [staffId, id]);
    await pool.query(
      'INSERT INTO advisory_request_status_history (request_id, from_status, to_status, note, changed_by) VALUES (?, ?, ?, ?, ?)',
      [id, rows[0].status, rows[0].status, `Assigned to staff #${staffId}`, req.user?.id || null]
    );
    res.json({ message: 'Request assigned' });
  } catch (err) {
    logger.error('[TaxAdvisory] assign error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const docId = Number(req.params.docId);
    const [rows] = await pool.query(
      'SELECT * FROM advisory_request_documents WHERE id = ? AND request_id = ?',
      [docId, requestId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Document not found' });
    const doc = rows[0];
    const object = await getPrivateObject(doc.storage_key);
    const safeName = (doc.filename || 'document').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
    res.set('Content-Type', doc.mime_type);
    res.set('Content-Disposition', `attachment; filename="${safeName}"`);
    logger.info('[TaxAdvisory] document downloaded', { requestId, docId, by: req.user?.id });
    object.Body.pipe(res);
  } catch (err) {
    logger.error('[TaxAdvisory] downloadDocument error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
