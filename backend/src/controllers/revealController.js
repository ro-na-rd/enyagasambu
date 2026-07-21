const { randomUUID: uuidv4 } = require('crypto');
const pool = require('../config/db');
const { requestToPay, getPaymentStatus } = require('../services/momoService');

const CONTACT_REVEAL_COST = 300;

exports.initiateReveal = async (req, res) => {
  const { listing_id, buyer_phone, provider = 'mtn' } = req.body;
  if (!listing_id || !buyer_phone) return res.status(400).json({ message: 'listing_id and buyer_phone are required' });

  const normalizedPhone = buyer_phone.replace(/\s+/g, '');
  try {
    const [[listing]] = await pool.query(
      'SELECT id, user_id, status FROM listings WHERE id = ? AND status = ? AND expires_at > NOW()',
      [listing_id, 'active']
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found or inactive' });

    const [[existingReveal]] = await pool.query(
      'SELECT id FROM contact_reveals WHERE listing_id = ? AND buyer_phone = ?',
      [listing_id, normalizedPhone]
    );
    if (existingReveal) return res.json({ alreadyUnlocked: true });

    const referenceId = uuidv4();
    await pool.query(
      'INSERT INTO payments (type, phone, provider, amount_rwf, status, provider_ref, listing_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['contact_reveal', normalizedPhone, provider, CONTACT_REVEAL_COST, 'pending', referenceId, listing_id]
    );

    await requestToPay({
      referenceId,
      amount: CONTACT_REVEAL_COST,
      payerPhone: normalizedPhone,
      payerMessage: `NMO contact reveal fee for listing ${listing_id}`,
      payeeNote: 'Nyagasambu Market Online contact reveal',
    });

    return res.json({ referenceId, amount_rwf: CONTACT_REVEAL_COST });
  } catch (err) {
    console.error('[Reveal initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to initiate contact reveal payment' });
  }
};

exports.confirmReveal = async (req, res) => {
  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[payment]] = await pool.query(
      'SELECT * FROM payments WHERE provider_ref = ? AND type = ?',
      [referenceId, 'contact_reveal']
    );
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.status === 'confirmed') {
      const [[seller]] = await pool.query(
        'SELECT u.phone FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?',
        [payment.listing_id]
      );
      return res.json({ sellerPhone: seller?.phone });
    }

    const momoStatus = await getPaymentStatus(referenceId);
    if (momoStatus.status === 'SUCCESSFUL') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('UPDATE payments SET status = ? WHERE id = ?', ['confirmed', payment.id]);
        await conn.query(
          'INSERT INTO contact_reveals (listing_id, buyer_phone, payment_ref, amount_rwf) VALUES (?, ?, ?, ?)',
          [payment.listing_id, payment.phone, referenceId, payment.amount_rwf]
        );
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }

      const [[seller]] = await pool.query(
        'SELECT u.phone FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?',
        [payment.listing_id]
      );
      return res.json({ sellerPhone: seller?.phone });
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['failed', payment.id]);
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Reveal confirm error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not verify payment status' });
  }
};

exports.checkReveal = async (req, res) => {
  const { buyer_phone, listing_id } = req.params;
  if (!buyer_phone || !listing_id) return res.status(400).json({ message: 'buyer_phone and listing_id are required' });

  const normalizedPhone = buyer_phone.replace(/\s+/g, '');
  try {
    const [[reveal]] = await pool.query(
      'SELECT id FROM contact_reveals WHERE listing_id = ? AND buyer_phone = ?',
      [listing_id, normalizedPhone]
    );
    return res.json({ unlocked: !!reveal });
  } catch (err) {
    console.error('[Reveal check error]', err);
    return res.status(500).json({ message: 'Could not check reveal status' });
  }
};