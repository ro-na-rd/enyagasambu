const express = require('express');
const router = express.Router();
const locationSharingController = require('../controllers/locationSharingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, locationSharingController.shareLocation);
router.get('/:sharingId', locationSharingController.getSharedLocation);

module.exports = router;
