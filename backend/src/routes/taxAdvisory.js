const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { taxAdvisoryLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/taxAdvisoryController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

router.post('/', taxAdvisoryLimiter, upload.array('documents', 5), ctrl.submit);
router.get('/', authenticate, requireAdmin, ctrl.list);
router.get('/:id', authenticate, requireAdmin, ctrl.getOne);
router.patch('/:id/status', authenticate, requireAdmin, ctrl.updateStatus);
router.patch('/:id/assign', authenticate, requireAdmin, ctrl.assign);
router.get('/:id/documents/:docId', authenticate, requireAdmin, ctrl.downloadDocument);

module.exports = router;
