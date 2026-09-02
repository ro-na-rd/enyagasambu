const { getLeadsForBroker } = require('../services/brokerLeadService');
const { logger } = require('../config/logger');

exports.getLeads = async (req, res) => {
  try {
    const leads = await getLeadsForBroker(req.user.id);
    return res.json({ leads });
  } catch (err) {
    logger.error('[Broker leads error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
