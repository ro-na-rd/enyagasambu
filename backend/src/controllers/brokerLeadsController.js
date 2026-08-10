const { getLeadsForBroker } = require('../services/brokerLeadService');

exports.getLeads = async (req, res) => {
  try {
    const leads = await getLeadsForBroker(req.user.id);
    return res.json({ leads });
  } catch (err) {
    console.error('[Broker leads error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
