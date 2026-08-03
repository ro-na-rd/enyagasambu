const router = require('express').Router();
const { authenticate, authenticateOptional, requireStaff } = require('../middleware/auth');
const { createReport, listReports, updateReport } = require('../controllers/reportController');

router.post('/', authenticateOptional, createReport);

router.get('/', authenticate, requireStaff, listReports);
router.patch('/:id', authenticate, requireStaff, updateReport);

module.exports = router;
