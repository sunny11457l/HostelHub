const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('./AppError');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file.originalname).toLowerCase());
    if (!ok) return cb(new AppError(400, 'Only JPG, PNG, WEBP or GIF photos are allowed'));
    cb(null, true);
  },
});
