const router = require('express').Router();
const { authenticate, authenticateOptional } = require('../middleware/auth');
const ctrl = require('../controllers/ratingController');

router.get('/:id', authenticateOptional, ctrl.getRating);
router.post('/:id', authenticate, ctrl.rate);

module.exports = router;