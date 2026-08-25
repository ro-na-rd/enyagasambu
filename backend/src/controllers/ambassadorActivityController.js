const pool = require('../config/db');
const crypto = require('crypto');

exports.getActivities = async (req, res) => {
  try {
    const [referrals] = await pool.query(
      `SELECT r.bonus_paid, r.created_at, u.name AS referred_name, u.email AS referred_email
       FROM referrals r
       JOIN users u ON u.id = r.referred_id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [notifications] = await pool.query(
      `SELECT title, message, type, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [certs] = await pool.query(
      `SELECT status, cert_no, created_at, issued_date
       FROM ambassador_certificates
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );

    const [recruitments] = await pool.query(
      `SELECT name, type, status, created_at
       FROM ambassador_recruitments
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [promotions] = await pool.query(
      `SELECT title, platform, shares, created_at
       FROM ambassador_promotions
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [campaigns] = await pool.query(
      `SELECT title, status, created_at
       FROM ambassador_campaigns
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [onboardingTasks] = await pool.query(
      `SELECT title, completed, completed_at, created_at
       FROM ambassador_onboarding_tasks
       WHERE user_id = ? AND completed = 1
       ORDER BY completed_at DESC LIMIT 10`,
      [req.user.id]
    );

    const activities = [];

    for (const r of referrals) {
      activities.push({
        type: r.bonus_paid ? 'reward' : 'referral',
        title: r.bonus_paid ? 'Referral reward earned' : 'New referral made',
        description: r.referred_name
          ? `${r.referred_name} (${r.referred_email || 'no email'})`
          : 'New ambassador registered with your code',
        createdAt: r.created_at,
      });
    }

    for (const n of notifications) {
      activities.push({
        type: n.type === 'reward' ? 'reward' : n.type === 'certificate' ? 'certificate' : 'action',
        title: n.title,
        description: n.message || '',
        createdAt: n.created_at,
      });
    }

    for (const c of certs) {
      if (c.cert_no && c.issued_date) {
        activities.push({
          type: 'certificate',
          title: 'Certificate issued',
          description: `${c.cert_no} — valid as of ${new Date(c.issued_date).toLocaleDateString('en-GB')}`,
          createdAt: c.issued_date,
        });
      }
      if (c.status === 'pending') {
        activities.push({
          type: 'action',
          title: 'Certificate requested',
          description: 'Ambassador certificate payment pending',
          createdAt: c.created_at,
        });
      }
    }

    for (const r of recruitments) {
      activities.push({
        type: 'recruitment',
        title: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} recruitment: ${r.name}`,
        description: `Status: ${r.status}`,
        createdAt: r.created_at,
      });
    }

    for (const p of promotions) {
      activities.push({
        type: 'promotion',
        title: `Promotion created: ${p.title}`,
        description: `Shared on ${p.platform} — ${p.shares} share(s)`,
        createdAt: p.created_at,
      });
    }

    for (const c of campaigns) {
      activities.push({
        type: 'campaign',
        title: `Campaign: ${c.title}`,
        description: `Status: ${c.status}`,
        createdAt: c.created_at,
      });
    }

    for (const t of onboardingTasks) {
      activities.push({
        type: 'onboarding',
        title: `Task completed: ${t.title}`,
        description: 'Onboarding progress updated',
        createdAt: t.completed_at || t.created_at,
      });
    }

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ activities: activities.slice(0, 30) });
  } catch (err) {
    console.error('[Ambassador activities error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const [[{ totalReferrals }]] = await pool.query(
      'SELECT COUNT(*) AS totalReferrals FROM referrals WHERE referrer_id = ?',
      [req.user.id]
    );

    const [[{ paidReferrals }]] = await pool.query(
      'SELECT COUNT(*) AS paidReferrals FROM referrals WHERE referrer_id = ? AND bonus_paid = 1',
      [req.user.id]
    );

    const [[{ totalCoins }]] = await pool.query(
      'SELECT coins FROM users WHERE id = ?',
      [req.user.id]
    );

    const [[{ totalEarned }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS totalEarned FROM coin_transactions WHERE user_id = ? AND type = 'referral_bonus'",
      [req.user.id]
    );

    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE user_id = ? AND status = 'active' AND expires_at > NOW()",
      [req.user.id]
    );

    const [[{ totalListings }]] = await pool.query(
      "SELECT COUNT(*) AS totalListings FROM listings WHERE user_id = ? AND status != 'deleted'",
      [req.user.id]
    );

    const [[{ recentReferrals }]] = await pool.query(
      `SELECT COUNT(*) AS recentReferrals FROM referrals WHERE referrer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.user.id]
    );

    const [recentActivity] = await pool.query(
      `SELECT title, message, type, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );

    return res.json({
      stats: {
        totalReferrals,
        paidReferrals,
        totalCoins: totalCoins || 0,
        totalEarned: totalEarned || 0,
        activeListings,
        totalListings,
        recentReferrals,
      },
      recentActivity,
    });
  } catch (err) {
    console.error('[Ambassador dashboard error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getReferralCode = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      'SELECT referral_code FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    let referralCode = user.referral_code;
    if (!referralCode) {
      referralCode = 'AMB' + crypto.randomBytes(4).toString('hex').toUpperCase();
      await pool.query(
        'UPDATE users SET referral_code = ? WHERE id = ?',
        [referralCode, req.user.id]
      );
    }

    return res.json({ referralCode });
  } catch (err) {
    console.error('[Ambassador referral code error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getEarnings = async (req, res) => {
  const { period = 'all' } = req.query;
  let dateFilter = '';
  if (period === 'daily') dateFilter = "AND created_at >= CURDATE()";
  else if (period === 'weekly') dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)";
  else if (period === 'monthly') dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
  else if (period === 'yearly') dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";

  try {
    const [transactions] = await pool.query(
      `SELECT amount, type, reference, created_at
       FROM coin_transactions
       WHERE user_id = ? ${dateFilter}
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const [[{ totalEarned }]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS totalEarned
       FROM coin_transactions
       WHERE user_id = ? AND type = 'referral_bonus' ${dateFilter}`,
      [req.user.id]
    );

    const [[{ totalSpent }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS totalSpent
       FROM coin_transactions
       WHERE user_id = ? AND amount < 0 ${dateFilter}`,
      [req.user.id]
    );

    return res.json({
      transactions,
      summary: {
        totalEarned: totalEarned || 0,
        totalSpent: totalSpent || 0,
        balance: (totalEarned || 0) - (totalSpent || 0),
      },
    });
  } catch (err) {
    console.error('[Ambassador earnings error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const [referrals] = await pool.query(
      `SELECT r.id, r.bonus_paid, r.created_at,
              u.name AS referred_name, u.email AS referred_email, u.phone AS referred_phone,
              ac.cert_no AS referred_cert_no, ac.status AS referred_cert_status
       FROM referrals r
       JOIN users u ON u.id = r.referred_id
       LEFT JOIN ambassador_certificates ac ON ac.user_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    return res.json({ referrals });
  } catch (err) {
    console.error('[Ambassador referrals error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
