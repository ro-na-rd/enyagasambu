const router = require('express').Router();
const { authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/likeController');

router.get('/:id', authenticateOptional, ctrl.getLikeStatus);
router.post('/:id/toggle', authenticateOptional, ctrl.toggleLike);

module.exports = router;
