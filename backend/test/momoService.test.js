const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

test('requestToPay always submits the charge in RWF', async (t) => {
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
    referenceId: 'test-reference',
    amount: 1500,
    payerPhone: '250788000000',
    payerMessage: 'Test payment',
    payeeNote: 'Test note',
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[1][1].currency, 'RWF');
  assert.equal(calls[1][1].amount, '1500');
});
