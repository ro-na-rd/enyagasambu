const router = require('express').Router();
const { body } = require('express-validator');
const { requestOtp, verifyOtp } = require('../controllers/sellerAuthController');

router.post('/request-otp', [body('phone').trim().notEmpty().withMessage('Phone is required')], requestOtp);
router.post('/verify-otp', [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('code').trim().notEmpty().withMessage('OTP code is required'),
], verifyOtp);

module.exports = router;
