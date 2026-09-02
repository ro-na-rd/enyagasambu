const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/overview', ctrl.getOverview);
router.get('/trends', ctrl.getTrends);
router.get('/funnel', ctrl.getFunnel);
router.get('/snapshots', ctrl.getSnapshots);

module.exports = router;