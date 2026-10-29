const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireAdmin, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/announcementController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/', authenticate, requireStaff, ctrl.adminList);
router.post('/', authenticate, requireStaff, upload.single('image'), ctrl.adminCreate);
router.delete('/:id', authenticate, requireAdmin, ctrl.adminDelete);

module.exports = router;
