const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireBroker } = require('../middleware/auth');
const ctrl = require('../controllers/brokerStatsController');
const clientsCtrl = require('../controllers/brokerClientsController');
const listingsCtrl = require('../controllers/brokerListingsController');
const commissionsCtrl = require('../controllers/brokerCommissionsController');
const leadsCtrl = require('../controllers/brokerLeadsController');
const reportsCtrl = require('../controllers/brokerReportsController');
const messagesCtrl = require('../controllers/brokerMessagesController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/stats', authenticate, requireBroker, ctrl.getStats);
router.get('/transactions', authenticate, requireBroker, ctrl.getTransactions);
router.get('/clients', authenticate, requireBroker, clientsCtrl.getClients);
router.post('/clients', authenticate, requireBroker, clientsCtrl.createClient);
router.put('/clients/:id', authenticate, requireBroker, clientsCtrl.updateClient);
router.delete('/clients/:id', authenticate, requireBroker, clientsCtrl.deleteClient);

router.get('/listings', authenticate, requireBroker, listingsCtrl.getListings);
router.post('/listings', authenticate, requireBroker, upload.array('images', 6), listingsCtrl.createListing);
router.delete('/listings/:id', authenticate, requireBroker, listingsCtrl.deleteListing);
router.get('/commissions', authenticate, requireBroker, commissionsCtrl.getCommissions);
router.get('/leads', authenticate, requireBroker, leadsCtrl.getLeads);
router.get('/reports', authenticate, requireBroker, reportsCtrl.getReport);

router.get('/messages/conversations', authenticate, requireBroker, messagesCtrl.getConversations);
router.get('/messages/thread', authenticate, requireBroker, messagesCtrl.getThread);
router.post('/messages', authenticate, requireBroker, messagesCtrl.sendMessage);
router.post('/messages/read', authenticate, requireBroker, messagesCtrl.markRead);

module.exports = router;
