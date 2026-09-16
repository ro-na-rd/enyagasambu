require('dotenv').config();

const { startRenewalScheduler } = require('./services/renewalScheduler');
const { startExpiryScheduler } = require('./services/expiryScheduler');
const { startAuctionScheduler } = require('./services/auctionScheduler');
const { startPaymentReconciliationScheduler } = require('./services/paymentReconciliationScheduler');
const { logger } = require('./config/logger');

startRenewalScheduler();
startExpiryScheduler();
startAuctionScheduler();
startPaymentReconciliationScheduler();

logger.info('Background scheduler worker started');
