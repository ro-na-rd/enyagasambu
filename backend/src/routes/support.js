const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/supportController');

router.post('/', ctrl.submit);
router.get('/', authenticate, requireAdmin, ctrl.list);
router.patch('/:id/status', authenticate, requireAdmin, ctrl.updateStatus);

module.exports = router;
