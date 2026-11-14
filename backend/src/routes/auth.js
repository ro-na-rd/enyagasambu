const router = require('express').Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { register, login, me, updateMe, summary, applyPromo } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/resetPasswordController');
const { current, refresh, logout } = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { requireRegistrationOpen } = require('../middleware/registrationOpen');

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

router.get('/session', authenticate, current);
router.post('/session/refresh', refresh);
router.post('/session/logout', logout);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], forgotPassword);

router.post('/reset-password', [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], resetPassword);

const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/me', authenticate, me);
router.get('/me/summary', authenticate, summary);
router.put('/me', authenticate, profileUpload.single('photo'), updateMe);
router.post('/promo', authenticate, applyPromo);

module.exports = router;
