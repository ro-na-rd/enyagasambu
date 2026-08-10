const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/certificateTypeController');

router.get('/', authenticate, requireAdmin, ctrl.listTypes);
router.post('/', authenticate, requireAdmin, ctrl.createType);
router.put('/:id', authenticate, requireAdmin, ctrl.updateType);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteType);

module.exports = router;
