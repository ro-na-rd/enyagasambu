const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { logger } = require('../config/logger');

exports.getSettings = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT notification_prefs FROM ambassador_settings WHERE user_id = ?`,
      [req.user.id]
    );
    return res.json({
      preferences: user?.notification_prefs ? JSON.parse(user.notification_prefs) : {
        email_referrals: true,
        push_rewards: true,
        weekly_summary: false,
        announcements: true,
      },
    });
  } catch (err) {
    logger.error('[Ambassador get settings error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  const { preferences } = req.body;
  if (!preferences) return res.status(400).json({ message: 'Preferences are required' });
  try {
    const [[existing]] = await pool.query(
      'SELECT id FROM ambassador_settings WHERE user_id = ?',
      [req.user.id]
    );
    if (existing) {
      await pool.query(
        'UPDATE ambassador_settings SET notification_prefs = ? WHERE user_id = ?',
        [JSON.stringify(preferences), req.user.id]
      );
    } else {
      await pool.query(
        'INSERT INTO ambassador_settings (user_id, notification_prefs) VALUES (?, ?)',
        [req.user.id, JSON.stringify(preferences)]
      );
    }
    return res.json({ message: 'Settings saved', preferences });
  } catch (err) {
    logger.error('[Ambassador update settings error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  try {
    const [[user]] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('[Ambassador change password error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT id, name, email, phone, role, referral_code, coins, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    const [referrals] = await pool.query(
      `SELECT r.*, u.name AS referred_name, u.email AS referred_email
       FROM referrals r JOIN users u ON u.id = r.referred_id
       WHERE r.referrer_id = ?`,
      [req.user.id]
    );
    const [certificates] = await pool.query(
      `SELECT * FROM ambassador_certificates WHERE user_id = ?`,
      [req.user.id]
    );
    const [recruitments] = await pool.query(
      `SELECT * FROM ambassador_recruitments WHERE user_id = ?`,
      [req.user.id]
    );
    const [campaigns] = await pool.query(
      `SELECT * FROM ambassador_campaigns WHERE user_id = ?`,
      [req.user.id]
    );
    const [promotions] = await pool.query(
      `SELECT * FROM ambassador_promotions WHERE user_id = ?`,
      [req.user.id]
    );
    const [onboardingTasks] = await pool.query(
      `SELECT * FROM ambassador_onboarding_tasks WHERE user_id = ?`,
      [req.user.id]
    );
    const [settings] = await pool.query(
      `SELECT * FROM ambassador_settings WHERE user_id = ?`,
      [req.user.id]
    );

    return res.json({
      profile: user,
      referrals,
      certificates,
      recruitments,
      campaigns,
      promotions,
      onboardingTasks,
      settings: settings[0] || null,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[Ambassador export data error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
