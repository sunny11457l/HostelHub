const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [env.CLIENT_ORIGIN, 'http://localhost:5305', 'http://127.0.0.1:5305', 'https://hostel-o5o0vt1mg-sunny14.vercel.app'];
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error('Origin not allowed by CORS'));
    },
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'hostelhub-api' }));

app.use('/api', require('./routes/api.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
