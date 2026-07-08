const axios = require('axios');

async function sendTelegramMessage(post, actionType = 'URL_UPDATED') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram Auto-Share] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Skipping Telegram notification.');
    return { success: false, message: 'Telegram bot credentials not configured.' };
  }

  // Format clean post text content
  const title = post.title || 'New Post';
  const category = post.category || 'Job Alerts';
  const url = post.canonicalUrl || `${process.env.SITE_URL || 'https://digitalhomeblog.com'}/blog/${post.slug}`;
  const excerpt = post.excerpt || '';

  // Parse details out of post content using regex (like last date, posts count, qualification)
  const cleanContent = (post.content || '').replace(/<[^>]*>/g, ' ');
  
  let lastDate = 'Check Notification';
  let qualification = '10th, 12th, Graduate';
  let totalPosts = 'Various';

  // Quick regex extracts for specs
  const dateMatch = cleanContent.match(/(?:अंतिम तिथि|Last Date|last date for apply|Last Date for Apply|आवेदन की अंतिम तिथि)\s*:?\s*([0-9a-zA-Z\/\-\s,]+)/i);
  if (dateMatch) lastDate = dateMatch[1].trim().slice(0, 30);

  const postsMatch = cleanContent.match(/(?:कुल पद|Total Posts|Total Vacancy|No. of Posts|Total Vacancies)\s*:?\s*([0-9,\+]+)/i);
  if (postsMatch) totalPosts = postsMatch[1].trim().slice(0, 15);

  const qualMatch = cleanContent.match(/(?:योग्यता|Eligibility|Qualification|Educational Qualification)\s*:?\s*([0-9a-zA-Z\/\-\s,\+]+)/i);
  if (qualMatch) qualification = qualMatch[1].trim().slice(0, 50);

  // Dynamic Hindi/Hinglish template for maximum CTR
  let message = '';
  if (category === 'Sarkari Jobs & Exams') {
    message = `<b>🔥 नई सरकारी भर्ती अलर्ट! (New Job Notification) 🔥</b>\n\n`;
    message += `📝 <b>पद का नाम:</b> ${title}\n`;
    message += `📋 <b>योग्यता (Eligibility):</b> ${qualification}\n`;
    message += `🔢 <b>कुल पद (Vacancies):</b> ${totalPosts}\n`;
    message += `📅 <b>अंतिम तिथि (Last Date):</b> ${lastDate}\n\n`;
    message += `📚 पूरी जानकारी, सिलेबस और डायरेक्ट ऑनलाइन आवेदन के लिए नीचे दिए गए लिंक पर क्लिक करें:\n`;
    message += `👉 <a href="${url}">यहाँ क्लिक करें (Click Here to Apply)</a>\n\n`;
    message += `<i>🎯 सबसे तेज अपडेट्स के लिए शेयर करें! @digitalhomeblog</i>`;
  } else {
    message = `<b>📢 नया आर्टिकल लाइव! (New Post Alert) 📢</b>\n\n`;
    message += `💡 <b>शीर्षक (Title):</b> ${title}\n`;
    if (excerpt) {
      message += `📝 <b>संक्षेप (Summary):</b> ${excerpt.slice(0, 150)}...\n\n`;
    }
    message += `🔗 <b>पूरा आर्टिकल पढ़ने के लिए नीचे क्लिक करें:</b>\n`;
    message += `👉 <a href="${url}">पढ़ें पूरा पोस्ट (Read Full Article)</a>\n\n`;
    message += `<i>🔔 जुड़े रहें हमारे साथ: @digitalhomeblog</i>`;
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }, { timeout: 10000 });

    console.log('[Telegram Auto-Share] Successfully shared post to Telegram!');
    return { success: true, data: response.data };
  } catch (err) {
    console.error('[Telegram Auto-Share] Sharing failed:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

module.exports = { sendTelegramMessage };
