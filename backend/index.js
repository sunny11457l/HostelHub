const fs = require('fs');
const path = require('path');
const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const seed = require('./utils/seed');
const User = require('./models/User.model');
const { startScheduler } = require('./jobs/scheduler');

(async () => {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
  const { memory } = await connectDB();
  if (memory && (await User.countDocuments()) === 0) {
    await seed();
    console.log('Demo data seeded (in-memory database was empty).');
  }
  startScheduler();
  app.listen(env.PORT, () => console.log(`HostelHub API listening on http://localhost:${env.PORT} (SLA cron every 5 min)`));
})().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
