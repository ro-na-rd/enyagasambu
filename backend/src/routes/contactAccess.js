const router = require('express').Router();
const { authenticateOptional } = require('../middleware/auth');
const { otpLimiter, verifyOtpLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/contactAccessController');

router.post('/initiate', authenticateOptional, ctrl.initiatePayment);
router.get('/status/:referenceId', authenticateOptional, ctrl.checkPayment);
router.post('/verify-otp', verifyOtpLimiter, authenticateOptional, ctrl.verifyOtp);
router.post('/resend-otp', otpLimiter, authenticateOptional, ctrl.resendOtp);
router.get('/contact/:listingId', authenticateOptional, ctrl.getContact);

module.exports = router;
