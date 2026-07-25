const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/contentController');

router.get('/',              ctrl.getAll);
router.get('/public/:slug',  ctrl.getBySlug);
router.get('/:id',           authenticate, requireAdmin, ctrl.getById);
router.post('/',             authenticate, requireAdmin, ctrl.create);
router.put('/:id',           authenticate, requireAdmin, ctrl.update);
router.patch('/:id/status',  authenticate, requireAdmin, ctrl.toggleStatus);
router.delete('/:id',        authenticate, requireAdmin, ctrl.remove);

module.exports = router;
