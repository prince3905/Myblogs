const cron = require('node-cron');
const { publishAutomatedJobGuide } = require('./jobGuideAutomation.service');
const { logAutomation } = require('../../shared/utils/automationLogger');

/**
 * Natural Randomized Jitter (15 to 45 seconds delay)
 */
function waitRandomJitter(minSec = 15, maxSec = 45) {
  const ms = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Job Guide Automated Publishing Cron Scheduler
 * Natural Cadence: 3 Slots staggered across the day
 * Timezone: Asia/Kolkata (IST)
 */
function initJobGuideCron() {
  console.log('[JobGuide Cron] Registering 3 natural daily publication slots (IST)...');

  // Slot 1: 09:30 AM IST -> 🇮🇳 Indian Sarkari Career & Pay Guide
  cron.schedule('30 9 * * *', async () => {
    console.log('[JobGuide Cron] Triggering 09:30 AM IST Indian Sarkari Guide Slot...');
    try {
      await waitRandomJitter(15, 40);
      await publishAutomatedJobGuide('indian');
    } catch (err) {
      console.error('[JobGuide Cron] Error in 09:30 AM slot:', err.message);
      await logAutomation({
        service: 'JOB_GUIDE_CRON',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 09:30 AM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Slot 2: 03:30 PM IST -> 🌍 Global / Expat / UN Pathway Guide
  cron.schedule('30 15 * * *', async () => {
    console.log('[JobGuide Cron] Triggering 03:30 PM IST Global Gov Jobs Guide Slot...');
    try {
      await waitRandomJitter(15, 40);
      await publishAutomatedJobGuide('global');
    } catch (err) {
      console.error('[JobGuide Cron] Error in 03:30 PM slot:', err.message);
      await logAutomation({
        service: 'JOB_GUIDE_CRON',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 03:30 PM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Slot 3: 08:30 PM IST -> 📋 Exam Strategy / Eligibility / Pay Matrix Guide
  cron.schedule('30 20 * * *', async () => {
    console.log('[JobGuide Cron] Triggering 08:30 PM IST Evening Strategy Slot...');
    try {
      await waitRandomJitter(15, 40);
      // Alternate between Indian and Global on odd/even days
      const isEvenDay = new Date().getDate() % 2 === 0;
      await publishAutomatedJobGuide(isEvenDay ? 'indian' : 'global');
    } catch (err) {
      console.error('[JobGuide Cron] Error in 08:30 PM slot:', err.message);
      await logAutomation({
        service: 'JOB_GUIDE_CRON',
        action: 'CRON_ERROR',
        level: 'ERROR',
        message: `Failed in 08:30 PM slot: ${err.message}`
      });
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[JobGuide Cron] ✅ Job Guide Cron Scheduler successfully registered for 09:30 AM, 03:30 PM, and 08:30 PM IST.');
}

module.exports = {
  initJobGuideCron
};
