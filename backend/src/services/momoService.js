const axios = require('axios');

function configuredBase(value, fallback) {
  const base = String(value || fallback).trim();
  return base.replace(/\/+$/, '');
}

// The collection host is configurable so production deployments can use the
// endpoint supplied during MTN onboarding, while local/sandbox deployments
// retain the correct Rwanda sandbox default.
const COLLECTION_BASE = configuredBase(
  process.env.MOMO_COLLECTION_BASE,
  process.env.MOMO_ENV === 'production'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.co.rw'
);

// Sandbox User Provisioning may be at a different base URL
// Set MOMO_PROVISION_BASE in .env once confirmed from the portal
const PROVISION_BASE = configuredBase(process.env.MOMO_PROVISION_BASE, COLLECTION_BASE);

const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;
const USER_ID          = process.env.MOMO_USER_ID;
const API_KEY          = process.env.MOMO_API_KEY;

// Rwanda sandbox uses RWF (not EUR like global sandbox)
const CURRENCY = 'RWF';
const TARGET_ENV = process.env.MOMO_ENV === 'production' ? 'mtnrwanda' : 'sandbox';
let cachedAccessToken = null;
let accessTokenExpiresAt = 0;

function normalizeMomoPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) throw new Error('Payer phone number is required');

  const countryCode = String(process.env.DEFAULT_PHONE_COUNTRY_CODE || '250').replace(/\D/g, '');
  if (!countryCode) throw new Error('DEFAULT_PHONE_COUNTRY_CODE must contain digits');

  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) return `${countryCode}${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('7')) return `${countryCode}${digits}`;
  return digits;
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt) return cachedAccessToken;

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
  if (!data?.access_token) throw new Error('MTN MoMo did not return an access token');

  // MTN returns an expiry value on current APIs. Keep a conservative fallback
  // and renew a little early to avoid using a token at its expiry boundary.
  const expiresInSeconds = Number(data.expires_in) || 300;
  cachedAccessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + Math.max(30, expiresInSeconds - 30) * 1000;
  return cachedAccessToken;
}

async function requestToPay({ referenceId, amount, payerPhone, payerMessage, payeeNote }) {
  const token = await getAccessToken();
  await axios.post(
    `${COLLECTION_BASE}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency: CURRENCY,
      externalId: referenceId,
      payer: { partyIdType: 'MSISDN', partyId: normalizeMomoPhone(payerPhone) },
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
  normalizeMomoPhone,
};
