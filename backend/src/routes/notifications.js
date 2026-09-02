const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.get('/', authenticate, ctrl.list);
router.get('/unread-count', authenticate, ctrl.unreadCount);
router.post('/read-all', authenticate, ctrl.markAllRead);
router.post('/:id/read', authenticate, ctrl.markRead);
router.delete('/', authenticate, ctrl.clearAll);

module.exports = router;
