const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/siteContentController');

router.get('/public',       ctrl.getPublic);
router.get('/',             authenticate, requireAdmin, ctrl.getAll);
router.post('/',            authenticate, requireAdmin, ctrl.create);
router.put('/:id',          authenticate, requireAdmin, ctrl.update);
router.patch('/:id/status', authenticate, requireAdmin, ctrl.toggleStatus);
router.delete('/:id',       authenticate, requireAdmin, ctrl.remove);

module.exports = router;