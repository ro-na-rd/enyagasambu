const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorRecruitmentController');

router.get('/', authenticate, requireAmbassador, ctrl.getRecruitments);
router.post('/', authenticate, requireAmbassador, ctrl.createRecruitment);
router.put('/:id', authenticate, requireAmbassador, ctrl.updateRecruitment);
router.delete('/:id', authenticate, requireAmbassador, ctrl.deleteRecruitment);
router.get('/stats', authenticate, requireAmbassador, ctrl.getRecruitmentStats);

module.exports = router;
