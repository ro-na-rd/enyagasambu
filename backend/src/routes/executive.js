const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { executiveRateLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/executiveController');

router.use(authenticate, requireAdmin, executiveRateLimiter);

router.get('/ceo', ctrl.getCEODashboard);
router.get('/cio', ctrl.getCIODashboard);
router.get('/cio/health', ctrl.getCIOHealth);
router.get('/coo', ctrl.getCOODashboard);
router.get('/cmo', ctrl.getCMODashboard);
router.get('/cfo', ctrl.getCFODashboard);
router.get('/audit-log', ctrl.getAuditLog);
router.get('/approvals', ctrl.getApprovals);
router.post('/approvals/:id/review', ctrl.reviewApproval);

router.get('/alerts', ctrl.getAlerts);
router.post('/alerts/:id/dismiss', ctrl.dismissAlert);
router.post('/approvals/create', ctrl.createApproval);
router.get('/approvals/filter', ctrl.getApprovalsByType);
router.get('/export', ctrl.exportDashboardData);
router.get('/permissions/:role', ctrl.getRolePermissions);

router.get('/staff', ctrl.listStaff);
router.post('/staff', ctrl.createStaff);
router.put('/staff/:id', ctrl.updateStaff);
router.delete('/staff/:id', ctrl.deleteStaff);
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.post('/change-password', ctrl.changePassword);

module.exports = router;
