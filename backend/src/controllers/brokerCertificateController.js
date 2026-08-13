const pool = require('../config/db');
const { uploadToS3 } = require('../services/s3Service');
const { notifyAdmins, notifyUser } = require('../services/notificationService');

const DEFAULT_CERT_PRICE = 2000;

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
    const [rows] = await pool.query(
      `SELECT bc.id, bc.photo_url, bc.cert_no, bc.status, bc.payment_ref, bc.amount_rwf, bc.certificate_type_id,
              bc.issued_date, bc.valid_until, bc.created_at, bc.updated_at,
              ct.name AS type_name, ct.code AS type_code, ct.price_rwf AS type_price, ct.duration_years AS type_duration
       FROM broker_certificates bc
       LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
       WHERE bc.broker_id = ? ORDER BY bc.created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      const type = await resolveType(null, 'broker');
      const [result] = await pool.query(
        'INSERT INTO broker_certificates (broker_id, status, amount_rwf, certificate_type_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'pending', type.price_rwf, type.id]
      );
      const [
        [certificate]
      ] = await pool.query(
        `SELECT bc.id, bc.photo_url, bc.cert_no, bc.status, bc.payment_ref, bc.amount_rwf, bc.certificate_type_id,
                bc.issued_date, bc.valid_until, bc.created_at, bc.updated_at,
                ct.name AS type_name, ct.code AS type_code, ct.price_rwf AS type_price, ct.duration_years AS type_duration
         FROM broker_certificates bc
         LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
         WHERE bc.id = ?`,
        [result.insertId]
      );
      return res.json({ certificate });
    }

    return res.json({ certificate: rows[0] || null });
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
  const { certificateTypeId } = req.body || {};

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
        return res.json({
          message: 'Certificate request already submitted. Pay to proceed.',
          certificateId: cert.id,
          amount: type.price_rwf,
          certificateType: type,
        });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO broker_certificates (broker_id, status, amount_rwf, certificate_type_id) VALUES (?, ?, ?, ?)',
      [req.user.id, 'pending', type.price_rwf, type.id]
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

exports.confirmPayment = async (req, res) => {
  const { phone, certificateTypeId } = req.body || {};
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  try {
    const [rows] = await pool.query(
      'SELECT id, status FROM broker_certificates WHERE broker_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) return res.status(400).json({ message: 'Request certificate first' });
    const cert = rows[0];
    if (cert.status === 'generated') return res.status(400).json({ message: 'Certificate already generated' });
    if (cert.status === 'paid') return res.status(400).json({ message: 'Payment already confirmed' });
    if (cert.status !== 'pending') return res.status(400).json({ message: 'Invalid certificate status' });

    const type = await resolveType(certificateTypeId, 'broker');
    const amount = type.price_rwf || DEFAULT_CERT_PRICE;
    const paymentRef = `BROKER_CERT_${req.user.id}_${Date.now()}`;

    await pool.query(
      'UPDATE broker_certificates SET payment_ref = ?, phone = ?, amount_rwf = ?, certificate_type_id = ? WHERE id = ?',
      [paymentRef, phone, amount, type.id, cert.id]
    );

    return res.json({
      message: `Payment request submitted. Admin will confirm your payment of ${Number(amount).toLocaleString('en-US')} RWF.`,
      referenceId: paymentRef,
      certificateId: cert.id,
      amount,
    });
  } catch (err) {
    console.error(err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: 'Server error' });
  }
};
