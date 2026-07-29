const pool = require('../config/db');
const { simulatePaymentSuccess, simulatePaymentFailure, isSimulationMode } = require('../services/momoService');

// Check if simulation mode is enabled
exports.getSimulationStatus = async (req, res) => {
  return res.json({ simulationMode: isSimulationMode() });
};

// Simulate a successful payment (listing or contact unlock)
exports.simulateSuccess = async (req, res) => {
  if (!isSimulationMode()) {
    return res.status(403).json({ message: 'Simulation mode is not enabled' });
  }

  const { referenceId } = req.body;
  if (!referenceId) {
    return res.status(400).json({ message: 'referenceId is required' });
  }

  const success = simulatePaymentSuccess(referenceId);
  if (!success) {
    return res.status(404).json({ message: 'Payment not found in simulation store' });
  }

  return res.json({ message: 'Payment simulated as successful', referenceId });
};

// Simulate a failed payment
exports.simulateFailure = async (req, res) => {
  if (!isSimulationMode()) {
    return res.status(403).json({ message: 'Simulation mode is not enabled' });
  }

  const { referenceId } = req.body;
  if (!referenceId) {
    return res.status(400).json({ message: 'referenceId is required' });
  }

  const success = simulatePaymentFailure(referenceId);
  if (!success) {
    return res.status(404).json({ message: 'Payment not found in simulation store' });
  }

  return res.json({ message: 'Payment simulated as failed', referenceId });
};

// Get a simulated OTP code for testing (bypasses SMS)
exports.getSimulatedOtp = async (req, res) => {
  if (!isSimulationMode()) {
    return res.status(403).json({ message: 'Simulation mode is not enabled' });
  }

  const { referenceId, type } = req.query; // type: 'listing' or 'contact'
  if (!referenceId || !type) {
    return res.status(400).json({ message: 'referenceId and type are required' });
  }

  try {
    let otpCode = null;

    if (type === 'listing') {
      const [[otp]] = await pool.query(
        `SELECT code FROM payment_otps
         WHERE payment_id = (SELECT id FROM payments WHERE provider_ref = ? AND type = 'listing_token')
         ORDER BY id DESC LIMIT 1`,
        [referenceId]
      );
      otpCode = otp?.code;
    } else if (type === 'contact') {
      const [[otp]] = await pool.query(
        `SELECT otp_code FROM contact_access_payments
         WHERE reference_id = ? AND otp_code IS NOT NULL
         ORDER BY id DESC LIMIT 1`,
        [referenceId]
      );
      otpCode = otp?.otp_code;
    }

    if (!otpCode) {
      return res.status(404).json({ message: 'No OTP found. Payment may not be verified yet.' });
    }

    return res.json({ code: otpCode, message: `[SIMULATION] OTP code: ${otpCode}` });
  } catch (err) {
    console.error('[Simulation OTP lookup error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
