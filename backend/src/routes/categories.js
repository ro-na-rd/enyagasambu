const router = require('express').Router();
const { authenticate, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

router.get('/', ctrl.getCategories);
router.post('/', authenticate, requireStaff, ctrl.createCategory);
router.put('/:id', authenticate, requireStaff, ctrl.updateCategory);
router.delete('/:id', authenticate, requireStaff, ctrl.deleteCategory);

module.exports = router;
