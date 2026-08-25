const express = require('express');
const router = express.Router();
const { getRecruitments, getRecruitmentById, createRecruitment, updateRecruitment, deleteRecruitment, getRecruitmentStats } = require('../controllers/supplierRecruitmentController');
const { authenticate, requireAmbassador } = require('../middleware/auth');

router.get('/', authenticate, requireAmbassador, getRecruitments);
router.get('/stats', authenticate, requireAmbassador, getRecruitmentStats);
router.get('/:id', authenticate, requireAmbassador, getRecruitmentById);
router.post('/', authenticate, requireAmbassador, createRecruitment);
router.put('/:id', authenticate, requireAmbassador, updateRecruitment);
router.delete('/:id', authenticate, requireAmbassador, deleteRecruitment);

module.exports = router;