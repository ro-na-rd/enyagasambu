const express = require('express');
const router = express.Router();
const { getMaterials, getMaterialById, getCategories, getRequiredMaterials, getProgress } = require('../controllers/onboardingController');
const { requireAmbassador } = require('../middleware/auth');

router.get('/', requireAmbassador, getMaterials);
router.get('/categories', requireAmbassador, getCategories);
router.get('/required', requireAmbassador, getRequiredMaterials);
router.get('/progress', requireAmbassador, getProgress);
router.get('/:id', requireAmbassador, getMaterialById);

module.exports = router;