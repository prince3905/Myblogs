const mongoose = require('mongoose');
const app = require('./app');
const env = require('./config/env');
const seedAdmin = require('./shared/utils/seed-admin');
const { initScheduler } = require('./modules/liveAlerts/liveAlert.cron');

mongoose.connection.on('connected', () => {
  console.log('Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

async function start() {
  await mongoose.connect(env.mongoUri);
  await seedAdmin();
  initScheduler();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    if (app.buildHomepageHtml) {
      app.buildHomepageHtml().then(() => {
        console.log('[Cache] Pre-warmed homepage HTML cache (Instant 2ms TTFB ready).');
      }).catch(err => {
        console.warn('[Cache] Pre-warm failed:', err.message);
      });
    }
  });
}

start().catch((error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
