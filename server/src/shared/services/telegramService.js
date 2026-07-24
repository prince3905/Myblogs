const axios = require('axios');

async function sendTelegramMessage(post, actionType = 'URL_UPDATED') {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8078376465:AAFeM1wzXr82zIrLDT1zaTkUjabD44RTByE';
  const chatId = process.env.TELEGRAM_CHAT_ID || '@SarkariJob_DigitalHome';

  if (!token || !chatId) {
    console.warn('[Telegram Auto-Share] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Skipping Telegram notification.');
    return { success: false, message: 'Telegram bot credentials not configured.' };
  }

  // Format clean post text content
  const title = post.title || 'New Post';
  const category = post.category || 'Job Alerts';
  const url = post.canonicalUrl || `${process.env.SITE_URL || 'https://digitalhomeblog.com'}/blog/${post.slug}`;
  const excerpt = post.excerpt || '';

  const content = post.content || '';
  const cleanContent = content.replace(/<[^>]*>/g, ' ');

  let lastDate = '';
  let qualification = '';
  let totalPosts = '';

  // 1. Try to parse standard 3-column qualification table rows (Post Name, Total Post, Qualification)
  try {
    const rowRegex = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    let match;
    let candidates = [];
    while ((match = rowRegex.exec(content)) !== null) {
      const postName = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const vacancy = match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const qual = match[3].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Filter out table headers if they matched td by mistake
      if (postName && vacancy && qual && 
          !postName.includes('पोस्ट का नाम') && !postName.includes('Post Name') && 
          !postName.includes('इवेंट') && !postName.includes('Event')) {
        candidates.push({ postName, vacancy, qual });
      }
    }

    if (candidates.length > 0) {
      if (candidates.length === 1) {
        totalPosts = candidates[0].vacancy;
        qualification = candidates[0].qual;
      } else {
        totalPosts = candidates.map(c => `${c.postName}: ${c.vacancy}`).join(', ');
        qualification = candidates.map(c => `${c.postName} -> ${c.qual}`).join(' | ');
      }
    }
  } catch (err) {
    console.error('[Telegram Auto-Share] Table parsing failed:', err.message);
  }

  // 2. Try to parse 2-column event date table (Event Name, Date) for Last Date
  try {
    const row2Regex = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    let match2;
    while ((match2 = row2Regex.exec(content)) !== null) {
      const col1 = match2[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const col2 = match2[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (col1 && col2 && (col1.includes('अंतिम तिथि') || col1.toLowerCase().includes('last date') || col1.includes('आवेदन की अंतिम तिथि'))) {
        lastDate = col2;
      }
    }
  } catch (err) {
    console.error('[Telegram Auto-Share] Date table parsing failed:', err.message);
  }

  // 3. Fallbacks using highlights box HTML matches
  if (!totalPosts) {
    const totalVacancyHtmlMatch = content.match(/कुल पद \(Total Vacancies\)<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (totalVacancyHtmlMatch) totalPosts = totalVacancyHtmlMatch[1].trim();
  }

  if (!lastDate) {
    const lastDateHtmlMatch = content.match(/अंतिम तिथि \(Last Date\)<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (lastDateHtmlMatch) lastDate = lastDateHtmlMatch[1].trim();
  }

  // 4. Final text-based regex fallbacks (Unicode-safe for Hindi/Devanagari characters)
  if (!totalPosts) {
    const postsMatch = cleanContent.match(/(?:कुल पद|Total Posts|Total Vacancy|No. of Posts|Total Vacancies)\s*:?\s*([^\n|•:<>]+)/i);
    totalPosts = postsMatch ? postsMatch[1].trim() : 'Various';
  }

  if (!lastDate) {
    const dateMatch = cleanContent.match(/(?:अंतिम तिथि|Last Date|last date for apply|Last Date for Apply|आवेदन की अंतिम तिथि)\s*:?\s*([^\n|•:<>]+)/i);
    lastDate = dateMatch ? dateMatch[1].trim() : 'Check Notification';
  }

  if (!qualification) {
    const qualMatch = cleanContent.match(/(?:योग्यता|Eligibility|Qualification|Educational Qualification)\s*:?\s*([^\n|•:<>]+)/i);
    qualification = qualMatch ? qualMatch[1].trim() : '10th, 12th, Graduate / Check Notification';
  }

  // Sanitize and trim lengths for Telegram compatibility
  lastDate = lastDate.slice(0, 40);
  totalPosts = totalPosts.slice(0, 50);
  qualification = qualification.slice(0, 150);


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
