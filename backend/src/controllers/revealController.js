const { randomUUID: uuidv4 } = require('crypto');
const pool = require('../config/db');
const { requestToPay, getPaymentStatus } = require('../services/momoService');
const { logger } = require('../config/logger');

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

    try {
      await requestToPay({
        referenceId,
        amount: CONTACT_REVEAL_COST,
        payerPhone: normalizedPhone,
        payerMessage: `NMO contact reveal fee for listing ${listing_id}`,
        payeeNote: 'Nyagasambu Market Online contact reveal',
      });
    } catch (providerError) {
      // Do not leave a payment marked pending when the provider never
      // accepted the collection request.
      await pool.query("UPDATE payments SET status = 'failed' WHERE provider_ref = ? AND status = 'pending'", [referenceId]);
      throw providerError;
    }

    return res.json({ referenceId, amount_rwf: CONTACT_REVEAL_COST });
  } catch (err) {
    logger.error('[Reveal initiate error]', err?.response?.data || err.message);
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
        // Lock the payment row so concurrent browser retries can never apply
        // the same provider confirmation twice.
        const [[lockedPayment]] = await conn.query(
          'SELECT * FROM payments WHERE id = ? FOR UPDATE',
          [payment.id]
        );
        if (!lockedPayment) throw new Error('Payment record disappeared during confirmation');

        if (lockedPayment.status !== 'confirmed') {
          const [[activeListing]] = await conn.query(
            "SELECT id FROM listings WHERE id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) FOR UPDATE",
            [lockedPayment.listing_id]
          );
          if (!activeListing) {
            await conn.query("UPDATE payments SET status = 'failed' WHERE id = ? AND status = 'pending'", [lockedPayment.id]);
            await conn.commit();
            return res.status(409).json({ message: 'Listing is no longer available for contact reveal' });
          }

          await conn.query('UPDATE payments SET status = ? WHERE id = ?', ['confirmed', lockedPayment.id]);
          // The database unique key is the final idempotency guard.
          await conn.query(
            'INSERT IGNORE INTO contact_reveals (listing_id, buyer_phone, payment_ref, amount_rwf) VALUES (?, ?, ?, ?)',
            [lockedPayment.listing_id, lockedPayment.phone, referenceId, lockedPayment.amount_rwf]
          );
        }
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
    logger.error('[Reveal confirm error]', err?.response?.data || err.message);
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
    logger.error('[Reveal check error]', err);
    return res.status(500).json({ message: 'Could not check reveal status' });
  }
};
