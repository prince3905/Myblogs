const cron = require('node-cron');
const { publishMultiCategoryPost } = require('./multiCategory.service');
const { logAutomation } = require('../../shared/utils/automationLogger');

/**
 * Multi-Category Automated Publishing Cron Scheduler
 * Natural Cadence: 4 slots staggered across the day (4 hours apart)
 * Timezone: Asia/Kolkata (IST)
 */
function initMultiCategoryCron() {
  console.log('[MultiCategory Cron] Initializing natural publication schedule for core categories...');

  // Slot 1: 10:30 AM IST -> Tech & Tutorials / AI & Web Tools
  cron.schedule('30 10 * * *', async () => {
    console.log('[MultiCategory Cron] Triggering 10:30 AM IST Tech/AI Slot...');
    try {
      const isEvenDay = new Date().getDate() % 2 === 0;
      const targetCat = isEvenDay ? 'Tech & Tutorials' : 'AI & Web Tools';
      await publishMultiCategoryPost(targetCat);
    } catch (err) {
      console.error('[MultiCategory Cron] Error in 10:30 AM slot:', err.message);
      await logAutomation({
        service: 'MULTI_CATEGORY_AUTO',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 10:30 AM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Slot 2: 02:30 PM IST -> Finance & Business
  cron.schedule('30 14 * * *', async () => {
    console.log('[MultiCategory Cron] Triggering 02:30 PM IST Finance Slot...');
    try {
      await publishMultiCategoryPost('Finance & Business');
    } catch (err) {
      console.error('[MultiCategory Cron] Error in 02:30 PM slot:', err.message);
      await logAutomation({
        service: 'MULTI_CATEGORY_AUTO',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 02:30 PM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Slot 3: 06:30 PM IST -> Health & Wellness
  cron.schedule('30 18 * * *', async () => {
    console.log('[MultiCategory Cron] Triggering 06:30 PM IST Health Slot...');
    try {
      await publishMultiCategoryPost('Health & Wellness');
    } catch (err) {
      console.error('[MultiCategory Cron] Error in 06:30 PM slot:', err.message);
      await logAutomation({
        service: 'MULTI_CATEGORY_AUTO',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 06:30 PM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Slot 4: 09:30 PM IST -> News & Trends
  cron.schedule('30 21 * * *', async () => {
    console.log('[MultiCategory Cron] Triggering 09:30 PM IST News & Trends Slot...');
    try {
      await publishMultiCategoryPost('News & Trends');
    } catch (err) {
      console.error('[MultiCategory Cron] Error in 09:30 PM slot:', err.message);
      await logAutomation({
        service: 'MultiCategoryCron',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 09:30 PM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[MultiCategory Cron] Multi-Category Cron Scheduler successfully registered for 10:30 AM, 02:30 PM, 06:30 PM, and 09:30 PM IST.');
}

module.exports = {
  initMultiCategoryCron
};
