const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorCertificateController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cert_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', authenticate, ctrl.getMyCertificate);
router.post('/upload-photo', authenticate, upload.single('photo'), ctrl.uploadPhoto);
router.post('/pay', authenticate, ctrl.initiatePayment);
router.get('/payment-status/:referenceId', authenticate, ctrl.checkPayment);

module.exports = router;
