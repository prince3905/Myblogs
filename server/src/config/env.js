const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET === 'change-me' || process.env.JWT_SECRET === 'change-me-now') {
  console.warn('WARNING: JWT_SECRET is using a default value. Please change it in production!');
}

module.exports = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogging-web-mern',
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  siteUrl: process.env.SITE_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};
