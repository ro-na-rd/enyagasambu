const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getPromotions = async (req, res) => {
  try {
    const [promotions] = await pool.query(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM promotion_shares ps WHERE ps.promotion_id = p.id) AS share_count
       FROM ambassador_promotions p
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json({ promotions });
  } catch (err) {
    logger.error('[Ambassador promotions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createPromotion = async (req, res) => {
  const { title, description, platform, content } = req.body;
  if (!title || !platform) {
    return res.status(400).json({ message: 'Title and platform are required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO ambassador_promotions (user_id, title, description, platform, content)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title, description || null, platform, content || null]
    );
    const [[promotion]] = await pool.query('SELECT * FROM ambassador_promotions WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Promotion created', promotion });
  } catch (err) {
    logger.error('[Ambassador create promotion error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.trackShare = async (req, res) => {
  const { promotionId } = req.params;
  const { platform } = req.body;
  try {
    const [[promo]] = await pool.query(
      'SELECT id FROM ambassador_promotions WHERE id = ? AND user_id = ?',
      [promotionId, req.user.id]
    );
    if (!promo) return res.status(404).json({ message: 'Promotion not found' });

    await pool.query(
      `INSERT INTO promotion_shares (promotion_id, user_id, platform)
       VALUES (?, ?, ?)`,
      [promotionId, req.user.id, platform || 'copy_link']
    );

    await pool.query(
      'UPDATE ambassador_promotions SET shares = shares + 1 WHERE id = ?',
      [promotionId]
    );

    return res.json({ message: 'Share tracked' });
  } catch (err) {
    logger.error('[Ambassador track share error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getPromoMaterials = async (req, res) => {
  try {
    const [[user]] = await pool.query('SELECT referral_code, name FROM users WHERE id = ?', [req.user.id]);
    const referralCode = user.referral_code || 'AMB' + require('crypto').randomBytes(4).toString('hex').toUpperCase();
    if (!user.referral_code) {
      await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [referralCode, req.user.id]);
    }
    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0];
    return res.json({
      materials: [
        {
          type: 'referral_link',
          title: 'Referral Registration Link',
          content: `${baseUrl}/ambassador/register?ref=${referralCode}`,
          description: 'Share this link for new ambassadors to register with your referral code',
        },
        {
          type: 'whatsapp',
          title: 'WhatsApp Message',
          content: `Join E-Nyagasambu, Rwanda's #1 marketplace! Use my referral code ${referralCode} to sign up as an ambassador. ${baseUrl}/ambassador/register?ref=${referralCode}`,
          description: 'Pre-written message for WhatsApp sharing',
        },
        {
          type: 'social_post',
          title: 'Social Media Post',
          content: `I'm a certified Ambassador for E-Nyagasambu - the smart marketplace! Want to join? Use my code ${referralCode} at ${baseUrl}/ambassador/register?ref=${referralCode} #ENyagasambu #RwandaMarketplace #Ambassador`,
          description: 'Ready-to-share social media content',
        },
        {
          type: 'email',
          title: 'Email Template',
          content: `Subject: Join E-Nyagasambu as an Ambassador!\n\nHi,\n\nI'm an ambassador for E-Nyagasambu, Rwanda's leading online marketplace for buying, selling, and renting.\n\nI'd love for you to join as an ambassador too! Use my referral code: ${referralCode}\n\nRegister here: ${baseUrl}/ambassador/register?ref=${referralCode}\n\nBest regards,\n${user.name}`,
          description: 'Professional email template for outreach',
        },
      ],
      referralCode,
    });
  } catch (err) {
    logger.error('[Ambassador promo materials error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getShareStats = async (req, res) => {
  try {
    const [[{ totalShares }]] = await pool.query(
      `SELECT COUNT(*) AS totalShares FROM promotion_shares WHERE user_id = ?`,
      [req.user.id]
    );
    const [byPlatform] = await pool.query(
      `SELECT platform, COUNT(*) AS count
       FROM promotion_shares
       WHERE user_id = ?
       GROUP BY platform
       ORDER BY count DESC`,
      [req.user.id]
    );
    return res.json({ totalShares, byPlatform });
  } catch (err) {
    logger.error('[Ambassador share stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
