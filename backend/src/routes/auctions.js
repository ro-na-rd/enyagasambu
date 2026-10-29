const router = require('express').Router();
const multer = require('multer');
const { authenticate, authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/auctionController');
const paymentOtp = require('../controllers/paymentOtpController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/', ctrl.getAuctions);
router.get('/ended', ctrl.getEndedAuctions);
router.get('/feed', ctrl.getFeed);
router.get('/my', authenticate, ctrl.getMyAuctions);
router.get('/watched', authenticate, ctrl.getWatched);

router.post('/', authenticate, upload.array('images', 6), ctrl.createAuction);

router.post('/initiate', authenticateOptional, upload.array('images', 6), ctrl.initiateAuctionPayment);
router.post('/confirm', authenticateOptional, ctrl.confirmAuctionPayment);
router.post('/payment-otp/send', authenticateOptional, paymentOtp.sendPaymentOtp);
router.post('/payment-otp/verify', authenticateOptional, paymentOtp.verifyPaymentOtp);
router.post('/payment-otp/resend', authenticateOptional, paymentOtp.resendPaymentOtp);

router.get('/:id', authenticateOptional, ctrl.getAuction);
router.get('/:id/bids', ctrl.getBids);
router.post('/:id/bid', authenticate, ctrl.placeBid);
router.post('/:id/watch', authenticate, ctrl.watch);
router.delete('/:id/watch', authenticate, ctrl.unwatch);

module.exports = router;
