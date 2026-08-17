const pool = require('../config/db');
const { randomUUID: uuidv4 } = require('crypto');
const { requestToPay, getPaymentStatus } = require('../services/momoService');
const { uploadToS3 } = require('../services/s3Service');
const { notifyAdmins, notifyUser } = require('../services/notificationService');

const DEFAULT_CERT_PRICE = 2000;
const REFERRAL_REWARD = 200;

async function resolveType(certificateTypeId, category) {
  if (certificateTypeId) {
    const [[type]] = await pool.query(
      'SELECT id, code, name, price_rwf, duration_years FROM certificate_types WHERE id = ? AND active = 1',
      [certificateTypeId]
    );
    if (!type) throw Object.assign(new Error('Certificate type not available'), { status: 400 });
    return type;
  }
  const [[type]] = await pool.query(
    'SELECT id, code, name, price_rwf, duration_years FROM certificate_types WHERE category = ? AND active = 1 ORDER BY price_rwf LIMIT 1',
    [category]
  );
  if (type) return type;
  return { id: null, code: 'BROKER', name: 'Certified Broker', price_rwf: DEFAULT_CERT_PRICE, duration_years: 1 };
}

exports.getMyCertificate = async (req, res) => {
  try {
    const [[userRow]] = await pool.query(
      'SELECT id, name, email, phone, coins, created_at AS registered_date FROM users WHERE id = ?',
      [req.user.id]
    );

    let [rows] = await pool.query(
      `SELECT bc.id, bc.photo_url, bc.cert_no, bc.status, bc.payment_ref, bc.amount_rwf,
              bc.issued_date, bc.valid_until, bc.created_at, bc.updated_at, bc.certificate_type_id,
              ct.name AS type_name, ct.code AS type_code, ct.price_rwf AS type_price, ct.duration_years AS type_duration
       FROM broker_certificates bc
       LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
       WHERE bc.broker_id = ? ORDER BY bc.created_at DESC LIMIT 1`,
      [req.user.id]
    );

    let cert;
    if (rows.length === 0) {
      const type = await resolveType(null, 'broker');
      const [result] = await pool.query(
        'INSERT INTO broker_certificates (broker_id, status, amount_rwf, certificate_type_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'pending', type.price_rwf, type.id]
      );
      const [[newCert]] = await pool.query(
        `SELECT bc.id, bc.photo_url, bc.cert_no, bc.status, bc.payment_ref, bc.amount_rwf,
                bc.issued_date, bc.valid_until, bc.created_at, bc.updated_at, bc.certificate_type_id,
                ct.name AS type_name, ct.code AS type_code, ct.price_rwf AS type_price, ct.duration_years AS type_duration
         FROM broker_certificates bc
         LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
         WHERE bc.id = ?`,
        [result.insertId]
      );
      cert = newCert;
    } else {
      cert = rows[0];
    }

    return res.json({
      certificate: {
        ...cert,
        broker_name: userRow?.name || '',
        broker_email: userRow?.email || '',
        broker_phone: userRow?.phone || '',
        broker_photo: cert.photo_url || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Photo is required' });

    const { url: photoUrl } = await uploadToS3(req.file);

    const [existing] = await pool.query(
      'SELECT id, status FROM broker_certificates WHERE broker_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (existing.length > 0) {
      await pool.query('UPDATE broker_certificates SET photo_url = ? WHERE id = ?', [photoUrl, existing[0].id]);
      return res.json({ message: 'Photo updated', certificateId: existing[0].id, photo_url: photoUrl });
    }

    const [result] = await pool.query(
      'INSERT INTO broker_certificates (broker_id, photo_url, status) VALUES (?, ?, ?)',
      [req.user.id, photoUrl, 'pending']
    );

    return res.status(201).json({ message: 'Photo uploaded', certificateId: result.insertId, photo_url: photoUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.requestCertificate = async (req, res) => {
  const { certificateTypeId, phone } = req.body || {};

  try {
    const type = await resolveType(certificateTypeId, 'broker');

    const [existing] = await pool.query(
      'SELECT id, status FROM broker_certificates WHERE broker_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (existing.length > 0) {
      const cert = existing[0];
      if (cert.status === 'generated') {
        return res.status(400).json({ message: 'Certificate already generated' });
      }
      if (cert.status === 'paid') {
        return res.status(400).json({ message: 'Payment already confirmed. Waiting for admin to generate certificate.' });
      }
      if (cert.status === 'pending') {
        // Update phone if provided
        if (phone) {
          await pool.query('UPDATE broker_certificates SET phone = ? WHERE id = ?', [phone, cert.id]);
        }
        return res.json({
          message: 'Certificate request already submitted. Pay to proceed.',
          certificateId: cert.id,
          amount: type.price_rwf,
          certificateType: type,
        });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO broker_certificates (broker_id, status, amount_rwf, certificate_type_id, phone) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'pending', type.price_rwf, type.id, phone || null]
    );

    notifyAdmins('New broker certificate request', `Broker ${req.user.email || req.user.id} requested a certificate.`, 'certificate', '/admin/broker-certificates');

    return res.status(201).json({
      message: 'Certificate request submitted. Please pay to proceed.',
      certificateId: result.insertId,
      amount: type.price_rwf,
      certificateType: type,
    });
  } catch (err) {
    console.error(err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.initiatePayment = async (req, res) => {
  const { phone, certificateTypeId } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number required for MoMo payment' });

  try {
    const type = await resolveType(certificateTypeId, 'broker');
    const amount = type.price_rwf || DEFAULT_CERT_PRICE;

    let [rows] = await pool.query(
      'SELECT id, status FROM broker_certificates WHERE broker_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    let cert;
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO broker_certificates (broker_id, status, amount_rwf, certificate_type_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'pending', amount, type.id]
      );
      cert = { id: result.insertId, status: 'pending' };
    } else {
      cert = rows[0];
      if (cert.status === 'generated') return res.status(400).json({ message: 'Certificate already generated' });
      if (cert.status === 'paid') return res.status(400).json({ message: 'Payment already completed' });
    }

    const referenceId = uuidv4();

    await pool.query(
      'UPDATE broker_certificates SET payment_ref = ?, phone = ?, amount_rwf = ?, certificate_type_id = ? WHERE id = ?',
      [referenceId, phone, amount, type.id, cert.id]
    );

    await requestToPay({
      referenceId,
      amount,
      payerPhone: phone.replace(/\s+/g, ''),
      payerMessage: 'Broker Certificate Fee',
      payeeNote: `E-Nyagasambu ${type.name} Certificate – ${amount.toLocaleString('en-US')} RWF`,
    });

    notifyAdmins('New broker certificate payment', `Broker ${req.user.email || req.user.id} initiated a certificate payment of ${Number(amount).toLocaleString('en-US')} RWF.`, 'certificate', '/admin/broker-certificates');

    return res.json({
      message: 'Payment request sent. Check your phone and approve the MoMo prompt.',
      referenceId,
      certificateId: cert.id,
      amount,
    });
  } catch (err) {
    console.error('[Broker Cert MoMo initiate error]', err?.response?.data || err.message);
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(502).json({ message: 'Failed to reach MTN. Please try again.' });
  }
};

exports.checkPayment = async (req, res) => {
  const { referenceId } = req.params;

  try {
    const [[cert]] = await pool.query(
      'SELECT id, status, payment_ref FROM broker_certificates WHERE payment_ref = ? AND broker_id = ?',
      [referenceId, req.user.id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate request not found' });

    if (cert.status === 'generated') {
      return res.json({ status: 'generated' });
    }
    if (cert.status === 'paid') {
      return res.json({ status: 'paid' });
    }

    const momoStatus = await getPaymentStatus(referenceId);

    if (momoStatus.status === 'SUCCESSFUL') {
      const year = new Date().getFullYear();
      const [[{ cnt }]] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM broker_certificates WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL",
        [year]
      );
      const certNo = `ENA-BRK-${year}-${String(cnt + 1).padStart(4, '0')}`;
      const issuedDate = new Date().toISOString().split('T')[0];
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      const validUntilStr = validUntil.toISOString().split('T')[0];

      await pool.query(
        'UPDATE broker_certificates SET status = ?, cert_no = ?, issued_date = ?, valid_until = ? WHERE id = ?',
        ['generated', certNo, issuedDate, validUntilStr, cert.id]
      );

      notifyUser(req.user.id, 'Certificate generated', `Your broker certificate ${certNo} is ready.`, 'certificate', '/broker/certificate');

      // Credit referrer with 200 RWF if this user was referred and bonus not yet paid
      const [[referral]] = await pool.query(
        'SELECT referrer_id FROM referrals WHERE referred_id = ? AND bonus_paid = 0 LIMIT 1',
        [req.user.id]
      );
      if (referral) {
        await pool.query('UPDATE users SET coins = coins + ? WHERE id = ?', [REFERRAL_REWARD, referral.referrer_id]);
        await pool.query(
          "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'referral_bonus', ?)",
          [referral.referrer_id, REFERRAL_REWARD, `cert_referral_${req.user.id}`]
        );
        await pool.query('UPDATE referrals SET bonus_paid = 1 WHERE referrer_id = ? AND referred_id = ?', [referral.referrer_id, req.user.id]);
        notifyUser(referral.referrer_id, 'Referral reward earned', `You earned ${REFERRAL_REWARD} RWF for referring a new broker.`, 'reward', '/broker/rewards');
      }

      return res.json({ status: 'generated', cert_no: certNo });
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query(
        'UPDATE broker_certificates SET payment_ref = NULL WHERE id = ?',
        [cert.id]
      );
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Broker Cert MoMo check error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not reach MTN to check status.' });
  }
};

exports.verifyCertificate = async (req, res) => {
  const { certNo } = req.params;

  try {
    const [[cert]] = await pool.query(
      `SELECT bc.cert_no, bc.status, bc.issued_date, bc.valid_until, bc.photo_url,
              u.name AS broker_name, u.email AS broker_email, u.phone AS broker_phone,
              ct.name AS type_name, ct.code AS type_code, ct.duration_years AS type_duration
       FROM broker_certificates bc
       JOIN users u ON bc.broker_id = u.id
       LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
       WHERE bc.cert_no = ?`,
      [certNo]
    );

    if (!cert) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Certificate not found. Please check the certificate number and try again.' 
      });
    }

    if (cert.status !== 'generated') {
      return res.status(400).json({ 
        valid: false, 
        message: 'Certificate is not yet issued. Payment may still be processing.' 
      });
    }

    // Check if certificate is expired
    const today = new Date();
    const validUntil = new Date(cert.valid_until);
    const isExpired = today > validUntil;

    return res.json({
      valid: !isExpired,
      certificate: {
        cert_no: cert.cert_no,
        broker_name: cert.broker_name,
        broker_email: cert.broker_email,
        broker_phone: cert.broker_phone,
        broker_photo: cert.photo_url,
        type_name: cert.type_name || 'Certified Broker',
        type_code: cert.type_code || 'BROKER',
        issued_date: cert.issued_date,
        valid_until: cert.valid_until,
        is_expired: isExpired,
        status: cert.status
      }
    });
  } catch (err) {
    console.error('[Broker certificate verification error]', err);
    return res.status(500).json({ message: 'Server error during verification' });
  }
};
