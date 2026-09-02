const pool = require('../config/db');
const { getSummary } = require('../services/brokerCommissionService');
const { getLeadsForBroker } = require('../services/brokerLeadService');
const { logger } = require('../config/logger');

exports.getReport = async (req, res) => {
  try {
    const brokerId = req.user.id;

    const [[{ totalClients }]] = await pool.query(
      'SELECT COUNT(*) AS totalClients FROM broker_clients WHERE broker_id = ?',
      [brokerId]
    );
    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE user_id = ? AND status = 'active' AND expires_at > NOW()",
      [brokerId]
    );
    const [[{ soldListings }]] = await pool.query(
      "SELECT COUNT(*) AS soldListings FROM listings WHERE user_id = ? AND status = 'sold'",
      [brokerId]
    );
    const [[{ pendingListings }]] = await pool.query(
      "SELECT COUNT(*) AS pendingListings FROM listings WHERE user_id = ? AND (status = 'expired' OR (status = 'active' AND expires_at <= NOW()))",
      [brokerId]
    );

    const commission = await getSummary(brokerId);

    const [byCategory] = await pool.query(
      `SELECT c.name AS category, c.type AS category_type, COUNT(*) AS count
       FROM listings l JOIN categories c ON l.category_id = c.id
       WHERE l.user_id = ? AND l.status != 'deleted'
       GROUP BY c.id, c.name, c.type
       ORDER BY count DESC`,
      [brokerId]
    );

    const [monthRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM listings
       WHERE user_id = ? AND status != 'deleted' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [brokerId]
    );

    const [recentClients] = await pool.query(
      `SELECT id, name, email, phone, status, deals, created_at
       FROM broker_clients WHERE broker_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [brokerId]
    );

    const recentLeads = await getLeadsForBroker(brokerId, 5);

    const monthMap = Object.fromEntries(monthRows.map((r) => [r.month, r.count]));
    const byMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.push({
        label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        count: monthMap[key] || 0,
      });
    }

    return res.json({
      summary: {
        totalClients,
        activeListings,
        soldListings,
        pendingListings,
        totalCommission: commission.totalCommission,
        commissionThisMonth: commission.commissionThisMonth,
        totalLeads: recentLeads.length,
      },
      byCategory,
      byMonth,
      recentClients,
      recentLeads,
    });
  } catch (err) {
    logger.error('[Broker report error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
