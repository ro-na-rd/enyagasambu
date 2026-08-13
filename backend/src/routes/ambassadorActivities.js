const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorActivityController');

router.get('/activities', authenticate, requireAmbassador, ctrl.getActivities);

module.exports = router;
