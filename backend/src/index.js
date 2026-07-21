require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startRenewalScheduler } = require('./services/renewalScheduler');
const { ensureBucket } = require('./services/s3Service');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

ensureBucket();

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
app.use('/api/broker/certificate', require('./routes/brokerCertificate'));
app.use('/api/ambassador/certificate', require('./routes/ambassadorCertificate'));
app.use('/api/admin/certificates', require('./routes/adminCertificates'));
app.use('/api/admin/broker-certificates', require('./routes/adminBrokerCertificates'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/unlock', require('./routes/unlock'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'NMO' }));

const PORT = process.env.PORT || 5000;
startRenewalScheduler();
app.listen(PORT, () => console.log(`NMO API running on port ${PORT}`));
