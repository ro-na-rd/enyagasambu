require('dotenv').config();

const { startRenewalScheduler } = require('./services/renewalScheduler');
const { startExpiryScheduler } = require('./services/expiryScheduler');
const { startReminderScheduler } = require('./services/reminderScheduler');
const { startAuctionScheduler } = require('./services/auctionScheduler');
const { startPaymentReconciliationScheduler } = require('./services/paymentReconciliationScheduler');
const { logger } = require('./config/logger');

startRenewalScheduler();
startExpiryScheduler();
startReminderScheduler();
startAuctionScheduler();
startPaymentReconciliationScheduler();

logger.info('Background scheduler worker started');
