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
const { startAuctionScheduler } = require('./services/auctionScheduler');
const { initSocket } = require('./config/socket');
const { waitForS3, ensureBucket } = require('./services/s3Service');

const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
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

async function init() {
  await waitForS3();
  await ensureBucket();
}
init().catch((err) => logger.error(`[S3] Initialization failed: ${err.message}`));

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
app.use('/api/support', require('./routes/support'));
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
app.use('/api/ambassador/supplier-recruitments', require('./routes/supplierRecruitments'));
app.use('/api/admin/announcements', require('./routes/adminAnnouncements'));
app.use('/api/recycle-bin', require('./routes/recycleBin'));
app.use('/api/executive', require('./routes/executive'));
app.use('/api/newsletter', require('./routes/newsletter'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'NMO' }));

app.use(errorHandler.notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
startRenewalScheduler();
startExpiryScheduler();
startAuctionScheduler();
server.listen(PORT, () => logger.info(`NMO API + Socket.IO running on port ${PORT}`, { port: PORT }));
