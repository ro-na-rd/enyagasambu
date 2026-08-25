const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireSupplier } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { register, login, me, updateMe } = require('../controllers/supplierAuthController');

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
    body('phone').trim().notEmpty().withMessage('Phone is required'),
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

router.get('/me', authenticate, requireSupplier, me);
router.put('/me', authenticate, requireSupplier, updateMe);

module.exports = router;
