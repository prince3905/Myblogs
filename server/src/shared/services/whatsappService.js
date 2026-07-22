const axios = require('axios');
const mongoose = require('mongoose');

function formatWhatsappBroadcastMessage(post) {
  const title = post.title || 'New Post';
  const category = post.category || 'Sarkari Jobs & Exams';
  const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'blog';
  const siteUrl = 'https://www.digitalhomeblog.in';
  const url = `${siteUrl}/blog/${catSlug}/${post.slug}`;
  const content = post.content || '';
  const cleanContent = content.replace(/<[^>]*>/g, ' ');

  let lastDate = 'Check Notification';
  let qualification = '10th, 12th, Graduate / Check Details';
  let totalPosts = 'Various Posts';

  // Extract total posts
  const postsMatch = cleanContent.match(/(?:कुल पद|Total Posts|Total Vacancy|No. of Posts|Total Vacancies)\s*:?\s*([^\n|•:<>]+)/i);
  if (postsMatch) totalPosts = postsMatch[1].trim();

  // Extract last date
  const dateMatch = cleanContent.match(/(?:अंतिम तिथि|Last Date|last date for apply|Last Date for Apply|आवेदन की अंतिम तिथि)\s*:?\s*([^\n|•:<>]+)/i);
  if (dateMatch) lastDate = dateMatch[1].trim();

  // Extract qualification
  const qualMatch = cleanContent.match(/(?:योग्यता|Eligibility|Qualification|Educational Qualification)\s*:?\s*([^\n|•:<>]+)/i);
  if (qualMatch) qualification = qualMatch[1].trim();

  let message = '';
  if (category === 'Sarkari Jobs & Exams') {
    message = `🔥 *नई सरकारी भर्ती अलर्ट! (New Job Notification)* 🔥\n\n`;
    message += `📝 *पद का नाम:* ${title}\n`;
    message += `📋 *योग्यता (Eligibility):* ${qualification.slice(0, 100)}\n`;
    message += `🔢 *कुल पद (Vacancies):* ${totalPosts.slice(0, 40)}\n`;
    message += `📅 *अंतिम तिथि (Last Date):* ${lastDate.slice(0, 30)}\n\n`;
    message += `📚 पूरी जानकारी और ऑनलाइन आवेदन के लिए नीचे दिए गए लिंक पर क्लिक करें:\n`;
    message += `👉 ${url}\n\n`;
    message += `📲 *ऑफिशियल व्हाट्सएप चैनल ज्वाइन करें:* \nhttps://whatsapp.com/channel/0029VbD4hpfBA1esfvy9gY1Y`;
  } else {
    message = `📢 *नया आर्टिकल लाइव! (New Post Alert)* 📢\n\n`;
    message += `💡 *शीर्षक:* ${title}\n\n`;
    message += `🔗 *पूरा आर्टिकल पढ़ने के लिए नीचे क्लिक करें:*\n`;
    message += `👉 ${url}\n\n`;
    message += `📲 *व्हाट्सएप चैनल ज्वाइन करें:* \nhttps://whatsapp.com/channel/0029VbD4hpfBA1esfvy9gY1Y`;
  }

  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  return { message, shareUrl, url };
}

async function sendWhatsappChannelMessage(post) {
  try {
    const formatted = formatWhatsappBroadcastMessage(post);
    console.log(`[WhatsApp Auto-Share] Prepared WhatsApp broadcast for: "${post.title}"`);

    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const recipientPhone = process.env.WHATSAPP_PHONE || process.env.WHATSAPP_CHANNEL_ID;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'job_alert';

    // Meta Cloud API zero-click push
    if (token && phoneId && recipientPhone) {
      console.log(`[WhatsApp Auto-Share] Pushing via Meta WhatsApp Cloud API to ${recipientPhone}...`);

      try {
        // Try sending approved Message Template (job_alert)
        await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'hi' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: (post.title || 'New Job Alert').slice(0, 100) },
                  { type: 'text', text: formatted.url }
                ]
              }
            ]
          }
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`[WhatsApp Auto-Share] Successfully pushed via Meta Cloud API template (${templateName})!`);
      } catch (templateErr) {
        console.warn(`[WhatsApp Auto-Share] Template (${templateName}) push warning:`, templateErr.response?.data?.error?.message || templateErr.message);
        console.log('[WhatsApp Auto-Share] Falling back to direct text payload...');
        
        // Fallback to direct text payload if customer service window is open
        await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: { body: formatted.message }
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('[WhatsApp Auto-Share] Successfully pushed direct text payload!');
      }
    }

    return { success: true, message: 'WhatsApp Push triggered successfully!', shareUrl: formatted.shareUrl, formattedText: formatted.message };
  } catch (err) {
    console.error('[WhatsApp Auto-Share] Cloud API trigger warning:', err.response?.data || err.message);
    const formatted = formatWhatsappBroadcastMessage(post);
    return { success: true, shareUrl: formatted.shareUrl, formattedText: formatted.message };
  }
}

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

module.exports = { sendWhatsappDraftAlert, sendWhatsappChannelMessage, formatWhatsappBroadcastMessage };
