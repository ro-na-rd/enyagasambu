const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, getCampaignStats } = require('../controllers/campaignController');
const { requireAmbassador } = require('../middleware/auth');

router.get('/', requireAmbassador, getCampaigns);
router.get('/stats', requireAmbassador, getCampaignStats);
router.get('/:id', requireAmbassador, getCampaignById);
router.post('/', requireAmbassador, createCampaign);
router.put('/:id', requireAmbassador, updateCampaign);
router.delete('/:id', requireAmbassador, deleteCampaign);

module.exports = router;