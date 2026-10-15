const router = require('express').Router();
const { authenticate, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

router.get('/', ctrl.getCategories);
router.get('/:id/fields', ctrl.getCategoryFields);
router.post('/:id/fields', authenticate, requireStaff, ctrl.createCategoryField);
router.put('/:id/fields/:fieldId', authenticate, requireStaff, ctrl.updateCategoryField);
router.delete('/:id/fields/:fieldId', authenticate, requireStaff, ctrl.deleteCategoryField);
router.post('/', authenticate, requireStaff, ctrl.createCategory);
router.put('/:id', authenticate, requireStaff, ctrl.updateCategory);
router.delete('/:id', authenticate, requireStaff, ctrl.deleteCategory);

module.exports = router;
