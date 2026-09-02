const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { subscribe, unsubscribe, getAll, remove } = require('../controllers/newsletterController');

router.post('/', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/', authenticate, requireAdmin, getAll);
router.delete('/:id', authenticate, requireAdmin, remove);

module.exports = router;
