const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorSettingsController');

router.get('/', authenticate, requireAmbassador, ctrl.getSettings);
router.put('/', authenticate, requireAmbassador, ctrl.updateSettings);
router.post('/change-password', authenticate, requireAmbassador, ctrl.changePassword);
router.get('/export', authenticate, requireAmbassador, ctrl.exportData);

module.exports = router;
