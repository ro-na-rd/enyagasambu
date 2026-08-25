const router = require('express').Router();
const { authenticate, requireAmbassador } = require('../middleware/auth');
const ctrl = require('../controllers/ambassadorCampaignController');

router.get('/', authenticate, requireAmbassador, ctrl.getCampaigns);
router.post('/', authenticate, requireAmbassador, ctrl.createCampaign);
router.put('/:id', authenticate, requireAmbassador, ctrl.updateCampaign);
router.delete('/:id', authenticate, requireAmbassador, ctrl.deleteCampaign);
router.post('/:campaignId/actions', authenticate, requireAmbassador, ctrl.logCampaignAction);
router.get('/stats', authenticate, requireAmbassador, ctrl.getCampaignStats);

module.exports = router;
