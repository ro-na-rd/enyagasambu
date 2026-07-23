const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { login, verifyOtp, me } = require('../controllers/adminAuthController');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(400).json({ message: errs.array().map((e) => e.msg).join(', ') });
  }
  next();
};

router.post('/login', loginLimiter, [
  body('email').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  validate,
], login);

router.post('/verify-otp', [
  body('email').trim().notEmpty().withMessage('Username is required'),
  body('code').trim().notEmpty().withMessage('OTP code is required'),
  validate,
], verifyOtp);

router.get('/me', authenticate, me);

module.exports = router;
