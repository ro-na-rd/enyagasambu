require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { startRenewalScheduler } = require('./services/renewalScheduler');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/seller', require('./routes/sellerAuth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/reveals', require('./routes/reveals'));
app.use('/api/coins', require('./routes/coins'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'NMO' }));

const PORT = process.env.PORT || 5000;
startRenewalScheduler();
app.listen(PORT, () => console.log(`NMO API running on port ${PORT}`));
