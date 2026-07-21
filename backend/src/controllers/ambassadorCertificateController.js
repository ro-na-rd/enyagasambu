const pool = require('../config/db');
const { randomUUID: uuidv4 } = require('crypto');
const { requestToPay, getPaymentStatus } = require('../services/momoService');
const { uploadToS3 } = require('../services/s3Service');

const CERT_PRICE = 2000;

exports.getMyCertificate = async (req, res) => {
  try {
    let [rows] = await pool.query(
      'SELECT id, photo_url, cert_no, status, payment_ref, amount_rwf, issued_date, valid_until, created_at, updated_at FROM ambassador_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO ambassador_certificates (user_id, status) VALUES (?, ?)',
        [req.user.id, 'pending']
      );
      const [[newCert]] = await pool.query(
        'SELECT id, photo_url, cert_no, status, payment_ref, amount_rwf, issued_date, valid_until, created_at, updated_at FROM ambassador_certificates WHERE id = ?',
        [result.insertId]
      );
      return res.json({ certificate: newCert });
    }

    return res.json({ certificate: rows[0] });
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
      'SELECT id, status FROM ambassador_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (existing.length > 0 && existing[0].status === 'pending') {
      await pool.query('UPDATE ambassador_certificates SET photo_url = ? WHERE id = ?', [photoUrl, existing[0].id]);
      return res.json({ message: 'Photo updated', certificateId: existing[0].id, photo_url: photoUrl });
    }

    const [result] = await pool.query(
      'INSERT INTO ambassador_certificates (user_id, photo_url, status) VALUES (?, ?, ?)',
      [req.user.id, photoUrl, 'pending']
    );

    return res.status(201).json({ message: 'Photo uploaded', certificateId: result.insertId, photo_url: photoUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.initiatePayment = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number required for MoMo payment' });

  try {
    let [rows] = await pool.query(
      'SELECT id, status FROM ambassador_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    let cert;
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO ambassador_certificates (user_id, status) VALUES (?, ?)',
        [req.user.id, 'pending']
      );
      cert = { id: result.insertId, status: 'pending' };
    } else {
      cert = rows[0];
      if (cert.status === 'generated') return res.status(400).json({ message: 'Certificate already generated' });
      if (cert.status === 'paid') return res.status(400).json({ message: 'Payment already completed' });
    }

    const referenceId = uuidv4();

    await pool.query(
      'UPDATE ambassador_certificates SET payment_ref = ? WHERE id = ?',
      [referenceId, cert.id]
    );

    await requestToPay({
      referenceId,
      amount: CERT_PRICE,
      payerPhone: phone.replace(/\s+/g, ''),
      payerMessage: 'Ambassador Certificate Fee',
      payeeNote: 'E-Nyagasambu Ambassador Certificate – 2,000 RWF',
    });

    return res.json({
      message: 'Payment request sent. Check your phone and approve the MoMo prompt.',
      referenceId,
      certificateId: cert.id,
    });
  } catch (err) {
    console.error('[Cert MoMo initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to reach MTN. Please try again.' });
  }
};

exports.checkPayment = async (req, res) => {
  const { referenceId } = req.params;

  try {
    const [[cert]] = await pool.query(
      'SELECT id, status, payment_ref FROM ambassador_certificates WHERE payment_ref = ? AND user_id = ?',
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
        "SELECT COUNT(*) AS cnt FROM ambassador_certificates WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL",
        [year]
      );
      const certNo = `ENA-AMB-${year}-${String(cnt + 1).padStart(4, '0')}`;
      const issuedDate = new Date().toISOString().split('T')[0];
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      const validUntilStr = validUntil.toISOString().split('T')[0];

      await pool.query(
        'UPDATE ambassador_certificates SET status = ?, cert_no = ?, issued_date = ?, valid_until = ? WHERE id = ?',
        ['generated', certNo, issuedDate, validUntilStr, cert.id]
      );
      return res.json({ status: 'generated', cert_no: certNo });
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query(
        'UPDATE ambassador_certificates SET payment_ref = NULL WHERE id = ?',
        [cert.id]
      );
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Cert MoMo check error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not reach MTN to check status.' });
  }
};
