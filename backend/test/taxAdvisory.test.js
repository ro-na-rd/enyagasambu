const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TAX_SERVICES,
  validateTaxAdvisoryRequest,
  isAllowedFile,
} = require('../src/utils/taxAdvisoryValidation');

function baseIndividualRequest() {
  return {
    customerType: 'individual',
    fullName: 'Aline Uwase',
    phone: '+250 788 123 456',
    email: 'aline@example.com',
    services: ['vat', 'paye'],
    description: 'I need help filing VAT returns for the last quarter of the year.',
    taxPeriod: 'FY2025',
    urgency: 'one_week',
    consultationChannel: 'phone',
    consentProcess: true,
    accuracyConfirmed: true,
  };
}

test('a complete individual request passes validation', () => {
  assert.deepEqual(validateTaxAdvisoryRequest(baseIndividualRequest()), []);
});

test('a complete business request passes validation', () => {
  const body = {
    ...baseIndividualRequest(),
    customerType: 'business',
    businessName: 'Uwase Trading Ltd',
    contactPerson: 'Aline Uwase',
    contactPersonRole: 'Director',
    isAuthorized: true,
    businessType: 'company',
  };
  assert.deepEqual(validateTaxAdvisoryRequest(body), []);
});

test('required contact fields are reported together', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    fullName: '',
    phone: '',
    email: '',
  });
  assert.ok(errors.some((e) => e.includes('Full name')));
  assert.ok(errors.some((e) => e.includes('Phone')));
  assert.ok(errors.some((e) => e.includes('Email')));
});

test('malformed email and phone are rejected', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    email: 'not-an-email',
    phone: 'abc',
  });
  assert.ok(errors.some((e) => e.includes('Email address is invalid')));
  assert.ok(errors.some((e) => e.includes('Phone number is invalid')));
});

test('at least one allowlisted tax service is required', () => {
  const noServices = validateTaxAdvisoryRequest({ ...baseIndividualRequest(), services: [] });
  assert.ok(noServices.some((e) => e.includes('at least one tax service')));

  const badService = validateTaxAdvisoryRequest({ ...baseIndividualRequest(), services: ['free_money'] });
  assert.ok(badService.some((e) => e.includes('Invalid tax service')));
});

test('the other service requires a description', () => {
  const errors = validateTaxAdvisoryRequest({ ...baseIndividualRequest(), services: ['other'] });
  assert.ok(errors.some((e) => e.includes('describe the service')));
});

test('Rwanda tax categories are all allowlisted', () => {
  const expected = [
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
  ];
  for (const s of expected) assert.ok(TAX_SERVICES.includes(s), `${s} missing`);
});

test('business requests require an authorization declaration', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    customerType: 'business',
    businessName: 'Uwase Trading Ltd',
    contactPerson: 'Aline Uwase',
    isAuthorized: false,
  });
  assert.ok(errors.some((e) => e.includes('Authorization declaration')));
});

test('description and tax period are required', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    description: 'short',
    taxPeriod: '',
  });
  assert.ok(errors.some((e) => e.includes('at least 20 characters')));
  assert.ok(errors.some((e) => e.includes('Tax period')));
});

test('consent and accuracy confirmation are required', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    consentProcess: false,
    accuracyConfirmed: false,
  });
  assert.ok(errors.some((e) => e.includes('Consent to process')));
  assert.ok(errors.some((e) => e.includes('accurate')));
});

test('a deadline without a date is rejected', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    hasFilingDeadline: true,
    filingDeadline: '',
  });
  assert.ok(errors.some((e) => e.includes('Filing deadline date')));
});

test('invalid enum values are rejected', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    urgency: 'whenever',
    consultationChannel: 'telepathy',
  });
  assert.ok(errors.some((e) => e.includes('Invalid urgency')));
  assert.ok(errors.some((e) => e.includes('Invalid consultation channel')));
});

test('overlong fields are rejected', () => {
  const errors = validateTaxAdvisoryRequest({
    ...baseIndividualRequest(),
    fullName: 'x'.repeat(200),
  });
  assert.ok(errors.some((e) => e.includes('fullName must be at most')));
});

test('isAllowedFile accepts pdf and images within the size limit', () => {
  const ok = { mimetype: 'application/pdf', originalname: 'notice.pdf', size: 1024 };
  assert.equal(isAllowedFile(ok), true);
  assert.equal(isAllowedFile({ mimetype: 'image/jpeg', originalname: 'scan.JPG', size: 2048 }), true);
});

test('isAllowedFile rejects executables, oversized and extension-spoofed files', () => {
  assert.equal(isAllowedFile({ mimetype: 'application/x-msdownload', originalname: 'setup.exe', size: 1024 }), false);
  assert.equal(isAllowedFile({ mimetype: 'application/pdf', originalname: 'big.pdf', size: 6 * 1024 * 1024 }), false);
  assert.equal(isAllowedFile({ mimetype: 'application/pdf', originalname: 'fake.txt', size: 1024 }), false);
  assert.equal(isAllowedFile(null), false);
});
