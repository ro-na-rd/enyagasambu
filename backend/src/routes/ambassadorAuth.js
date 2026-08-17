const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, requireAmbassador } = require('../middleware/auth');
const { register, login, me, updateProfile, changePassword } = require('../controllers/ambassadorAuthController');

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
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

router.get('/me', authenticate, requireAmbassador, me);
router.put('/profile', authenticate, requireAmbassador, updateProfile);
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
  ],
  authenticate,
  requireAmbassador,
  changePassword
);

module.exports = router;
