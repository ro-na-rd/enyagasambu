const router = require('express').Router();
const { authenticate, requireAdmin, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/recycleBinController');

// Admin only operations
router.post('/recycle', authenticate, requireAdmin, ctrl.recycleItem);
router.get('/', authenticate, requireAdmin, ctrl.getRecycleBin);
router.post('/:id/restore', authenticate, requireAdmin, ctrl.restoreItem);
router.delete('/:id', authenticate, requireAdmin, ctrl.permanentDelete);
router.post('/empty', authenticate, requireAdmin, ctrl.emptyRecycleBin);
router.get('/stats', authenticate, requireStaff, ctrl.getRecycleBinStats);

module.exports = router;
