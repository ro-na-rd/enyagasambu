const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/announcementController');

router.get('/', authenticate, ctrl.listForRole);

module.exports = router;
