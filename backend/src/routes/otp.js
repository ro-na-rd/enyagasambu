const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post('/send', authenticate, otpLimiter, sendOtp);
router.post('/verify', authenticate, verifyOtp);

module.exports = router;
