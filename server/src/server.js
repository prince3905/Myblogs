const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']); } catch (e) {}
const mongoose = require('mongoose');
const app = require('./app');
const env = require('./config/env');
const seedAdmin = require('./shared/utils/seed-admin');
const { initScheduler } = require('./modules/liveAlerts/liveAlert.cron');
const { initCurrentAffairsCron } = require('./modules/currentAffairs/currentAffairs.cron');
const { initMultiCategoryCron } = require('./modules/autoPublisher/multiCategory.cron');
const { initJobGuideCron } = require('./modules/jobGuides/jobGuideAutomation.cron');
const { initGlobalJobsSupervisor } = require('./modules/globalJobs/globalJobsSupervisor.cron');

mongoose.connection.on('connected', () => {
  console.log('Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

async function start() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 50,
    minPoolSize: 5,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
  });
  await seedAdmin();
  initScheduler();
  initCurrentAffairsCron();
  initMultiCategoryCron();
  initJobGuideCron();
  initGlobalJobsSupervisor();
  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    if (app.buildHomepageHtml) {
      app.buildHomepageHtml().then(() => {
        console.log('[Cache] Pre-warmed homepage HTML cache (Instant 2ms TTFB ready).');
      }).catch(err => {
        console.warn('[Cache] Pre-warm failed:', err.message);
      });
    }
  });
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

start().catch((error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
