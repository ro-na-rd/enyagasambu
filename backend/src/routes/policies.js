const express = require('express');
const router = express.Router();
const { getPolicies, getPolicyById, acknowledgePolicy, getAcknowledgmentStatus, getComplianceStats } = require('../controllers/policyController');
const { authenticate, requireAmbassador } = require('../middleware/auth');

router.get('/', authenticate, requireAmbassador, getPolicies);
router.get('/status', authenticate, requireAmbassador, getAcknowledgmentStatus);
router.get('/compliance', authenticate, requireAmbassador, getComplianceStats);
router.get('/:id', authenticate, requireAmbassador, getPolicyById);
router.post('/:id/acknowledge', authenticate, requireAmbassador, acknowledgePolicy);

module.exports = router;