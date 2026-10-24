const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const a = require('../controllers/auth.controller');
const t = require('../controllers/ticket.controller');
const n = require('../controllers/notification.controller');
const upload = require('../utils/upload');
const { requireAuth } = require('../middlewares/auth');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

router.post('/auth/register', authLimiter, a.register);
router.post('/auth/login', authLimiter, a.login);
router.get('/auth/me', requireAuth, a.me);

router.use(requireAuth);
router.post('/tickets', upload.single('photo'), t.create);
router.get('/tickets', t.list);
router.get('/tickets/:id', t.getOne);
router.patch('/tickets/:id/assign', t.assign);
router.patch('/tickets/:id/status', t.setStatus);
router.post('/tickets/:id/comments', t.comment);
router.post('/tickets/:id/reopen', t.reopen);
router.post('/tickets/:id/feedback', t.feedback);
router.get('/admin/stats', t.adminStats);
router.get('/notifications', n.listMine);
router.post('/notifications/read', n.markRead);
router.post('/jobs/run-sla', async (req, res, next) => {
  // Manual trigger for demos & tests — same function the cron runs.
  try {
    const { runSLAScan } = require('../jobs/scheduler');
    res.json(await runSLAScan());
  } catch (err) { next(err); }
});

module.exports = router;
