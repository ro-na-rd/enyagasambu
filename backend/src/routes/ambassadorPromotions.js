const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorPromotionController');

router.get('/', authenticate, requireAmbassador, ctrl.getPromotions);
router.post('/', authenticate, requireAmbassador, ctrl.createPromotion);
router.post('/:promotionId/share', authenticate, requireAmbassador, ctrl.trackShare);
router.get('/materials', authenticate, requireAmbassador, ctrl.getPromoMaterials);
router.get('/stats', authenticate, requireAmbassador, ctrl.getShareStats);

module.exports = router;
