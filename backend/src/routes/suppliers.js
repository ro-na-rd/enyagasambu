const router = require('express').Router();
const { authenticate, requireSupplier } = require('../middleware/auth');
const { listSuppliers, myListings } = require('../controllers/supplierController');

router.get('/', listSuppliers);

router.get('/me/listings', authenticate, requireSupplier, myListings);

module.exports = router;
