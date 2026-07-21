const router = require('express').Router();
const { authenticateOptional } = require('../middleware/auth');
const { unlock } = require('../controllers/unlockController');

router.post('/direct', authenticateOptional, unlock);

module.exports = router;
