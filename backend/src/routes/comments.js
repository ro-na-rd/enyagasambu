const router = require('express').Router();
const { authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/commentController');

router.get('/:id', authenticateOptional, ctrl.getComments);
router.post('/:id', authenticateOptional, ctrl.addComment);
router.delete('/:id/:commentId', authenticateOptional, ctrl.deleteComment);

module.exports = router;
