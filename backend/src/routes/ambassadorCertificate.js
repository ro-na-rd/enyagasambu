const router = require('express').Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorCertificateController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/', authenticate, ctrl.getMyCertificate);
router.post('/upload-photo', authenticate, upload.single('photo'), ctrl.uploadPhoto);
router.post('/pay', authenticate, ctrl.initiatePayment);
router.get('/payment-status/:referenceId', authenticate, ctrl.checkPayment);

module.exports = router;
