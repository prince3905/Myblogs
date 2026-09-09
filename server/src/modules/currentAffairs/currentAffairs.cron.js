const cron = require('node-cron');
const CurrentAffairs = require('./currentAffairs.model');
const { generateDailyCurrentAffairs } = require('./currentAffairs.service');

/**
 * Executes the Daily Current Affairs & Quiz Automation
 */
async function runDailyCurrentAffairsJob() {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const dateString = istDate.toISOString().split('T')[0];

  console.log(`[CurrentAffairs Cron] Checking daily current affairs for date: ${dateString}...`);

  try {
    const existing = await CurrentAffairs.findOne({ dateString });
    if (existing) {
      console.log(`[CurrentAffairs Cron] Article for ${dateString} is already published. Skipping.`);
      return;
    }

    console.log(`[CurrentAffairs Cron] Generating long-form capsule & 10 MCQs for ${dateString}...`);
    const generatedData = await generateDailyCurrentAffairs(now);

    const doc = new CurrentAffairs(generatedData);
    await doc.save();
    console.log(`[CurrentAffairs Cron] Successfully published: "${doc.title}" [ID: ${doc._id}]`);

    // 1. Trigger Instant Multi-Engine Indexing Ping
    try {
      const { notifyAllIndexing } = require('../../shared/utils/google-indexing');
      notifyAllIndexing(doc.canonicalUrl, 'URL_UPDATED').catch(() => {});
    } catch (idxErr) {}

    // 2. Broadcast to Telegram Channel (if available)
    try {
      const { sendTelegramMessage } = require('../../shared/services/telegramService');
      const customPayload = {
        title: `📰 ${doc.title}`,
        category: 'Daily Current Affairs',
        canonicalUrl: doc.canonicalUrl,
        summary: doc.summary
      };
      sendTelegramMessage(customPayload).catch(() => {});
    } catch (tgErr) {}

    // 3. Trigger Web Push Notification
    try {
      const { sendPushNotification } = require('../../shared/services/pushNotificationService');
      const pushPayload = {
        title: `⚡ आज का करेंट अफेयर्स & Quiz (${dateString})`,
        summary: doc.summary,
        canonicalUrl: doc.canonicalUrl
      };
      sendPushNotification(pushPayload).catch(() => {});
    } catch (pushErr) {}

  } catch (err) {
    console.error(`[CurrentAffairs Cron] Job execution failed for ${dateString}:`, err.message);
  }
}

/**
 * Initializes the Daily Cron Runner
 * Scheduled at 5:30 AM IST (00:00 UTC) every day
 */
function initCurrentAffairsCron() {
  // Run daily at 00:00 UTC (5:30 AM IST)
  cron.schedule('0 0 * * *', () => {
    console.log('[CurrentAffairs Cron] Daily 5:30 AM IST trigger activated.');
    runDailyCurrentAffairsJob();
  });

  // Also do a gentle startup check after 10 seconds of server boot
  setTimeout(() => {
    runDailyCurrentAffairsJob();
  }, 10000);

  console.log('[CurrentAffairs Cron] Initialized successfully. Scheduled at 5:30 AM IST daily.');
}

module.exports = {
  initCurrentAffairsCron,
  runDailyCurrentAffairsJob
};
