const mongoose = require('mongoose');
const axios = require('axios');

async function sendWhatsappDraftAlert(post) {
  try {
    require('../../modules/settings/settings.model'); // Ensure settings schema is loaded
    const Settings = mongoose.model('Settings');
    
    // Check if enabled (we use disableWhatsappNotification to be consistent with other configurations)
    const enabledSetting = await Settings.findOne({ key: 'disableWhatsappNotification' });
    const isWhatsappDisabled = enabledSetting ? enabledSetting.value === true : true; // Default to disabled (true)
    
    if (isWhatsappDisabled) {
      console.log('[WhatsApp Notification] WhatsApp alerts are currently paused in system settings.');
      return { success: false, message: 'WhatsApp notification is disabled.' };
    }
    
    const phoneSetting = await Settings.findOne({ key: 'whatsappPhone' });
    const apiKeySetting = await Settings.findOne({ key: 'whatsappApiKey' });
    
    const phone = phoneSetting ? phoneSetting.value : '';
    const apiKey = apiKeySetting ? apiKeySetting.value : '';
    
    if (!phone || !apiKey) {
      console.warn('[WhatsApp Notification] WhatsApp alerts are enabled but Phone number or API Key is missing in configurations.');
      return { success: false, message: 'Phone number or API Key not configured.' };
    }
    
    const title = post.title || 'New Job Alert';
    const message = `🔔 *New Job Alert Drafted!*\n\n*Title:* ${title}\n*Category:* ${post.category || 'Sarkari Jobs & Exams'}\n\nReview it in the admin panel: \nhttps://www.digitalhomeblog.in/admin/posts/${post._id}/edit`;
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone.replace(/\+/g, '').trim())}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey.trim())}`;
    
    console.log(`[WhatsApp Notification] Pinging WhatsApp alert for: "${title}"`);
    await axios.get(url, { timeout: 10000 });
    console.log('[WhatsApp Notification] WhatsApp alert sent successfully!');
    return { success: true };
    
  } catch (err) {
    console.error('[WhatsApp Notification] CallMeBot API trigger failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsappDraftAlert };
