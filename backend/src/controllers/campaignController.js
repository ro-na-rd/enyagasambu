const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM ambassador_campaigns WHERE ambassador_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const [campaigns] = await pool.query(query, params);
    return res.json({ campaigns });
  } catch (err) {
    logger.error('[Campaigns error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[campaign]] = await pool.query(
      'SELECT * FROM ambassador_campaigns WHERE id = ? AND ambassador_id = ?',
      [id, req.user.id]
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    return res.json({ campaign });
  } catch (err) {
    logger.error('[Campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { title, description, campaign_type, start_date, end_date, target_audience, goals } = req.body;
    
    if (!title || !campaign_type) {
      return res.status(400).json({ message: 'Title and campaign type are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO ambassador_campaigns (ambassador_id, title, description, campaign_type, start_date, end_date, target_audience, goals)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, campaign_type, start_date, end_date, target_audience, goals]
    );

    const [[campaign]] = await pool.query('SELECT * FROM ambassador_campaigns WHERE id = ?', [result.insertId]);
    return res.status(201).json({ campaign });
  } catch (err) {
    logger.error('[Create campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, campaign_type, start_date, end_date, target_audience, status, goals, results } = req.body;

    const [[existing]] = await pool.query(
      'SELECT * FROM ambassador_campaigns WHERE id = ? AND ambassador_id = ?',
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ message: 'Campaign not found' });

    await pool.query(
      `UPDATE ambassador_campaigns 
       SET title = COALESCE(?, title), description = COALESCE(?, description), campaign_type = COALESCE(?, campaign_type),
           start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), target_audience = COALESCE(?, target_audience),
           status = COALESCE(?, status), goals = COALESCE(?, goals), results = COALESCE(?, results)
       WHERE id = ? AND ambassador_id = ?`,
      [title, description, campaign_type, start_date, end_date, target_audience, status, goals, results, id, req.user.id]
    );

    const [[campaign]] = await pool.query('SELECT * FROM ambassador_campaigns WHERE id = ?', [id]);
    return res.json({ campaign });
  } catch (err) {
    logger.error('[Update campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const [[existing]] = await pool.query(
      'SELECT * FROM ambassador_campaigns WHERE id = ? AND ambassador_id = ?',
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ message: 'Campaign not found' });

    await pool.query('DELETE FROM ambassador_campaigns WHERE id = ? AND ambassador_id = ?', [id, req.user.id]);
    return res.json({ message: 'Campaign deleted' });
  } catch (err) {
    logger.error('[Delete campaign error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCampaignStats = async (req, res) => {
  try {
    const [[{ totalCampaigns }]] = await pool.query(
      'SELECT COUNT(*) AS totalCampaigns FROM ambassador_campaigns WHERE ambassador_id = ?',
      [req.user.id]
    );
    const [[{ activeCampaigns }]] = await pool.query(
      "SELECT COUNT(*) AS activeCampaigns FROM ambassador_campaigns WHERE ambassador_id = ? AND status = 'active'",
      [req.user.id]
    );
    const [[{ completedCampaigns }]] = await pool.query(
      "SELECT COUNT(*) AS completedCampaigns FROM ambassador_campaigns WHERE ambassador_id = ? AND status = 'completed'",
      [req.user.id]
    );

    return res.json({
      stats: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
      }
    });
  } catch (err) {
    logger.error('[Campaign stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};