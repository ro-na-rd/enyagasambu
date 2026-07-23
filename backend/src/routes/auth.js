const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { register, login, me, updateMe, applyPromo } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/resetPasswordController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(422).json({ message: errs.array().map((e) => e.msg).join(', ') });
  }
  next();
};

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  register
);

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

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], forgotPassword);

router.post('/reset-password', [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], resetPassword);

router.get('/me', authenticate, me);
router.put('/me', authenticate, updateMe);
router.post('/promo', authenticate, applyPromo);

module.exports = router;
