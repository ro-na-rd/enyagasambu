const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireSupplier } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { requireRegistrationOpen } = require('../middleware/registrationOpen');
const { register, verifyEmail, resendVerificationEmail, login, me, updateMe } = require('../controllers/supplierAuthController');

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(422).json({ message: errs.array().map((e) => e.msg).join(', ') });
  }
  next();
};

router.post(
  '/register',
  requireRegistrationOpen,
  [
    body('business_name').trim().notEmpty().isLength({ max: 100 }).withMessage('Business or company name is required and must be 100 characters or fewer'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  register
);

router.post('/verify-email', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
  validate,
], verifyEmail);

router.post('/resend-verification', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], resendVerificationEmail);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

router.get('/me', authenticate, requireSupplier, me);
router.put('/me', authenticate, requireSupplier, updateMe);

module.exports = router;
