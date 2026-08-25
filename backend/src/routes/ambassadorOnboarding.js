const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorOnboardingController');

router.get('/tasks', authenticate, requireAmbassador, ctrl.getOnboardingTasks);
router.post('/tasks/:taskId/toggle', authenticate, requireAmbassador, ctrl.toggleTask);
router.get('/progress', authenticate, requireAmbassador, ctrl.getOnboardingProgress);
router.get('/guidelines', authenticate, requireAmbassador, ctrl.getGuidelines);

module.exports = router;
