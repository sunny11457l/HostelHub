const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');

exports.listMine = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort('-createdAt')
    .populate('ticket', 'code title')
    .limit(50);
  res.json(notifications);
});

exports.markRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ ok: true });
});
