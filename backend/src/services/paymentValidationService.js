const { createHash, randomUUID } = require('crypto');

class PaymentValidationError extends Error {
  constructor(message, code = 'INVALID_PAYMENT_INPUT') {
    super(message);
    this.name = 'PaymentValidationError';
    this.code = code;
    this.status = 400;
  }
}

function normalizeRwandaPhone(value) {
  const raw = String(value ?? '').trim();
  if (!raw) throw new PaymentValidationError('A Rwanda phone number is required', 'PHONE_REQUIRED');
  if (!/^[+\d\s().-]+$/.test(raw)) {
    throw new PaymentValidationError('Phone number contains unsupported characters', 'INVALID_PHONE');
  }

  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `250${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) digits = `250${digits}`;

  const match = digits.match(/^250(7[2389])(\d{7})$/);
  if (!match) {
    throw new PaymentValidationError('Enter a valid Rwanda mobile number', 'INVALID_PHONE');
  }

  const prefix = match[1];
  const network = ['78', '79'].includes(prefix) ? 'mtn' : 'airtel';
  return {
    e164: `+${digits}`,
    msisdn: digits,
    national: `0${digits.slice(3)}`,
    network,
  };
}

function normalizeMtnMomoPhone(value) {
  const phone = normalizeRwandaPhone(value);
  if (phone.network !== 'mtn') {
    throw new PaymentValidationError('Only MTN MoMo numbers (078 or 079) are supported', 'UNSUPPORTED_MOMO_NETWORK');
  }
  return phone.msisdn;
}

function parsePositiveRwfAmount(value, { minimum = 1, field = 'Amount' } = {}) {
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (typeof normalized === 'string' && !/^\d+$/.test(normalized)) {
    throw new PaymentValidationError(`${field} must be a whole number of RWF`, 'INVALID_RWF_AMOUNT');
  }
  if (typeof normalized !== 'number' && typeof normalized !== 'string') {
    throw new PaymentValidationError(`${field} must be a whole number of RWF`, 'INVALID_RWF_AMOUNT');
  }

  const amount = Number(normalized);
  if (!Number.isSafeInteger(amount) || amount < minimum) {
    throw new PaymentValidationError(`${field} must be a positive whole number of RWF`, 'INVALID_RWF_AMOUNT');
  }
  return amount;
}

function createPaymentReference() {
  return randomUUID();
}

function assertPaymentReference(referenceId) {
  if (typeof referenceId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(referenceId)) {
    throw new PaymentValidationError('Invalid payment reference', 'INVALID_PAYMENT_REFERENCE');
  }
  return referenceId.toLowerCase();
}

function paymentLockName(scope, parts) {
  const source = `${scope}:${parts.map((part) => String(part ?? '')).join(':')}`;
  return `payment:${createHash('sha256').update(source).digest('hex').slice(0, 48)}`;
}

async function withPaymentInitiationLock(pool, scope, parts, operation) {
  const connection = await pool.getConnection();
  const lockName = paymentLockName(scope, parts);
  let acquired = false;
  try {
    const [[result]] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    acquired = result?.acquired === 1;
    if (!acquired) throw new Error('Could not acquire payment initiation lock');
    return await operation();
  } finally {
    if (acquired) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => {});
    connection.release();
  }
}

module.exports = {
  PaymentValidationError,
  normalizeRwandaPhone,
  normalizeMtnMomoPhone,
  parsePositiveRwfAmount,
  createPaymentReference,
  assertPaymentReference,
  withPaymentInitiationLock,
};
