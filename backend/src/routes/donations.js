const router = require('express').Router();
const { authenticateOptional } = require('../middleware/auth');
const { otpLimiter, verifyOtpLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/donationController');

router.get('/', ctrl.getPublicStats);
router.post('/initiate', authenticateOptional, ctrl.initiateMomo);
router.get('/:referenceId/status', authenticateOptional, ctrl.checkPayment);
router.post('/verify-otp', verifyOtpLimiter, authenticateOptional, ctrl.verifyOtp);
router.post('/resend-otp', otpLimiter, authenticateOptional, ctrl.resendOtp);
router.post('/card', authenticateOptional, ctrl.processCard);

module.exports = router;
