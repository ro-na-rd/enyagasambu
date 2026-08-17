const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorActivityController');

router.get('/activities', authenticate, requireAmbassador, ctrl.getActivities);
router.get('/dashboard', authenticate, requireAmbassador, ctrl.getDashboard);
router.get('/referral-code', authenticate, requireAmbassador, ctrl.getReferralCode);
router.get('/earnings', authenticate, requireAmbassador, ctrl.getEarnings);
router.get('/referrals', authenticate, requireAmbassador, ctrl.getReferrals);

module.exports = router;
