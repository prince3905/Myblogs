/**
 * Standalone Database Purge Script: Competitor Links & Mentions
 * Run: node src/shared/utils/purge-competitor-links.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const env = require('../../config/env');

// Register models
require('../../modules/posts/post.model');
require('../../modules/liveAlerts/liveAlert.model');

const { runCompetitorPurge } = require('./purgeCompetitorLinksDaemon');

async function main() {
  console.log('[Purge Script] Connecting to MongoDB:', env.mongoUri.replace(/:[^:@]+@/, ':****@'));
  await mongoose.connect(env.mongoUri);
  console.log('[Purge Script] Database connected successfully.');

  console.log('[Purge Script] Starting deep competitor link purge across BlogPosts & LiveAlerts...');
  const result = await runCompetitorPurge();
  console.log('[Purge Script] Purge complete! Results:', result);

  await mongoose.disconnect();
  console.log('[Purge Script] Database connection closed.');
  process.exit(0);
}

main().catch(err => {
  console.error('[Purge Script] Fatal error:', err);
  process.exit(1);
});
