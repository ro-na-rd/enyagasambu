const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, me, applyPromo } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

router.get('/me', authenticate, me);
router.post('/promo', authenticate, applyPromo);

module.exports = router;
