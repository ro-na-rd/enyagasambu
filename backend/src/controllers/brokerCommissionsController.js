const { getSummary, getEntries } = require('../services/brokerCommissionService');
const { logger } = require('../config/logger');

exports.getCommissions = async (req, res) => {
  try {
    const [summary, entries] = await Promise.all([
      getSummary(req.user.id),
      getEntries(req.user.id),
    ]);
    return res.json({ summary, entries });
  } catch (err) {
    logger.error('[Broker commissions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
