const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminCertificateController');

router.get('/', authenticate, requireAdmin, ctrl.getCertificates);
router.get('/:id', authenticate, requireAdmin, ctrl.getCertificateDetail);
router.post('/:id/confirm-payment', authenticate, requireAdmin, ctrl.confirmPayment);
router.post('/:id/generate', authenticate, requireAdmin, ctrl.generateCertificate);

module.exports = router;
