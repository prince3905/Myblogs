const mongoose = require('mongoose');
const app = require('./app');
const env = require('./config/env');
const seedAdmin = require('./shared/utils/seed-admin');

mongoose.connection.on('connected', () => {
  console.log('Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

async function start() {
  await mongoose.connect(env.mongoUri);
  await seedAdmin();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
