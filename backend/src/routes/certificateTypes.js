const router = require('express').Router();
const ctrl = require('../controllers/certificateTypeController');

router.get('/', ctrl.getPublicTypes);

module.exports = router;
