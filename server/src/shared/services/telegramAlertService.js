const mongoose = require('mongoose');
const axios = require('axios');

async function sendTelegramDraftAlert(post) {
  try {
    require('../../modules/settings/settings.model'); // Ensure settings schema is loaded
    const Settings = mongoose.model('Settings');
    
    // Check if enabled
    const enabledSetting = await Settings.findOne({ key: 'disableTelegramDraftAlert' });
    const isTelegramDisabled = enabledSetting ? enabledSetting.value === true || enabledSetting.value === 'true' : true; // Default to disabled (true)
    
    if (isTelegramDisabled) {
      console.log('[Telegram Private Notification] Private draft alerts are currently paused in system settings.');
      return { success: false, message: 'Telegram private notification is disabled.' };
    }
    
    const chatIdSetting = await Settings.findOne({ key: 'telegramPrivateChatId' });
    const chatId = chatIdSetting ? chatIdSetting.value : '';
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8078376465:AAFeM1wzXr82zIrLDT1zaTkUjabD44RTByE';
    
    if (!chatId) {
      console.warn('[Telegram Private Notification] Private alerts are enabled but Chat ID is missing in configurations.');
      return { success: false, message: 'Private Telegram Chat ID not configured.' };
    }
    
    const title = post.title || 'New Job Alert';
    const message = `🤖 *New Job Alert Drafted!*\n\n*Title:* ${title}\n*Category:* ${post.category || 'Sarkari Jobs & Exams'}\n\nReview & edit in admin panel:\nhttps://www.digitalhomeblog.in/admin/posts/${post._id}/edit`;
    
    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    
    console.log(`[Telegram Private Notification] Pinging Telegram alert for: "${title}" to chat: ${chatId}`);
    await axios.post(url, {
      chat_id: chatId.trim(),
      text: message,
      parse_mode: 'Markdown'
    }, { timeout: 10000 });
    
    console.log('[Telegram Private Notification] Private alert sent successfully!');
    return { success: true };
    
  } catch (err) {
    const errorMsg = err.response && err.response.data && err.response.data.description 
      ? err.response.data.description 
      : err.message;
    console.error('[Telegram Private Notification] Telegram API trigger failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

module.exports = { sendTelegramDraftAlert };
