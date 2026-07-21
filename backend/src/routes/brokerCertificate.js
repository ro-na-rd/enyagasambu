const router = require('express').Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/brokerCertificateController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/', authenticate, ctrl.getMyCertificate);
router.post('/request', authenticate, ctrl.requestCertificate);
router.post('/upload-photo', authenticate, upload.single('photo'), ctrl.uploadPhoto);
router.post('/pay', authenticate, ctrl.confirmPayment);

module.exports = router;
