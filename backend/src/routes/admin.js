const router = require('express').Router();
const { authenticate, requireAdmin, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// Read-only: staff + admin can access
router.get('/stats',           authenticate, requireStaff, ctrl.getStats);
router.get('/users',           authenticate, requireStaff, ctrl.getUsers);
router.get('/suppliers',       authenticate, requireStaff, ctrl.listSuppliers);
router.get('/listings',        authenticate, requireStaff, ctrl.getAdminListings);
router.get('/promos',          authenticate, requireStaff, ctrl.getPromos);
router.get('/participants',    authenticate, requireStaff, ctrl.getParticipants);
router.get('/revenue-chart',   authenticate, requireStaff, ctrl.getRevenueChart);
router.get('/connects',            authenticate, requireStaff, ctrl.getConnects);
router.get('/donations',           authenticate, requireStaff, ctrl.getDonations);
router.get('/connects/export',     authenticate, requireStaff, ctrl.exportConnects);
router.patch('/connects/:id/sale-status', authenticate, requireAdmin, ctrl.updateContactSaleStatus);
router.put('/profile',         authenticate, requireStaff, ctrl.updateProfile);

// Mutations: admin only
router.patch('/users/:id/role',  authenticate, requireAdmin, ctrl.updateUserRole);
router.patch('/suppliers/:id/verify', authenticate, requireAdmin, ctrl.verifySupplier);
router.post('/users/:id/coins',  authenticate, requireAdmin, ctrl.grantCoins);
router.patch('/users/:id/free-posting', authenticate, requireAdmin, ctrl.toggleFreePosting);
router.delete('/listings/:id',   authenticate, requireAdmin, ctrl.deleteListing);
router.patch('/listings/:id/status', authenticate, requireAdmin, ctrl.toggleListingStatus);
router.post('/listings',         authenticate, requireAdmin, ctrl.createListing);
router.post('/promos',           authenticate, requireAdmin, ctrl.createPromo);
router.put('/promos/:id',        authenticate, requireAdmin, ctrl.updatePromo);
router.delete('/promos/:id',     authenticate, requireAdmin, ctrl.deletePromo);

module.exports = router;
