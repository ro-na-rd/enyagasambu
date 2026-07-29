const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

// GET /api/simulation/status - Check if simulation mode is enabled
router.get('/status', simulationController.getSimulationStatus);

// POST /api/simulation/success - Simulate a successful payment
router.post('/success', simulationController.simulateSuccess);

// POST /api/simulation/failure - Simulate a failed payment
router.post('/failure', simulationController.simulateFailure);

// GET /api/simulation/otp?referenceId=xxx&type=listing|contact - Get simulated OTP code
router.get('/otp', simulationController.getSimulatedOtp);

module.exports = router;
