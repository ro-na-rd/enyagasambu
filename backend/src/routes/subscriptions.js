const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getPlans, getMySubscription, subscribe } = require('../controllers/subscriptionController');

router.get('/plans', getPlans);
router.get('/me', authenticate, getMySubscription);
router.post('/subscribe', authenticate, subscribe);

module.exports = router;
