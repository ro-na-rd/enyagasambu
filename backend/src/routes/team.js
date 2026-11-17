const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { canManageStaff } = require('../services/executivePolicyService');

const requireAdminOrExecutiveMgmt = (req, res, next) => {
  const isAdmin = req.user?.role === 'admin';
  const canMgmt = canManageStaff(req.user);
  if (!isAdmin && !canMgmt) {
    return res.status(403).json({ message: 'Admin or CEO/CTO/COO access required' });
  }
  next();
};
const ctrl = require('../controllers/teamController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/public', ctrl.getPublic);
router.get('/', authenticate, requireAdminOrExecutiveMgmt, ctrl.getAll);
router.post('/', authenticate, requireAdminOrExecutiveMgmt, upload.single('photo'), ctrl.create);
router.put('/:id', authenticate, requireAdminOrExecutiveMgmt, upload.single('photo'), ctrl.update);
router.delete('/:id', authenticate, requireAdminOrExecutiveMgmt, ctrl.remove);

module.exports = router;