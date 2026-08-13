const router = require('express').Router();
const { authenticate, requireAdmin, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/announcementController');

router.get('/', authenticate, requireStaff, ctrl.adminList);
router.post('/', authenticate, requireStaff, ctrl.adminCreate);
router.delete('/:id', authenticate, requireAdmin, ctrl.adminDelete);

module.exports = router;
