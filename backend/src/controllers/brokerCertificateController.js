const pool = require('../config/db');
const { uploadToS3 } = require('../services/s3Service');

const CERT_PRICE = 2000;

exports.getMyCertificate = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, photo_url, cert_no, status, payment_ref, amount_rwf, issued_date, valid_until, created_at, updated_at FROM broker_certificates WHERE broker_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
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
  try {
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
          message: 'Certificate request already submitted. Pay 2,000 RWF to proceed.',
          certificateId: cert.id,
          amount: CERT_PRICE,
        });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO broker_certificates (broker_id, status, amount_rwf) VALUES (?, ?, ?)',
      [req.user.id, 'pending', CERT_PRICE]
    );

    return res.status(201).json({
      message: 'Certificate request submitted. Please pay 2,000 RWF to proceed.',
      certificateId: result.insertId,
      amount: CERT_PRICE,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmPayment = async (req, res) => {
  const { phone } = req.body;
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

    const paymentRef = `BROKER_CERT_${req.user.id}_${Date.now()}`;

    await pool.query(
      'UPDATE broker_certificates SET payment_ref = ?, phone = ? WHERE id = ?',
      [paymentRef, phone, cert.id]
    );

    return res.json({
      message: 'Payment request submitted. Admin will confirm your payment of 2,000 RWF.',
      referenceId: paymentRef,
      certificateId: cert.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
