const pool = require('../config/db');

const PLANS = {
  free:     { name: 'Free',     coins: 0,    listing_duration_days: 3,  max_active_listings: 5,  can_feature: false },
  standard: { name: 'Standard', coins: 500,  listing_duration_days: 7,  max_active_listings: 20, can_feature: false },
  premium:  { name: 'Premium',  coins: 1200, listing_duration_days: 30, max_active_listings: 100, can_feature: true },
};

exports.getPlans = (req, res) => {
  return res.json({
    plans: Object.entries(PLANS).map(([key, val]) => ({ id: key, ...val })),
  });
};

exports.getMySubscription = async (req, res) => {
  try {
    const [[sub]] = await pool.query(
      'SELECT * FROM seller_subscriptions WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ subscription: sub || { plan: 'free', ...PLANS.free } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.subscribe = async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });
  if (plan === 'free') return res.status(400).json({ message: 'Free plan is default — no action needed' });

  const chosen = PLANS[plan];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[user]] = await conn.query('SELECT coins FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    if (!user || user.coins < chosen.coins) {
      await conn.rollback();
      return res.status(402).json({ message: `You need ${chosen.coins} coins for the ${chosen.name} plan.` });
    }

    await conn.query('UPDATE users SET coins = coins - ? WHERE id = ?', [chosen.coins, req.user.id]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await conn.query(
      `INSERT INTO seller_subscriptions (user_id, plan, listing_duration_days, max_active_listings, can_feature, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE plan = VALUES(plan), listing_duration_days = VALUES(listing_duration_days),
         max_active_listings = VALUES(max_active_listings), can_feature = VALUES(can_feature),
         started_at = NOW(), expires_at = VALUES(expires_at)`,
      [req.user.id, plan, chosen.listing_duration_days, chosen.max_active_listings, chosen.can_feature, expiresAt]
    );

    await conn.query(
      "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'subscription_fee', ?)",
      [req.user.id, -chosen.coins, plan]
    );

    await conn.commit();
    return res.json({ message: `Subscribed to ${chosen.name} plan`, plan });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
