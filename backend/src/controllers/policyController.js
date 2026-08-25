const pool = require('../config/db');

exports.getPolicies = async (req, res) => {
  try {
    const [policies] = await pool.query(
      'SELECT id, title, description, version, created_at FROM ambassador_policies WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    return res.json({ policies });
  } catch (err) {
    console.error('[Policies error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[policy]] = await pool.query(
      'SELECT * FROM ambassador_policies WHERE id = ? AND is_active = TRUE',
      [id]
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    return res.json({ policy });
  } catch (err) {
    console.error('[Policy error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.acknowledgePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const [[policy]] = await pool.query(
      'SELECT * FROM ambassador_policies WHERE id = ? AND is_active = TRUE',
      [id]
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });

    // Check if already acknowledged
    const [[existing]] = await pool.query(
      'SELECT * FROM policy_acknowledgments WHERE ambassador_id = ? AND policy_id = ?',
      [req.user.id, id]
    );
    if (existing) {
      return res.json({ message: 'Policy already acknowledged', acknowledged_at: existing.acknowledged_at });
    }

    // Create acknowledgment
    await pool.query(
      'INSERT INTO policy_acknowledgments (ambassador_id, policy_id, ip_address) VALUES (?, ?, ?)',
      [req.user.id, id, req.ip]
    );

    return res.json({ message: 'Policy acknowledged successfully' });
  } catch (err) {
    console.error('[Acknowledge policy error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAcknowledgmentStatus = async (req, res) => {
  try {
    const [policies] = await pool.query(
      `SELECT p.id, p.title, p.version,
              CASE WHEN pa.id IS NOT NULL THEN TRUE ELSE FALSE END AS acknowledged,
              pa.acknowledged_at
       FROM ambassador_policies p
       LEFT JOIN policy_acknowledgments pa ON pa.policy_id = p.id AND pa.ambassador_id = ?
       WHERE p.is_active = TRUE
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json({ policies });
  } catch (err) {
    console.error('[Policy status error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getComplianceStats = async (req, res) => {
  try {
    const [[{ totalPolicies }]] = await pool.query(
      'SELECT COUNT(*) AS totalPolicies FROM ambassador_policies WHERE is_active = TRUE'
    );
    const [[{ acknowledgedPolicies }]] = await pool.query(
      `SELECT COUNT(*) AS acknowledgedPolicies FROM policy_acknowledgments 
       WHERE ambassador_id = ? AND policy_id IN (SELECT id FROM ambassador_policies WHERE is_active = TRUE)`,
      [req.user.id]
    );

    return res.json({
      stats: {
        totalPolicies: totalPolicies || 0,
        acknowledgedPolicies: acknowledgedPolicies || 0,
        compliancePercentage: totalPolicies ? Math.round((acknowledgedPolicies / totalPolicies) * 100) : 0,
      }
    });
  } catch (err) {
    console.error('[Compliance stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};