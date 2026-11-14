const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const {
  normalizeRwandaPhone,
  normalizeMtnMomoPhone,
  parsePositiveRwfAmount,
} = require('../src/services/paymentValidationService');

const REFERENCE = 'd98f662d-3037-4bbb-9a55-035b0ccee69f';

test('requestToPay always submits an integer RWF charge to an MTN number', async (t) => {
  const originalPost = axios.post;
  const calls = [];
  axios.post = async (...args) => {
    calls.push(args);
    if (args[0].endsWith('/collection/token/')) return { data: { access_token: 'test-token' } };
    return { data: {} };
  };
  t.after(() => { axios.post = originalPost; });

  const modulePath = require.resolve('../src/services/momoService');
  delete require.cache[modulePath];
  const { requestToPay } = require('../src/services/momoService');

  await requestToPay({
    referenceId: REFERENCE,
    amount: '1500',
    payerPhone: '250788000000',
    payerMessage: 'Test payment',
    payeeNote: 'Test note',
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[1][1].currency, 'RWF');
  assert.equal(calls[1][1].amount, '1500');
  assert.equal(calls[1][1].payer.partyId, '250788000000');
  assert.equal(calls[1][2].headers['X-Reference-Id'], REFERENCE);
});

test('Rwanda phone normalization recognizes MTN and Airtel prefixes', () => {
  assert.deepEqual(normalizeRwandaPhone('0788 000 000'), {
    e164: '+250788000000',
    msisdn: '250788000000',
    national: '0788000000',
    network: 'mtn',
  });
  assert.equal(normalizeRwandaPhone('+250 730 000 000').network, 'airtel');
  assert.equal(normalizeRwandaPhone('00250720000000').national, '0720000000');
  assert.equal(normalizeMtnMomoPhone('788000000'), '250788000000');
  assert.throws(() => normalizeMtnMomoPhone('0730000000'), /Only MTN MoMo numbers/);
  assert.throws(() => normalizeRwandaPhone('0700000000'), /valid Rwanda mobile number/);
});

test('RWF amount validation rejects floats, scientific notation, and non-positive values', () => {
  assert.equal(parsePositiveRwfAmount('300'), 300);
  assert.equal(parsePositiveRwfAmount(300), 300);
  for (const value of ['300.0', '1e3', '0', '-5', 1.5, 0, Number.NaN]) {
    assert.throws(() => parsePositiveRwfAmount(value), /whole number|positive whole number/);
  }
});
