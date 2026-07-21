const pool = require('../config/db');
const crypto = require('crypto');

const REFERRAL_BONUS = 200; // coins given to referrer when referred user registers

function makeCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

exports.getMyReferral = async (req, res) => {
  try {
    let [[user]] = await pool.query('SELECT referral_code FROM users WHERE id = ?', [req.user.id]);

    if (!user.referral_code) {
      const code = makeCode();
      await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [code, req.user.id]);
      user.referral_code = code;
    }

    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM referrals WHERE referrer_id = ?',
      [req.user.id]
    );
    const [[{ earned }]] = await pool.query(
      'SELECT COUNT(*) AS earned FROM referrals WHERE referrer_id = ? AND bonus_paid = 1',
      [req.user.id]
    );

    return res.json({
      referralCode: user.referral_code,
      totalReferrals: count,
      bonusPaid: earned,
      bonusPerReferral: REFERRAL_BONUS,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Called during registration when referral_code is provided
exports.applyReferral = async (conn, referredUserId, referralCode) => {
  const [[referrer]] = await conn.query(
    'SELECT id FROM users WHERE referral_code = ? AND id != ?',
    [referralCode, referredUserId]
  );
  if (!referrer) return;

  await conn.query(
    'INSERT IGNORE INTO referrals (referrer_id, referred_id) VALUES (?, ?)',
    [referrer.id, referredUserId]
  );
  await conn.query('UPDATE users SET coins = coins + ?, referred_by = ? WHERE id = ?', [REFERRAL_BONUS, referrer.id, referredUserId]);
  await conn.query('UPDATE users SET coins = coins + ? WHERE id = ?', [REFERRAL_BONUS, referrer.id]);
  await conn.query(
    "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'referral_bonus', ?)",
    [referrer.id, REFERRAL_BONUS, `referred_${referredUserId}`]
  );
  await conn.query(
    "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'referral_bonus', ?)",
    [referredUserId, REFERRAL_BONUS, `welcome_referral`]
  );
  await conn.query('UPDATE referrals SET bonus_paid = 1 WHERE referrer_id = ? AND referred_id = ?', [referrer.id, referredUserId]);
};
