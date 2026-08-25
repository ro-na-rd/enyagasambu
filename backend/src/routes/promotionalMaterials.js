const express = require('express');
const router = express.Router();
const { getMaterials, getMaterialById, trackDownload, getCategories } = require('../controllers/promotionalMaterialController');
const { requireAmbassador } = require('../middleware/auth');

router.get('/', requireAmbassador, getMaterials);
router.get('/categories', requireAmbassador, getCategories);
router.get('/:id', requireAmbassador, getMaterialById);
router.post('/:id/download', requireAmbassador, trackDownload);

module.exports = router;