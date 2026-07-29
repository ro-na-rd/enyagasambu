const axios = require('axios');

const SIMULATION_MODE = process.env.PAYMENT_SIMULATION === 'true';

// Rwanda-specific sandbox confirmed from API portal
const COLLECTION_BASE  = process.env.MOMO_ENV === 'production'
  ? 'https://proxy.momoapi.mtn.com'
  : 'https://sandbox.momodeveloper.mtn.co.rw';

// Sandbox User Provisioning may be at a different base URL
// Set MOMO_PROVISION_BASE in .env once confirmed from the portal
const PROVISION_BASE = process.env.MOMO_PROVISION_BASE || COLLECTION_BASE;

const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;
const USER_ID          = process.env.MOMO_USER_ID;
const API_KEY          = process.env.MOMO_API_KEY;

// Rwanda sandbox uses RWF (not EUR like global sandbox)
const CURRENCY = 'RWF';
const TARGET_ENV = process.env.MOMO_ENV === 'production' ? 'mtnrwanda' : 'sandbox';

// In-memory store for simulated payments (referenceId -> status)
const simulatedPayments = new Map();

async function getAccessToken() {
  const credentials = Buffer.from(`${USER_ID}:${API_KEY}`).toString('base64');
  const { data } = await axios.post(
    `${COLLECTION_BASE}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  );
  return data.access_token;
}

async function requestToPay({ referenceId, amount, payerPhone, payerMessage, payeeNote }) {
  // Simulation mode: store payment as pending, no real API call
  if (SIMULATION_MODE) {
    simulatedPayments.set(referenceId, {
      status: 'pending',
      amount,
      payerPhone,
      createdAt: Date.now(),
    });
    console.log(`[SIMULATION] Payment request stored: ${referenceId} (${amount} RWF to ${payerPhone})`);
    return referenceId;
  }

  const token = await getAccessToken();
  await axios.post(
    `${COLLECTION_BASE}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency: CURRENCY,
      externalId: referenceId,
      payer: { partyIdType: 'MSISDN', partyId: payerPhone },
      payerMessage,
      payeeNote,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return referenceId;
}

async function getPaymentStatus(referenceId) {
  // Simulation mode: return simulated status
  if (SIMULATION_MODE) {
    const payment = simulatedPayments.get(referenceId);
    if (!payment) {
      return { status: 'NOT_FOUND', reason: 'Simulated payment not found' };
    }
    console.log(`[SIMULATION] Payment status check: ${referenceId} -> ${payment.status}`);
    return { status: payment.status };
  }

  const token = await getAccessToken();
  const { data } = await axios.get(
    `${COLLECTION_BASE}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  );
  return data;
}

// Simulation helpers
function simulatePaymentSuccess(referenceId) {
  const payment = simulatedPayments.get(referenceId);
  if (!payment) return false;
  payment.status = 'SUCCESSFUL';
  simulatedPayments.set(referenceId, payment);
  console.log(`[SIMULATION] Payment marked as successful: ${referenceId}`);
  return true;
}

function simulatePaymentFailure(referenceId) {
  const payment = simulatedPayments.get(referenceId);
  if (!payment) return false;
  payment.status = 'FAILED';
  payment.reason = 'Simulated payment failure';
  simulatedPayments.set(referenceId, payment);
  console.log(`[SIMULATION] Payment marked as failed: ${referenceId}`);
  return true;
}

function isSimulationMode() {
  return SIMULATION_MODE;
}

// Used once during setup to create sandbox API user
async function createSandboxUser(uuid) {
  const { data, status } = await axios.post(
    `${PROVISION_BASE}/v1_0/apiuser`,
    { providerCallbackHost: 'localhost' },
    {
      headers: {
        'X-Reference-Id': uuid,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    }
  );
  return { status, data };
}

async function getSandboxApiKey(uuid) {
  const { data, status } = await axios.post(
    `${PROVISION_BASE}/v1_0/apiuser/${uuid}/apikey`,
    {},
    {
      headers: { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY },
      validateStatus: () => true,
    }
  );
  return { status, data };
}

module.exports = {
  requestToPay,
  getPaymentStatus,
  createSandboxUser,
  getSandboxApiKey,
  simulatePaymentSuccess,
  simulatePaymentFailure,
  isSimulationMode,
};
