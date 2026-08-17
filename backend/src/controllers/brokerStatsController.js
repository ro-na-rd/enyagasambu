const pool = require('../config/db');
const { getSummary, getEntries } = require('../services/brokerCommissionService');

exports.getStats = async (req, res) => {
  try {
    const brokerId = req.user.id;

    const [[{ totalClients }]] = await pool.query(
      'SELECT COUNT(*) AS totalClients FROM broker_clients WHERE broker_id = ?',
      [brokerId]
    );
    const [[{ clientsThisMonth }]] = await pool.query(
      'SELECT COUNT(*) AS clientsThisMonth FROM broker_clients WHERE broker_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)',
      [brokerId]
    );

    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE user_id = ? AND status = 'active' AND expires_at > NOW()",
      [brokerId]
    );
    const [[{ activeThisWeek }]] = await pool.query(
      "SELECT COUNT(*) AS activeThisWeek FROM listings WHERE user_id = ? AND status = 'active' AND expires_at > NOW() AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
      [brokerId]
    );
    const [[{ pendingListings }]] = await pool.query(
      "SELECT COUNT(*) AS pendingListings FROM listings WHERE user_id = ? AND (status = 'expired' OR (status = 'active' AND expires_at <= NOW()))",
      [brokerId]
    );

    const [[{ completedDeals }]] = await pool.query(
      "SELECT COUNT(*) AS completedDeals FROM listings WHERE user_id = ? AND status = 'sold'",
      [brokerId]
    );
    const [[{ dealsThisQuarter }]] = await pool.query(
      "SELECT COUNT(*) AS dealsThisQuarter FROM listings WHERE user_id = ? AND status = 'sold' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)",
      [brokerId]
    );

    const [[{ expiringSoon }]] = await pool.query(
      'SELECT COUNT(*) AS expiringSoon FROM listings WHERE user_id = ? AND status = ? AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)',
      [brokerId, 'active']
    );

    const commission = await getSummary(brokerId);

    return res.json({
      stats: {
        totalClients,
        clientsThisMonth,
        activeListings,
        activeThisWeek,
        pendingListings,
        completedDeals,
        dealsThisQuarter,
        pendingTransactions: expiringSoon,
        totalCommission: commission.totalCommission,
        commissionThisMonth: commission.commissionThisMonth,
      },
    });
  } catch (err) {
    console.error('[Broker stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const brokerId = req.user.id;

    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.price, l.status, l.created_at, l.client_name,
              c.name AS client_name_ref, cat.name AS category
       FROM listings l
       LEFT JOIN broker_clients c ON c.id = l.client_id
       LEFT JOIN categories cat ON cat.id = l.category_id
       WHERE l.user_id = ? AND l.status IN ('active', 'sold') AND l.expires_at > NOW()
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [brokerId]
    );

    const transactions = rows.map((r) => {
      const completed = r.status === 'sold';
      return {
        id: 'TXN-' + String(r.id).padStart(5, '0'),
        type: r.category || 'Property',
        client: r.client_name || r.client_name_ref || '—',
        property: r.title,
        amount: Number(r.price) || 0,
        status: completed ? 'Completed' : 'In Progress',
        date: r.created_at,
      };
    });

    const stats = transactions.reduce(
      (acc, t) => {
        acc.total += 1;
        acc.volume += t.amount;
        if (t.status === 'Completed') acc.completed += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, volume: 0, completed: 0, pending: 0 }
    );

    return res.json({ transactions, stats });
  } catch (err) {
    console.error('[Broker transactions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
