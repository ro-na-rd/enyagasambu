const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { sendOtp, verifyOtp } = require('../controllers/otpController');

router.post('/send', authenticate, sendOtp);
router.post('/verify', authenticate, verifyOtp);

module.exports = router;
