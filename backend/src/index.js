require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { logger } = require('./config/logger');
const requestId = require('./middleware/requestId');
const httpLogger = require('./middleware/httpLogger');
const errorHandler = require('./middleware/errorHandler');
const { startRenewalScheduler } = require('./services/renewalScheduler');
const { startExpiryScheduler } = require('./services/expiryScheduler');
const { startReminderScheduler } = require('./services/reminderScheduler');
const { startAuctionScheduler } = require('./services/auctionScheduler');
const { startPaymentReconciliationScheduler } = require('./services/paymentReconciliationScheduler');
const { initSocket } = require('./config/socket');
const { waitForS3, ensureBucket } = require('./services/s3Service');
const { checkDatabase } = require('./config/db');

// Local MariaDB installations may intentionally use a blank root password.
// Require the connection identity and database name, but allow DB_PASSWORD to
// be omitted or empty so mysql2 can use passwordless authentication.
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  logger.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if ((process.env.JWT_SECRET || '').length < 32) {
  logger.error('[FATAL] JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

const app = express();
let dependenciesReady = false;
let shuttingDown = false;

app.set('trust proxy', 1);
app.use(helmet());

const clientUrls = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean);
if (clientUrls.length === 0) {
  logger.error('[FATAL] CLIENT_URL must be set in production (comma-separated list of allowed origins)');
  process.exit(1);
}
app.use(cors({ origin: clientUrls, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(requestId);
app.use(httpLogger);

const hits = new Map();

const apiLimiter = (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const max = 20; // 20 requests per minute
  const record = hits.get(key);

  if (!record) {
    hits.set(key, { start: now, count: 1 });
    return next();
  }

  if (now - record.start > windowMs) {
    hits.set(key, { start: now, count: 1 });
    return next();
  }

  record.count++;
  if (record.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.start + windowMs - now) / 1000));
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of hits) {
    if (now - record.start > 60 * 60 * 1000) hits.delete(key);
  }
}, 5 * 60 * 1000).unref();

app.use(apiLimiter);

// Once shutdown starts, do not accept work that may be interrupted halfway
// through. Existing requests are allowed to complete below.
app.use((req, res, next) => {
  if (shuttingDown) {
    res.set('Connection', 'close');
    return res.status(503).json({ message: 'Service is shutting down' });
  }
  return next();
});

async function init() {
  try {
    await checkDatabase();
    await waitForS3();
    await ensureBucket();
  } catch (err) {
    logger.error(`[Startup] Dependency initialization warning: ${err.message}`);
  } finally {
    dependenciesReady = true;
  }
}
init().catch((err) => logger.error(`[Startup] Dependency initialization failed: ${err.message}`));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/seller', require('./routes/sellerAuth'));
app.use('/api/listings/phone-access', require('./routes/phoneListings'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/reveals', require('./routes/reveals'));
app.use('/api/coins', require('./routes/coins'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/auth/broker', require('./routes/brokerAuth'));
app.use('/api/auth/ambassador', require('./routes/ambassadorAuth'));
app.use('/api/auth/supplier', require('./routes/supplierAuth'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/directory', require('./routes/publicDirectory'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/broker/certificate', require('./routes/brokerCertificate'));
app.use('/api/broker', require('./routes/broker'));
app.use('/api/ambassador/certificate', require('./routes/ambassadorCertificate'));
app.use('/api/supplier/certificate', require('./routes/supplierCertificate'));
app.use('/api/admin/certificates', require('./routes/adminCertificates'));
app.use('/api/admin/broker-certificates', require('./routes/adminBrokerCertificates'));
app.use('/api/admin/supplier-certificates', require('./routes/adminSupplierCertificates'));
app.use('/api/admin/certificate-types', require('./routes/adminCertificateTypes'));
app.use('/api/certificate-types', require('./routes/certificateTypes'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/unlock', require('./routes/unlock'));
app.use('/api/contact-access', require('./routes/contactAccess'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/content', require('./routes/content'));
app.use('/api/site-content', require('./routes/siteContent'));
app.use('/api/team', require('./routes/team'));
app.use('/api/home-buttons', require('./routes/homeButtons'));
app.use('/api/location-shares', require('./routes/locationSharing'));
app.use('/api/support', require('./routes/support'));
app.use('/api/tax-advisory', require('./routes/taxAdvisory'));
app.use('/api/stats', require('./routes/stats'));
  app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/ambassador', require('./routes/ambassadorActivities'));
app.use('/api/ambassador/promotions', require('./routes/ambassadorPromotions'));
app.use('/api/ambassador/recruitments', require('./routes/ambassadorRecruitments'));
app.use('/api/ambassador/campaigns', require('./routes/ambassadorCampaigns'));
app.use('/api/ambassador/onboarding', require('./routes/ambassadorOnboarding'));
app.use('/api/ambassador/settings', require('./routes/ambassadorSettings'));
app.use('/api/ambassador/policies', require('./routes/policies'));
app.use('/api/admin/announcements', require('./routes/adminAnnouncements'));
app.use('/api/recycle-bin', require('./routes/recycleBin'));
app.use('/api/executive', require('./routes/executive'));
app.use('/api/newsletter', require('./routes/newsletter'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'NMO' }));
app.get('/api/ready', (req, res) => {
  if (!dependenciesReady || shuttingDown) return res.status(503).json({ status: 'not_ready', platform: 'NMO' });
  return res.json({ status: 'ready', platform: 'NMO' });
});

app.use(errorHandler.notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
if (process.env.ENABLE_SCHEDULERS === 'true') {
  startRenewalScheduler();
  startExpiryScheduler();
  startReminderScheduler();
  startAuctionScheduler();
  startPaymentReconciliationScheduler();
  logger.info('Background schedulers enabled for this process');
} else {
  logger.info('Background schedulers disabled for this process');
}
server.listen(PORT, () => logger.info(`NMO API + Socket.IO running on port ${PORT}`, { port: PORT }));

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  dependenciesReady = false;
  logger.info(`[Shutdown] Received ${signal}. Draining HTTP connections.`);

  // Stop accepting new connections and give in-flight requests time to finish.
  server.close(async (closeError) => {
    if (closeError) logger.error(closeError, { event: 'server_close_failed' });
    try {
      const pool = require('./config/db');
      await pool.end();
      logger.info('[Shutdown] Database pool closed');
    } catch (err) {
      logger.error(err, { event: 'database_pool_close_failed' });
    }
    process.exit(closeError ? 1 : 0);
  });

  // A hung request must not prevent an orchestrator from replacing this process.
  const forceExitTimer = setTimeout(() => {
    logger.error('[Shutdown] Timed out waiting for connections to close');
    process.exit(1);
  }, Number(process.env.SHUTDOWN_TIMEOUT_MS) || 30_000);
  forceExitTimer.unref();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
