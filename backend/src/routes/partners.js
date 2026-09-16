const router = require('express').Router();
const { listPublicPartners } = require('../controllers/partnerController');

router.get('/', listPublicPartners);

module.exports = router;
