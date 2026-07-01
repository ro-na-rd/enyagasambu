const router = require('express').Router();
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const { getPackages, getBalance, initiateMomoPayment, checkMomoPayment } = require('../controllers/coinController');
const { createSandboxUser, getSandboxApiKey } = require('../services/momoService');

router.get('/packages', getPackages);
router.get('/balance', authenticate, getBalance);
router.post('/momo/pay', authenticate, initiateMomoPayment);
router.get('/momo/status/:referenceId', authenticate, checkMomoPayment);

// One-time admin route to create sandbox API user and get API key
// Call: POST /api/coins/momo/setup  (admin only)
router.post('/momo/setup', authenticate, requireAdmin, async (req, res) => {
  const uuid = req.body.uuid || crypto.randomUUID();
  try {
    const create = await createSandboxUser(uuid);
    if (create.status !== 201) {
      return res.json({ step: 'createUser', status: create.status, response: create.data, uuid });
    }
    const keyResult = await getSandboxApiKey(uuid);
    return res.json({
      step: 'done',
      uuid,
      apiKey: keyResult.data?.apiKey,
      status: keyResult.status,
      instructions: `Add to .env: MOMO_USER_ID=${uuid} and MOMO_API_KEY=${keyResult.data?.apiKey}`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, response: err.response?.data });
  }
});

module.exports = router;
