const router = require('express').Router();
const { listRegisteredMembers } = require('../controllers/publicDirectoryController');

// Public names and registration roles only. Phone numbers and private profile
// data are intentionally excluded from this response.
router.get('/', listRegisteredMembers);

module.exports = router;
