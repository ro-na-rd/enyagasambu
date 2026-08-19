const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/teamController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/public', ctrl.getPublic);
router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.post('/', authenticate, requireAdmin, upload.single('photo'), ctrl.create);
router.put('/:id', authenticate, requireAdmin, upload.single('photo'), ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;