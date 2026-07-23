const router = require('express').Router();
const { authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/contactAccessController');

router.post('/initiate', authenticateOptional, ctrl.initiatePayment);
router.get('/status/:referenceId', authenticateOptional, ctrl.checkPayment);
router.post('/verify-otp', authenticateOptional, ctrl.verifyOtp);
router.post('/resend-otp', authenticateOptional, ctrl.resendOtp);
router.get('/contact/:listingId', authenticateOptional, ctrl.getContact);

module.exports = router;
