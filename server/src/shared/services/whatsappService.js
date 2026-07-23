const axios = require('axios');
const mongoose = require('mongoose');

function formatWhatsappBroadcastMessage(post) {
  const title = post.title || 'New Post';
  const category = post.category || 'Sarkari Jobs & Exams';
  const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'blog';
  const siteUrl = 'https://www.digitalhomeblog.in';
  const url = post.url || `${siteUrl}/blog/${catSlug}/${post.slug}`;
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
    message += `👉 ${url}`;
  } else {
    message = `📢 *नया आर्टिकल लाइव! (New Post Alert)* 📢\n\n`;
    message += `💡 *शीर्षक:* ${title}\n\n`;
    message += `🔗 *पूरा आर्टिकल पढ़ने के लिए नीचे क्लिक करें:*\n`;
    message += `👉 ${url}`;
  }

  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  return { message, shareUrl, url };
}

async function sendWhatsappChannelMessage(post) {
  try {
    const formatted = formatWhatsappBroadcastMessage(post);
    console.log(`[WhatsApp Auto-Share] Prepared WhatsApp broadcast for: "${post.title}"`);

    const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;
    const recipientPhone = process.env.WHATSAPP_PHONE || process.env.WHATSAPP_CHANNEL_ID;
    const templateName = process.env.TEMPLATE_NAME || process.env.WHATSAPP_TEMPLATE_NAME || 'job_alert';
    const langCode = process.env.WHATSAPP_TEMPLATE_LANG || 'hi';

    // Meta Cloud API zero-click push
    if (token && phoneId && recipientPhone) {
      console.log(`[WhatsApp Auto-Share] Pushing via Meta WhatsApp Cloud API to ${recipientPhone} (Template: ${templateName})...`);

      try {
        // Try sending approved Message Template (job_alert) with {{1}} and {{2}} parameters
        const templateResponse = await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: langCode },
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

        console.log(`[WhatsApp Auto-Share] Successfully pushed via Meta Cloud API template (${templateName})! ID: ${templateResponse.data?.messages?.[0]?.id || 'OK'}`);
        return { 
          success: true, 
          message: `WhatsApp Push via template ${templateName} delivered successfully!`, 
          shareUrl: formatted.shareUrl, 
          formattedText: formatted.message,
          metaMessageId: templateResponse.data?.messages?.[0]?.id
        };
      } catch (templateErr) {
        const errorDetails = templateErr.response?.data || templateErr.message;
        console.warn(`[WhatsApp Auto-Share] Template (${templateName}) push warning:`, JSON.stringify(errorDetails));
        
        // Fallback to direct text payload if customer service window is open
        console.log('[WhatsApp Auto-Share] Attempting direct text payload fallback...');
        try {
          const textResponse = await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
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
          return {
            success: true,
            message: 'WhatsApp Push delivered via direct text payload!',
            shareUrl: formatted.shareUrl,
            formattedText: formatted.message,
            metaMessageId: textResponse.data?.messages?.[0]?.id
          };
        } catch (textErr) {
          console.error('[WhatsApp Auto-Share] Direct text fallback also failed:', textErr.response?.data || textErr.message);
        }
      }
    } else {
      console.warn('[WhatsApp Auto-Share] Skipping Meta Cloud API trigger: WHATSAPP_TOKEN, PHONE_NUMBER_ID, or WHATSAPP_PHONE is missing.');
    }

    return { success: true, message: 'WhatsApp Push fallback URL prepared.', shareUrl: formatted.shareUrl, formattedText: formatted.message };
  } catch (err) {
    console.error('[WhatsApp Auto-Share] Cloud API trigger exception:', err.response?.data || err.message);
    const formatted = formatWhatsappBroadcastMessage(post);
    return { success: true, shareUrl: formatted.shareUrl, formattedText: formatted.message };
  }
}

async function sendWhatsappDraftAlert(post) {
  try {
    require('../../modules/settings/settings.model'); // Ensure settings schema is loaded
    const Settings = mongoose.model('Settings');
    
    // Check if enabled
    const enabledSetting = await Settings.findOne({ key: 'disableWhatsappNotification' });
    const isWhatsappDisabled = enabledSetting ? enabledSetting.value === true : true; // Default to disabled
    
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
