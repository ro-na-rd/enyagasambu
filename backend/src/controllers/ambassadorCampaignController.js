const pool = require('../config/db');

exports.getCampaigns = async (req, res) => {
  try {
    const [campaigns] = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM campaign_actions ca WHERE ca.campaign_id = c.id) AS action_count
       FROM ambassador_campaigns c
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return res.json({ campaigns });
  } catch (err) {
    console.error('[Ambassador campaigns error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createCampaign = async (req, res) => {
  const { title, description, target_audience, start_date, end_date } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO ambassador_campaigns (user_id, title, description, target_audience, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description || null, target_audience || 'general', start_date || null, end_date || null]
    );
    const [[campaign]] = await pool.query('SELECT * FROM ambassador_campaigns WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Campaign created', campaign });
  } catch (err) {
    console.error('[Ambassador create campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCampaign = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, target_audience, start_date, end_date } = req.body;
  try {
    const [[camp]] = await pool.query(
      'SELECT id FROM ambassador_campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!camp) return res.status(404).json({ message: 'Campaign not found' });

    const updates = [];
    const values = [];
    if (title) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (status) { updates.push('status = ?'); values.push(status); }
    if (target_audience) { updates.push('target_audience = ?'); values.push(target_audience); }
    if (start_date) { updates.push('start_date = ?'); values.push(start_date); }
    if (end_date) { updates.push('end_date = ?'); values.push(end_date); }
    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    values.push(id);
    await pool.query(`UPDATE ambassador_campaigns SET ${updates.join(', ')} WHERE id = ?`, values);

    const [[updated]] = await pool.query('SELECT * FROM ambassador_campaigns WHERE id = ?', [id]);
    return res.json({ message: 'Updated', campaign: updated });
  } catch (err) {
    console.error('[Ambassador update campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logCampaignAction = async (req, res) => {
  const { campaignId } = req.params;
  const { action_type, description } = req.body;
  try {
    const [[camp]] = await pool.query(
      'SELECT id FROM ambassador_campaigns WHERE id = ? AND user_id = ?',
      [campaignId, req.user.id]
    );
    if (!camp) return res.status(404).json({ message: 'Campaign not found' });

    await pool.query(
      `INSERT INTO campaign_actions (campaign_id, user_id, action_type, description)
       VALUES (?, ?, ?, ?)`,
      [campaignId, req.user.id, action_type || 'general', description || null]
    );
    return res.json({ message: 'Action logged' });
  } catch (err) {
    console.error('[Ambassador log campaign action error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCampaignStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ambassador_campaigns WHERE user_id = ?`,
      [req.user.id]
    );
    const [[{ active }]] = await pool.query(
      `SELECT COUNT(*) AS active FROM ambassador_campaigns WHERE user_id = ? AND status = 'active'`,
      [req.user.id]
    );
    const [[{ completed }]] = await pool.query(
      `SELECT COUNT(*) AS completed FROM ambassador_campaigns WHERE user_id = ? AND status = 'completed'`,
      [req.user.id]
    );
    const [[{ totalActions }]] = await pool.query(
      `SELECT COUNT(*) AS totalActions FROM campaign_actions ca
       JOIN ambassador_campaigns c ON c.id = ca.campaign_id
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    return res.json({ total, active, completed, totalActions });
  } catch (err) {
    console.error('[Ambassador campaign stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCampaign = async (req, res) => {
  const { id } = req.params;
  try {
    const [[camp]] = await pool.query(
      'SELECT id FROM ambassador_campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!camp) return res.status(404).json({ message: 'Campaign not found' });
    await pool.query('DELETE FROM campaign_actions WHERE campaign_id = ?', [id]);
    await pool.query('DELETE FROM ambassador_campaigns WHERE id = ?', [id]);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[Ambassador delete campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
