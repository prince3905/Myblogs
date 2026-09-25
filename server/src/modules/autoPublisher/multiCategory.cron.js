const cron = require('node-cron');
const { publishMultiCategoryPost } = require('./multiCategory.service');
const { logAutomation } = require('../../shared/utils/automationLogger');

/**
 * Multi-Category Automated Publishing Cron Scheduler
 * Natural Cadence: 4 slots staggered across the day (4 hours apart)
 * Timezone: Asia/Kolkata (IST)
 */
function initMultiCategoryCron() {
  console.log('[MultiCategory Cron] Non-job categories (Tech, AI, Health, Finance, News) are deprecated per AGENTS.md Rule #1 & #2. MultiCategory cron safely paused.');
}

module.exports = {
  initMultiCategoryCron
};
