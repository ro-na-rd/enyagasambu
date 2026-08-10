const { getSummary, getEntries } = require('../services/brokerCommissionService');

exports.getCommissions = async (req, res) => {
  try {
    const [summary, entries] = await Promise.all([
      getSummary(req.user.id),
      getEntries(req.user.id),
    ]);
    return res.json({ summary, entries });
  } catch (err) {
    console.error('[Broker commissions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
