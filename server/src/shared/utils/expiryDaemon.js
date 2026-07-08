const mongoose = require('mongoose');

/**
 * Parses Indian date format (dd/mm/yyyy or dd-mm-yyyy) into a JS Date object.
 * @param {string} dateStr - Date string from alert lastDate
 * @returns {Date|null}
 */
function parseIndianDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    return new Date(year, month, day, 23, 59, 59); // End of deadline day
  }
  return null;
}

/**
 * Checks all published posts against their live alert deadlines,
 * marking expired posts as CLOSED/expired.
 */
async function checkAndFlagExpiredPosts() {
  try {
    const BlogPost = mongoose.model('BlogPost');
    const LiveAlert = mongoose.model('LiveAlert');

    const publishedPosts = await BlogPost.find({
      status: 'published',
      title: { $not: /\[आवेदन समाप्त\]|\[CLOSED\]/i }
    });

    console.log(`[Expiry Daemon] Auditing ${publishedPosts.length} published posts for deadlines...`);
    let flaggedCount = 0;

    for (const post of publishedPosts) {
      // Find matching live alert
      const cleanTitle = post.title.split(/[:|]/)[0].trim();
      let alert = await LiveAlert.findOne({ title: cleanTitle });
      if (!alert) {
        alert = await LiveAlert.findOne({
          title: new RegExp(cleanTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
        });
      }

      if (!alert || !alert.lastDate) continue;

      const deadline = parseIndianDate(alert.lastDate);
      if (!deadline) continue;

      // If current date is past the deadline
      if (deadline < new Date()) {
        console.log(`[Expiry Daemon] Post expired: "${post.title}" (Deadline: ${alert.lastDate})`);

        // Prepend warning to title
        post.title = `[आवेदन समाप्त] ${post.title}`;

        // Inject red warning banner at the top of content
        const expiredBanner = `\n<div class="ql-table-embed">
<div class="expired-alert-banner" style="margin: 20px 0; padding: 15px 20px; border-radius: 8px; border: 1px solid #fca5a5; background-color: #fef2f2; color: #b91c1c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.95rem; font-weight: 700; text-align: left; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
  <span style="font-size: 20px;">⚠️</span>
  <span>महत्वपूर्ण सूचना: इस भर्ती के लिए आवेदन करने की अंतिम तिथि (${alert.lastDate.trim()}) समाप्त हो चुकी है। अब ऑनलाइन आवेदन स्वीकार नहीं किए जा रहे हैं।</span>
</div>
</div>\n`;

        // Strip any existing expired alert banners just in case
        let content = post.content || '';
        content = content.replace(/<div[^>]*class=["'](?:ql-table-embed\s+)?expired-alert-banner["'][^]*?<\/div>\s*<\/div>/gi, '');
        content = content.replace(/महत्वपूर्ण सूचना: इस भर्ती के लिए आवेदन[^]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

        // Prepend banner to body
        const firstPEnd = content.indexOf('</p>');
        if (firstPEnd !== -1) {
          content = content.slice(0, firstPEnd + 4) + '\n' + expiredBanner + '\n' + content.slice(firstPEnd + 4);
        } else {
          content = expiredBanner + '\n' + content;
        }

        post.content = content;
        post.markModified('content');
        await post.save();
        flaggedCount++;
      }
    }

    console.log(`[Expiry Daemon] Completed audit. Flagged ${flaggedCount} posts as expired.`);
  } catch (err) {
    console.error('[Expiry Daemon] Error during post expiry check:', err.message);
  }
}

module.exports = { checkAndFlagExpiredPosts };
