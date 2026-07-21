const router = require('express').Router();
const { body, param } = require('express-validator');
const { initiateReveal, confirmReveal, checkReveal } = require('../controllers/revealController');

router.post('/initiate', [
  body('listing_id').isInt().withMessage('listing_id is required'),
  body('buyer_phone').trim().notEmpty().withMessage('buyer_phone is required'),
], initiateReveal);

router.post('/confirm', [
  body('referenceId').trim().notEmpty().withMessage('referenceId is required'),
], confirmReveal);

router.get('/:buyer_phone/:listing_id', [
  param('buyer_phone').trim().notEmpty().withMessage('buyer_phone is required'),
  param('listing_id').isInt().withMessage('listing_id is required'),
], checkReveal);

module.exports = router;
