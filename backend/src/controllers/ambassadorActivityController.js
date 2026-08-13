const pool = require('../config/db');

exports.getActivities = async (req, res) => {
  try {
    const [referrals] = await pool.query(
      `SELECT r.bonus_paid, r.created_at, u.name AS referred_name, u.email AS referred_email
       FROM referrals r
       JOIN users u ON u.id = r.referred_id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC LIMIT 20`,
      [req.user.id]
    );

    const [notifications] = await pool.query(
      `SELECT title, message, type, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    const [certs] = await pool.query(
      `SELECT status, cert_no, created_at, issued_date
       FROM ambassador_certificates
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
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

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ activities });
  } catch (err) {
    console.error('[Ambassador activities error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
