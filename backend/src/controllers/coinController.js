const { randomUUID: uuidv4 } = require('crypto');
const pool = require('../config/db');
const { requestToPay, getPaymentStatus } = require('../services/momoService');

const COIN_PACKAGES = [
  { id: 1, coins: 500,  price_rwf: 1000, label: '500 coins' },
  { id: 2, coins: 1200, price_rwf: 2000, label: '1,200 coins' },
  { id: 3, coins: 3000, price_rwf: 4500, label: '3,000 coins' },
  { id: 4, coins: 7000, price_rwf: 9000, label: '7,000 coins' },
];

exports.getPackages = (req, res) => res.json({ packages: COIN_PACKAGES });

exports.getBalance = async (req, res) => {
  try {
    const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [req.user.id]);
    const [transactions] = await pool.query(
      'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    return res.json({ coins: user?.coins ?? 0, transactions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── STEP 1: Initiate MTN MoMo payment ───────────────────────────────────────
// The frontend calls this with { packageId, phone }
// We tell MTN to send a USSD prompt to the user's phone.
// MTN returns immediately (status = PENDING) — user approves on their phone.
exports.initiateMomoPayment = async (req, res) => {
  const { packageId, phone } = req.body;
  const pkg = COIN_PACKAGES.find((p) => p.id === parseInt(packageId));
  if (!pkg) return res.status(400).json({ message: 'Invalid package' });
  if (!phone) return res.status(400).json({ message: 'Phone number required for MoMo payment' });

  const referenceId = uuidv4();

  try {
    // Save a pending payment so we can track it
    await pool.query(
      'INSERT INTO momo_payments (user_id, reference_id, package_id, coins, amount_rwf) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, referenceId, pkg.id, pkg.coins, pkg.price_rwf]
    );

    // Tell MTN to prompt the user's phone
    await requestToPay({
      referenceId,
      amount: pkg.price_rwf,
      payerPhone: phone.replace(/\s+/g, ''),
      payerMessage: `NMO: Buy ${pkg.coins} coins`,
      payeeNote: `${pkg.label} – Nyagasambu Market Online`,
    });

    return res.json({
      message: 'Payment request sent. Check your phone and approve the MoMo prompt.',
      referenceId,
    });
  } catch (err) {
    console.error('[MoMo initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to reach MTN. Please try again.' });
  }
};

// ─── STEP 2: Frontend polls this to check if the user approved ───────────────
// Call it every 5 seconds after initiating. Returns status: pending/successful/failed.
exports.checkMomoPayment = async (req, res) => {
  const { referenceId } = req.params;

  try {
    const [[payment]] = await pool.query(
      'SELECT * FROM momo_payments WHERE reference_id = ? AND user_id = ?',
      [referenceId, req.user.id]
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Already processed — return immediately
    if (payment.status === 'successful') {
      const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [req.user.id]);
      return res.json({ status: 'successful', coins: user.coins });
    }
    if (payment.status === 'failed') {
      return res.json({ status: 'failed', message: 'Payment was declined or failed.' });
    }

    // Still pending — ask MTN for current status
    const momoStatus = await getPaymentStatus(referenceId);

    if (momoStatus.status === 'SUCCESSFUL') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('UPDATE momo_payments SET status = ? WHERE reference_id = ?', ['successful', referenceId]);
        await conn.query('UPDATE users SET coins = coins + ? WHERE id = ?', [payment.coins, req.user.id]);
        await conn.query(
          "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'purchase', ?)",
          [req.user.id, payment.coins, `momo_${referenceId}`]
        );
        await conn.commit();

        const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [req.user.id]);
        return res.json({ status: 'successful', coins: user.coins, coinsAdded: payment.coins });
      } catch (dbErr) {
        await conn.rollback();
        throw dbErr;
      } finally {
        conn.release();
      }
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query('UPDATE momo_payments SET status = ? WHERE reference_id = ?', ['failed', referenceId]);
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    // Still PENDING
    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[MoMo check error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not reach MTN to check status.' });
  }
};
