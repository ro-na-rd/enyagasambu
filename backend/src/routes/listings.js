const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const { authenticate, authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/listingController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  cb(null, file.mimetype.startsWith('image/'));
}});

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
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category_id').isInt().withMessage('Category required'),
    body('listing_type').isIn(['sell', 'rent', 'auction']).withMessage('Type must be sell, rent, or auction'),
  ],
  ctrl.createListing
);

router.post(
  '/initiate',
  authenticateOptional,
  upload.array('images', 6),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category_id').isInt().withMessage('Category required'),
    body('listing_type').isIn(['sell', 'rent', 'auction']).withMessage('Type must be sell, rent, or auction'),
    body('duration_days').isIn([3, 7, 30]).withMessage('duration_days must be 3, 7, or 30'),
  ],
  ctrl.initiateListingPayment
);

router.post('/confirm', authenticateOptional, ctrl.confirmListingPayment);
router.post('/:id/renew/send-token', ctrl.sendRenewalToken);
router.post('/:id/renew/initiate', ctrl.initiateRenewal);
router.patch('/:id/renew', ctrl.confirmRenewal);
router.post('/:id/unlock', authenticate, ctrl.unlockContact);
router.post('/:id/boost', authenticate, ctrl.boostListing);

module.exports = router;
