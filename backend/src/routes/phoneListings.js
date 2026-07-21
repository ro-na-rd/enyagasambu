const router = require('express').Router();
const multer = require('multer');
const { body } = require('express-validator');
const { authenticatePhoneSeller } = require('../middleware/auth');
const ctrl = require('../controllers/phoneListingsController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.post('/request', ctrl.requestAccess);
router.post('/verify', ctrl.verifyAccess);

router.get('/listings', authenticatePhoneSeller, ctrl.getListings);

router.put(
  '/:id',
  authenticatePhoneSeller,
  upload.array('images', 6),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category_id').isInt().withMessage('Category required'),
  ],
  ctrl.updateListing
);

router.delete('/:id', authenticatePhoneSeller, ctrl.deleteListing);
router.post('/:id/repost', authenticatePhoneSeller, ctrl.repostListing);

module.exports = router;
