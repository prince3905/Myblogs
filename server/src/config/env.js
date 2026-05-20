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

const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
if (process.env.NODE_ENV === 'production' && siteUrl.includes('localhost')) {
  console.warn('WARNING: SITE_URL is still set to localhost in production! Set SITE_URL env var on Render dashboard.');
}

module.exports = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogging-web-mern',
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  siteUrl,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT || '587',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};
