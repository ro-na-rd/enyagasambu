const router = require('express').Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticate, authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/listingController');
const paymentOtp = require('../controllers/paymentOtpController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array().map(e => e.msg).join(', ') });
  }
  next();
};

router.get('/categories', ctrl.getCategories);
router.get('/', ctrl.getListings);
router.get('/my', authenticate, ctrl.myListings);
router.get('/:id', (req, res, next) => {
  // try to attach user if token present, but don't block unauthenticated access
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}, ctrl.getListing);

router.post(
  '/',
  authenticateOptional,
  upload.array('images', 6),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('category_id').isInt().withMessage('Category required'),
    body('listing_type').optional().isIn(['sell', 'rent', 'auction']).withMessage('Type must be sell, rent, or auction'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters (e.g., RWF)'),
    body('location').optional().trim(),
    body('description').optional().trim(),
  ],
  validate,
  ctrl.createListing
);

router.post(
  '/initiate',
  authenticateOptional,
  upload.array('images', 6),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('category_id').isInt().withMessage('Category required'),
    body('listing_type').optional().isIn(['sell', 'rent', 'auction']).withMessage('Type must be sell, rent, or auction'),
    body('duration_days').isIn([3, 7, 30]).withMessage('duration_days must be 3, 7, or 30'),
    body('phone').trim().notEmpty().withMessage('Phone number required for payment'),
  ],
  validate,
  ctrl.initiateListingPayment
);

router.post('/confirm', authenticateOptional, ctrl.confirmListingPayment);
router.post('/:id/renew/send-token', ctrl.sendRenewalToken);
router.post('/:id/renew/initiate', ctrl.initiateRenewal);
router.patch('/:id/renew', ctrl.confirmRenewal);
router.post('/:id/unlock', authenticate, ctrl.unlockContact);
router.post('/:id/boost', authenticate, ctrl.boostListing);
router.delete('/:id', authenticate, ctrl.deleteListing);

router.post('/payment-otp/send', authenticateOptional, paymentOtp.sendPaymentOtp);
router.post('/payment-otp/verify', authenticateOptional, paymentOtp.verifyPaymentOtp);
router.post('/payment-otp/resend', authenticateOptional, paymentOtp.resendPaymentOtp);

module.exports = router;
