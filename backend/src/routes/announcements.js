const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/announcementController');

router.get('/public', ctrl.listPublic);
router.get('/', authenticate, ctrl.listForRole);

module.exports = router;
