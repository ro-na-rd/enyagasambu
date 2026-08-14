require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { startRenewalScheduler } = require('./services/renewalScheduler');
const { startExpiryScheduler } = require('./services/expiryScheduler');
const { startAuctionScheduler } = require('./services/auctionScheduler');
const { initSocket } = require('./config/socket');
const { waitForS3, ensureBucket } = require('./services/s3Service');

const app = express();

app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((o) => o.trim()),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function init() {
  await waitForS3();
  await ensureBucket();
}
init().catch(err => console.error('[S3] Initialization failed:', err.message));

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
app.use('/api/support', require('./routes/support'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/ambassador', require('./routes/ambassadorActivities'));
app.use('/api/admin/announcements', require('./routes/adminAnnouncements'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'NMO' }));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, _next) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
startRenewalScheduler();
startExpiryScheduler();
startAuctionScheduler();
server.listen(PORT, () => console.log(`NMO API + Socket.IO running on port ${PORT}`));
